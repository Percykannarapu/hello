import { Inject, Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { mapByExtended, mapToEntity, simpleFlatten } from '@val/common';
import { EsriApi, EsriAppSettings, EsriAppSettingsToken, EsriDomainFactoryService, EsriLayerService, EsriService, LayerDefinition, LayerGroupDefinition, selectors } from '@val/esri';
import { merge, Observable } from 'rxjs';
import { distinctUntilChanged, filter, finalize, map, pairwise, startWith, tap } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { FullAppState } from '../state/app.interfaces';
import { LayerSetupComplete } from '../state/data-shim/data-shim.actions';
import { CreateMapUsageMetric } from '../state/usage/targeting-usage.actions';
import { AppComponentGeneratorService } from './app-component-generator.service';
import { AppLoggingService } from './app-logging.service';
import { AppStateService } from './app-state.service';

@Injectable()
export class AppLayerService {

  private analysisLevelToGroupNameMap = {
    'ZIP': ['zip'],
    'ATZ': ['atz', 'zip'],
    'Digital ATZ': ['digital_atz', 'zip'],
    'PCR': ['pcr', 'zip']
  };

  private pausableWatches: __esri.PausableWatchHandle[] = [];
  private layersWithPOBs = new Set(['ZIP Boundaries', 'ATZ Boundaries', 'Digital ATZ Boundaries', 'PCR Boundaries']);

  constructor(private layerService: EsriLayerService,
              private esriFactory: EsriDomainFactoryService,
              private esri: EsriService,
              private appStateService: AppStateService,
              private generator: AppComponentGeneratorService,
              private logger: AppLoggingService,
              private appConfig: AppConfig,
              @Inject(EsriAppSettingsToken) private esriAppSettings: EsriAppSettings,
              private store$: Store<FullAppState>) {
    this.appStateService.analysisLevel$.pipe(
      filter(al => al != null),
      startWith(''),
      pairwise()
    ).subscribe(([prev, curr]) => this.setDefaultLayerVisibility(prev, curr));
  }

  private setDefaultLayerVisibility(previousAnalysisLevel: string, currentAnalysisLevel: string) : void {
    this.logger.info.log('Setting default layer visibility for', currentAnalysisLevel);
    const previousGroupKeys = this.analysisLevelToGroupNameMap[previousAnalysisLevel] || [];
    const currentGroupKeys = this.analysisLevelToGroupNameMap[currentAnalysisLevel] || [];
    const previousGroupNames = new Set(previousGroupKeys.map(g => this.appConfig.layers[g].group.name));
    const currentGroupNames = new Set(currentGroupKeys.map(g => this.appConfig.layers[g].group.name));
    this.layerService.getAllPortalGroups().forEach(g => {
      if (currentGroupNames.has(g.title)) {
        g.visible = true;
      } else if (previousGroupNames.has(g.title)) {
        g.visible = false;
      }
    });
  }

  public initializeLayers(isBatchMapping: boolean = false) : Observable<__esri.FeatureLayer> {
    const sortedLayerDefs = Object.values(this.appConfig.layers);
    sortedLayerDefs.sort((a, b) => a.group.sortOrder - b.group.sortOrder);
    const results: Observable<__esri.FeatureLayer>[] = [];
    sortedLayerDefs.forEach(layerGroup => {
      const layerObservables = this.initializeLayerGroup(layerGroup, isBatchMapping);
      results.push(...layerObservables);
    });
    return merge(...results, 2).pipe(
      finalize(() => {
        this.updateLabelExpressions(false, isBatchMapping);
        this.resumeLayerWatch(this.pausableWatches);
        // set up sub for future label expression changes
        this.store$.pipe(
          select(selectors.getEsriLabelConfiguration),
          map(config => config.pobEnabled),
          distinctUntilChanged()
        ).subscribe(showPOBs => this.updateLabelExpressions(showPOBs, isBatchMapping));
        this.store$.dispatch(new LayerSetupComplete());
      })
    );
  }

  private initializeLayerGroup(groupDefinition: LayerGroupDefinition, isBatchMapping: boolean) : Observable<__esri.FeatureLayer>[] {
    const layerObservables: Observable<__esri.FeatureLayer>[] = [];
    const group = this.layerService.createPortalGroup(groupDefinition.group.name, false);
    this.addVisibilityWatch(group);
    const layerDefinitions = [ groupDefinition.centroids, groupDefinition.boundaries ].filter(l => l != null);
    layerDefinitions.forEach(layerDef => {
      const layerSortIndex = layerDef.sortOrder || 0;
      const isSimplifiedLayer = isBatchMapping && layerDef.simplifiedId != null;
      const layerId = isSimplifiedLayer ? layerDef.simplifiedId : layerDef.id;
      const layerPipeline = this.layerService.createPortalLayer(layerId, layerDef.name, layerDef.minScale, layerDef.defaultVisibility, { legendEnabled: false }).pipe(
        tap(layer => this.setupIndividualLayer(layer, layerDef)),
        tap(layer => group.add(layer, layerSortIndex)),
      );
      layerObservables.push(layerPipeline);
    });
    return layerObservables;
  }

  private setupIndividualLayer(layer: __esri.FeatureLayer, layerDef: LayerDefinition) : void {
    this.setupLayerPopup(layer, layerDef);
    this.addVisibilityWatch(layer);
    layer.when(currentLayer => {
      if (!currentLayer.title.endsWith('Centroids')) {
        const revisedRenderer = (currentLayer.renderer as __esri.SimpleRenderer).clone();
        revisedRenderer.symbol.color = new EsriApi.Color([ 128, 128, 128, 0.01 ]);
        currentLayer.renderer = revisedRenderer;
      }
    });
  }

  public updateLabelExpressions(showPOBs: boolean, isBatchMode: boolean = false) : void {
    const groupDefs = Object.values(this.appConfig.layers);
    const allLayers = simpleFlatten(groupDefs.map(g => [g.centroids, g.boundaries])).filter(l => l != null);
    const labelLayerMap = mapByExtended(allLayers,
        l => isBatchMode && l.simplifiedId ? l.simplifiedId : l.id,
        l => ({ expression: this.getLabelExpression(l, showPOBs), fontSizeOffset: l.labelFontSizeOffset, colorOverride: l.labelColorOverride }));
    this.esri.setLayerLabelExpressions(mapToEntity(labelLayerMap));
  }

  private getLabelExpression(l: LayerDefinition, showPOBs: boolean) : string {
    if (this.layersWithPOBs.has(l.name)) {
      if (showPOBs) {
        return l.labelExpression;
      } else {
        return `IIF($feature.pob == "B", "", ${l.labelExpression})`;
      }
    } else {
      return l.labelExpression;
    }
  }

  private addVisibilityWatch(layer: __esri.Layer, startPaused: boolean = true) : void {
    const currentWatch = EsriApi.watchUtils.pausable(layer, 'visible', () => this.collectLayerUsage(layer));
    if (startPaused) currentWatch.pause();
    this.pausableWatches.push(currentWatch);
  }

  private setupLayerPopup(newLayer: __esri.FeatureLayer, layerDef: LayerDefinition) : void {
    const popupEnabled = (layerDef.useCustomPopUp === true) || (layerDef.popUpFields.length > 0);
    if (popupEnabled) {
      newLayer.when(() => {
        // const localLayer = (e.layerView.layer as __esri.FeatureLayer);
        newLayer.popupTemplate = this.createPopupTemplate(newLayer, layerDef);
      });
    } else {
      newLayer.popupEnabled = false;
    }
  }

  private createPopupTemplate(target: __esri.FeatureLayer, layerDef: LayerDefinition) : __esri.PopupTemplate {
    const measureThisAction = new EsriApi.ActionButton({
      title: 'Measure Length',
      id: 'measure-this',
      className: 'esri-icon-share'
    });
    const selectThisAction = new EsriApi.ActionButton({
      title: 'Add/Remove Geo',
      id: 'select-this',
      className: 'esri-icon-plus-circled'
    });
    const definedFields = layerDef.useCustomPopUp === true ?
      layerDef.customPopUpDefinition.rootFields.concat(layerDef.customPopUpDefinition.standardFields) :
      layerDef.popUpFields;
    const fieldsToUse = new Set<string>(definedFields);
    const byDefinedFieldIndex = (f1, f2) => definedFields.indexOf(f1.fieldName) - definedFields.indexOf(f2.fieldName);
    const fieldInfos = target.fields.filter(f => fieldsToUse.has(f.name)).map(f => new EsriApi.FieldInfo({ fieldName: f.name, label: f.alias }));
    fieldInfos.sort(byDefinedFieldIndex);
    const result: __esri.PopupTemplateProperties = { title: layerDef.popupTitle, actions: [selectThisAction] };
    if (layerDef.useCustomPopUp === true) {
      result.content = (feature: any) => this.generator.geographyPopupFactory(feature, fieldInfos, layerDef.customPopUpDefinition);
    } else {
      result.content = [{ type: 'fields', fieldInfos: fieldInfos }];
    }
    result.outFields = Array.from(fieldsToUse);
    result.overwriteActions = true;
   return new EsriApi.PopupTemplate(result);
  }

  public clearClientLayers() {
    this.layerService.clearClientLayers('Sites');
    this.layerService.clearClientLayers('Competitors');
  }

  /**
   * Collect usage metrics when a layer is disabled or enabled
   * @param layer The layer to collect usage metrics on
   */
  private collectLayerUsage(layer: __esri.Layer) {
    const actionName = layer.visible ? 'activated' : 'deactivated';
    this.store$.dispatch(new CreateMapUsageMetric('layer-visibility', actionName, layer.title));
  }

  /**
   * Resume watching the visible property on layers with the ESRI watch utils
   * @argument pausableWatches An array of __esri.PausableWatchHandle
   */
  private resumeLayerWatch(pausableWatches: Array<__esri.PausableWatchHandle>) {
    for (const watch of pausableWatches) {
      watch.resume();
    }
  }
}
