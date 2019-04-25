import { Inject, Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { mapByExtended, mapToEntity, simpleFlatten } from '@val/common';
import { EsriApi, EsriAppSettings, EsriAppSettingsToken, EsriDomainFactoryService, EsriLayerService, LayerDefinition, LayerGroupDefinition, selectors, SetLayerLabelExpressions } from '@val/esri';
import { combineLatest, merge, Observable } from 'rxjs';
import { distinctUntilChanged, filter, finalize, map, take, tap } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { FullAppState } from '../state/app.interfaces';
import { RenderLocations } from '../state/rendering/rendering.actions';
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
              private appStateService: AppStateService,
              private generator: AppComponentGeneratorService,
              private logger: AppLoggingService,
              private appConfig: AppConfig,
              @Inject(EsriAppSettingsToken) private esriAppSettings: EsriAppSettings,
              private store$: Store<FullAppState>) {
    this.store$.pipe(
      select(selectors.getMapReady),
      filter(ready => ready),
      take(1)
    ).subscribe(() => {
      this.appStateService.analysisLevel$.subscribe(al => this.setDefaultLayerVisibility(al));
    });

    combineLatest(this.appStateService.applicationIsReady$, this.layerService.layersReady$).pipe(
      filter(([appIsReady, layersReady]) => !appIsReady && layersReady),
      distinctUntilChanged()
    ).subscribe(() => this.clearClientLayers());
  }

  private setDefaultLayerVisibility(currentAnalysisLevel: string) : void {
    this.logger.info('Setting default layer visibility for', currentAnalysisLevel);
   //
    this.layerService.getAllPortalGroups().forEach(g => g.visible = false);
    if (currentAnalysisLevel != null && currentAnalysisLevel.length > 0 ){
      const portalId = this.appConfig.getLayerIdForAnalysisLevel(currentAnalysisLevel, true);
      const groupKeys: string[] = this.analysisLevelToGroupNameMap[currentAnalysisLevel];
      this.logger.debug('New visible groups', groupKeys);
      if (groupKeys != null && groupKeys.length > 0) {
        const layerGroups = groupKeys.map(g => this.appConfig.layers[g]);
        if (layerGroups != null && layerGroups.length > 0) {
          layerGroups.forEach(layerGroup => {
            if (this.layerService.portalGroupExists(layerGroup.group.name)) {
              this.layerService.getPortalGroup(layerGroup.group.name).visible = true;
            }
             /* comment for US9547

             if (layerGroup.boundaries.id !== portalId){
               this.layerService.getPortalLayerById(layerGroup.boundaries.id).popupEnabled = false;
             }*/
          });
        }
      }
    }
  }

  public initializeLayers() : Observable<__esri.FeatureLayer> {
    const sortedLayerDefs = Object.values(this.appConfig.layers);
    sortedLayerDefs.sort((a, b) => a.group.sortOrder - b.group.sortOrder);
    const results: Observable<__esri.FeatureLayer>[] = [];
    sortedLayerDefs.forEach(layerGroup => {
      const layerObservables = this.initializeLayerGroup(layerGroup);
      results.push(...layerObservables);
    });
    return merge(...results, 2).pipe(
      finalize(() => {
        this.updateLabelExpressions(false);
        this.resumeLayerWatch(this.pausableWatches);
        // set up sub for future label expression changes
        this.store$.pipe(
          select(selectors.getEsriLabelConfiguration),
          map(config => config.pobEnabled),
          distinctUntilChanged()
        ).subscribe(showPOBs => this.updateLabelExpressions(showPOBs));
      })
    );
  }

  private initializeLayerGroup(groupDefinition: LayerGroupDefinition) : Observable<__esri.FeatureLayer>[] {
    const layerObservables: Observable<__esri.FeatureLayer>[] = [];
    const group = this.layerService.createPortalGroup(groupDefinition.group.name, false);
    this.addVisibilityWatch(group);
    const layerDefinitions = [ groupDefinition.centroids, groupDefinition.boundaries ].filter(l => l != null);
    layerDefinitions.forEach(layerDef => {
      const layerSortIndex = layerDef.sortOrder || 0;
      const layerPipeline = this.layerService.createPortalLayer(layerDef.id, layerDef.name, layerDef.minScale, layerDef.defaultVisibility).pipe(
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

  private updateLabelExpressions(showPOBs: boolean) : void {
    const groupDefs = Object.values(this.appConfig.layers);
    const allLayers = simpleFlatten(groupDefs.map(g => [g.centroids, g.boundaries])).filter(l => l != null);
    const labelLayerMap = mapByExtended(allLayers, l => l.id, l => ({ expression: this.getLabelExpression(l, showPOBs), fontSizeOffset: l.labelFontSizeOffset, colorOverride: l.labelColorOverride }));
    this.store$.dispatch(new SetLayerLabelExpressions({ expressions: mapToEntity(labelLayerMap) }));
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
