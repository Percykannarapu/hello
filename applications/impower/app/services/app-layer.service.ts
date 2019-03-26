import { Inject, Injectable } from '@angular/core';
import { combineLatest, merge, Observable } from 'rxjs';
import { distinctUntilChanged, filter, finalize, map, tap } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes, TradeAreaMergeTypeCodes, TradeAreaTypeCodes } from '../val-modules/targeting/targeting.enums';
import { AppComponentGeneratorService } from './app-component-generator.service';
import { AppLoggingService } from './app-logging.service';
import { AppStateService } from './app-state.service';
import { select, Store } from '@ngrx/store';
import { FullAppState } from '../state/app.interfaces';
import { CreateMapUsageMetric } from '../state/usage/targeting-usage.actions';
import { EsriApi, EsriAppSettings, EsriAppSettingsToken, EsriLayerService, LayerDefinition, LayerGroupDefinition, selectors, SetLayerLabelExpressions, SetSelectedLayer } from '@val/esri';
import { groupBy, mapToEntity, mapByExtended, simpleFlatten, toUniversalCoordinates } from '@val/common';

const starPath: string = 'M16 4.588l2.833 8.719H28l-7.416 5.387 2.832 8.719L16 22.023l-7.417 5.389 2.833-8.719L4 13.307h9.167L16 4.588z';

const defaultLocationPopupFields = [
  { fieldName: 'locationNumber', label: 'Location Number' },
  { fieldName: 'locAddress', label: 'Address' },
  { fieldName: 'locCity', label: 'City' },
  { fieldName: 'locState', label: 'State' },
  { fieldName: 'locZip', label: 'Zip' },
  { fieldName: 'recordStatusCode', label: 'Geocode Status' },
  { fieldName: 'ycoord', label: 'Latitude' },
  { fieldName: 'xcoord', label: 'Longitude' },
  { fieldName: 'geocoderMatchCode', label: 'Match Code' },
  { fieldName: 'geocoderLocationCode', label: 'Match Quality' },
  { fieldName: 'origAddress1', label: 'Original Address' },
  { fieldName: 'origCity', label: 'Original City' },
  { fieldName: 'origState', label: 'Original State' },
  { fieldName: 'origPostalCode', label: 'Original Zip' },
];

@Injectable()
export class AppLayerService {

  static ObjectIdCache = 0;

  private analysisLevelToGroupNameMap = {
    'ZIP': ['zip'],
    'ATZ': ['atz', 'zip'],
    'Digital ATZ': ['digital_atz', 'zip'],
    'PCR': ['pcr', 'zip']
  };

  private pausableWatches: __esri.PausableWatchHandle[] = [];
  private layersWithPOBs = new Set(['ZIP Boundaries', 'ATZ Boundaries', 'Digital ATZ Boundaries', 'PCR Boundaries']);

  constructor(private layerService: EsriLayerService,
              private appStateService: AppStateService,
              private generator: AppComponentGeneratorService,
              private logger: AppLoggingService,
              private appConfig: AppConfig,
              @Inject(EsriAppSettingsToken) private esriAppSettings: EsriAppSettings,
              private store$: Store<FullAppState>) {
    this.appStateService.activeClientLocations$.subscribe(sites => this.updateSiteLayer(ImpClientLocationTypeCodes.Site, sites));
    this.appStateService.activeCompetitorLocations$.subscribe(competitors => this.updateSiteLayer(ImpClientLocationTypeCodes.Competitor, competitors));

    this.appStateService.analysisLevel$
    //.pipe(filter(al => al != null && al.length > 0))
      .subscribe(al => this.setDefaultLayerVisibility(al));

    combineLatest(this.appStateService.applicationIsReady$, this.layerService.layersReady$).pipe(
      filter(([appIsReady, layersReady]) => !appIsReady && layersReady),
      distinctUntilChanged()
    ).subscribe(() => this.clearClientLayers());
  }

  public updateSiteLayer(siteType: SuccessfulLocationTypeCodes, sites: ImpGeofootprintLocation[]) : void {
    console.log('Updating Site Layer Visuals', [siteType, sites]);
    const groupName = `${siteType}s`;
    const layerName = `Project ${groupName}`;
    const points: __esri.Graphic[] = sites.map(site => this.createSiteGraphic(site));
    if (points.length > 0) {
      if (!(!this.layerService.layerExists(layerName) || !this.layerService.groupExists(groupName))) {
        this.layerService.removeLayer(layerName);
      }
        const color = siteType.toLowerCase() === 'site' ? [35, 93, 186] : [255, 0, 0];
        const layer = this.layerService.createClientLayer(groupName, layerName, points, 'point', true);
        layer.popupTemplate = new EsriApi.PopupTemplate({
          title: '{clientLocationTypeCode}: {locationName}',
          content: [{ type: 'fields' }],
          fieldInfos: defaultLocationPopupFields
        });
        layer.renderer = new EsriApi.SimpleRenderer({
          symbol: new EsriApi.SimpleMarkerSymbol({
            style: 'path',
            size: 12,
            outline: null,
            color: color,
            path: starPath
          })
        });
        const textSymbol: __esri.TextSymbol = new EsriApi.TextSymbol();
        const font = new EsriApi.Font({ family: 'sans-serif', size: 12, weight: 'bold' });
        textSymbol.backgroundColor = new EsriApi.Color({a: 1, r: 255, g: 255, b: 255});
        textSymbol.haloColor = new EsriApi.Color({a: 1, r: 255, g: 255, b: 255});
        const siteColor = new EsriApi.Color({a: 1, r: 35, g: 93, b: 186});
        const competitorColor = new EsriApi.Color({a: 1, r: 255, g: 0, b: 0});
        textSymbol.color = siteType.toLowerCase() === 'site' ? siteColor : competitorColor;
        textSymbol.haloSize = 1;
        textSymbol.font = font;
        const labelClass: __esri.LabelClass = new EsriApi.LabelClass({ 
          symbol: textSymbol,
          labelPlacement: 'below-center',
          labelExpressionInfo: {
              expression: '$feature.locationNumber'
          }
        });
        layer.labelingInfo = [labelClass];
      // else {
        // this.layerService.replaceGraphicsOnLayer(layerName, points);
      // }
    } else {
      this.layerService.removeLayer(layerName);
    }
  }

  public addToTradeAreaLayer(siteType: string, tradeAreas: ImpGeofootprintTradeArea[], mergeType: TradeAreaMergeTypeCodes, taType?: TradeAreaTypeCodes) : void {
    const mergeBuffers = mergeType !== TradeAreaMergeTypeCodes.NoMerge || taType === TradeAreaTypeCodes.Audience;
    tradeAreas.sort((a, b) => a.taName.localeCompare(b.taName));
    let pointMap: Map<string, {p: __esri.Point, r: number}[]> = new Map<string, {p: __esri.Point, r: number}[]>();
    if (taType === TradeAreaTypeCodes.Audience) {
      for (const ta of tradeAreas) {
        const { x, y } = toUniversalCoordinates(ta.impGeofootprintLocation);
        const point = new EsriApi.Point({ spatialReference: { wkid: this.esriAppSettings.defaultSpatialRef }, x, y });
        const minRadius = this.appStateService.currentProject$.getValue().audTaMinRadiu;
        const maxRadius = this.appStateService.currentProject$.getValue().audTaMaxRadiu;
        if (pointMap.has(`${ta.taName} - Min Radius`) && pointMap.has(`${ta.taName} - Max Radius`)) {
          pointMap.get(`${ta.taName} - Min Radius`).push(...[{p: point, r: minRadius}]);
          pointMap.get(`${ta.taName} - Max Radius`).push(...[{p: point, r: maxRadius}]);
        } else {
          pointMap.set(`${ta.taName} - Min Radius`, [{p: point, r: minRadius}]);
          pointMap.set(`${ta.taName} - Max Radius`, [{p: point, r: maxRadius}]);
        }
      }
    } else {
      pointMap = groupBy(tradeAreas, 'taName', ta => {
        const { x, y } = toUniversalCoordinates(ta.impGeofootprintLocation);
        const point = new EsriApi.Point({ spatialReference: { wkid: this.esriAppSettings.defaultSpatialRef }, x, y });
        return { p: point, r: ta.taRadius };
      });
    }
    const colorVal = (siteType === 'Site') ? [0, 0, 255] : [255, 0, 0];
    const color = new EsriApi.Color(colorVal);
    const transparent = new EsriApi.Color([0, 0, 0, 0]);
    // const symbol = new EsriApi.SimpleFillSymbol({
    //   style: 'solid',
    //   color: transparent,
    //   outline: {
    //     style: 'solid',
    //     color: color,
    //     width: 2
    //   }
    // });
    let layersToRemove: string[] = [];
    if (taType === TradeAreaTypeCodes.Audience) {
      layersToRemove = this.layerService.getAllLayerNames().filter(name => name != null && name.startsWith(siteType) && name.includes('Audience'));
    } else {
      layersToRemove = this.layerService.getAllLayerNames().filter(name => name != null && name.startsWith(siteType) && name.includes('Radius'));
    }
    layersToRemove.forEach(layerName => this.layerService.removeLayer(layerName));
    let layerId = 0;
    pointMap.forEach((pointData, name) => {
      const points = pointData.map(pd => pd.p);
      const radii = pointData.map(pd => pd.r);
      EsriApi.geometryEngineAsync.geodesicBuffer(points, radii, 'miles', mergeBuffers).then(geoBuffer => {
        const geometry = Array.isArray(geoBuffer) ? geoBuffer : [geoBuffer];
        const graphics = geometry.map(g => {
          return new EsriApi.Graphic({
            geometry: g,
            // symbol: symbol,
            attributes: { parentId: (++layerId).toString() }
          });
        });
        const groupName = `${siteType}s`;
        const layerName = `${siteType} - ${name}`;
        this.layerService.removeLayer(layerName);
        //this.layerService.createClientLayer(groupName, layerName, graphics, 'polygon', false);
        const renderer = new EsriApi.SimpleRenderer({
          symbol: new EsriApi.SimpleFillSymbol({
            style: 'solid',
          color: transparent,
          outline: {
            style: 'solid',
            color: color,
            width: 2
          }
          })
        });
        const layer =  this.layerService.createClientLayer(groupName, layerName, graphics, 'polygon', false);
        layer.renderer = renderer;
      });
    });
  }

  private setDefaultLayerVisibility(currentAnalysisLevel: string) : void {
    this.logger.info('Setting default layer visibility for', currentAnalysisLevel);
    this.layerService.getAllPortalGroups().forEach(g => g.visible = false);
    if (currentAnalysisLevel != null && currentAnalysisLevel.length > 0 ){
      const groupKeys: string[] = this.analysisLevelToGroupNameMap[currentAnalysisLevel];
      this.logger.debug('New visible groups', groupKeys);
      if (groupKeys != null && groupKeys.length > 0) {
        const layerGroups = groupKeys.map(g => this.appConfig.layers[g]);
        if (layerGroups != null && layerGroups.length > 0) {
          layerGroups.forEach(layerGroup => {
            if (this.layerService.portalGroupExists(layerGroup.group.name)) {
              this.layerService.getPortalGroup(layerGroup.group.name).visible = true;
            }
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
      const revisedRenderer = (currentLayer.renderer as __esri.SimpleRenderer).clone();
      revisedRenderer.symbol.color = new EsriApi.Color([ 128, 128, 128, 0.01 ]);
      currentLayer.renderer = revisedRenderer;
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
      newLayer.when(e => {
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
      title: 'Select Polygon',
      id: 'select-this',
      className: 'esri-icon-plus-circled'
    });
    const definedFields = layerDef.useCustomPopUp === true ?
      layerDef.customPopUpDefinition.rootFields.concat(layerDef.customPopUpDefinition.standardFields) :
      layerDef.popUpFields;
    const fieldsToUse = new Set<string>(definedFields);
    const byDefinedFieldIndex = (f1, f2) => definedFields.indexOf(f1.fieldName) - definedFields.indexOf(f2.fieldName);
    const fieldInfos = target.fields.filter(f => fieldsToUse.has(f.name)).map(f => new EsriApi.FieldInfo({ fieldName: f.name, label: f.alias }));
    console.log('fieldInfos::::::', fieldInfos);
    // const fieldInfos = target.fields.filter(f => fieldsToUse.has(f.name)).map(f => ({ fieldName: f.name, label: f.alias }));
    fieldInfos.sort(byDefinedFieldIndex);
    console.log('fieldInfos::::::', fieldInfos);
    const result = new EsriApi.PopupTemplate({ title: layerDef.popupTitle, actions: [selectThisAction, measureThisAction] });
    if (layerDef.useCustomPopUp === true) {
      result.content = (feature: any) => this.generator.geographyPopupFactory(feature, fieldInfos, layerDef.customPopUpDefinition);
      return result;
    } else {
      const resultTest = new EsriApi.PopupTemplate({ title: layerDef.popupTitle, actions: [selectThisAction, measureThisAction], content: [{ type: 'fields', fieldInfos: fieldInfos }] });
      //result.fieldInfos = fieldInfos;
     // result.content = [{ type: 'fields' }];
     return resultTest;
    }
   // return result;
  }

  private createSiteGraphic(site: ImpGeofootprintLocation) : __esri.Graphic {
    const graphic = new EsriApi.Graphic({
      geometry: new EsriApi.Point({
        x: site.xcoord,
        y: site.ycoord
      }),
      attributes: { parentId: ++AppLayerService.ObjectIdCache },
      visible: site.isActive
    });
    for (const [field, value] of Object.entries(site)) {
      if (Array.isArray(value)) continue;
      graphic.attributes[field] = value;
    }
    return graphic;
  }

  public clearClientLayers() {
    this.layerService.clearClientLayers();
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
