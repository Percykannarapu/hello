import { Inject, Injectable } from '@angular/core';
import { combineLatest, merge, Observable } from 'rxjs';
import { filter, finalize, tap } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { toUniversalCoordinates } from '../models/coordinates';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes, TradeAreaMergeTypeCodes, TradeAreaTypeCodes } from '../val-modules/targeting/targeting.enums';
import { AppComponentGeneratorService } from './app-component-generator.service';
import { AppLoggingService } from './app-logging.service';
import { AppStateService } from './app-state.service';
import { Store } from '@ngrx/store';
import { LocalAppState } from '../state/app.interfaces';
import { CreateMapUsageMetric } from '../state/usage/targeting-usage.actions';
import { EsriApi, EsriAppSettings, EsriAppSettingsToken, EsriLayerService, LayerDefinition } from '@val/esri';
import { groupBy } from '@val/common';

const starPath: string = 'M 240.000 260.000 L 263.511 272.361 L 259.021 246.180 L 278.042 227.639 L 251.756 223.820 L 240.000 200.000 L 228.244 223.820 L 201.958 227.639 L 220.979 246.180 L 216.489 272.361 L 240.000 260.000';

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
    'ZIP': 'zip',
    'ATZ': 'atz',
    'Digital ATZ': 'digital_atz',
    'PCR': 'pcr'
  };

  private pausableWatches: __esri.PausableWatchHandle[] = [];

  constructor(private layerService: EsriLayerService,
              private appStateService: AppStateService,
              private generator: AppComponentGeneratorService,
              private logger: AppLoggingService,
              private appConfig: AppConfig,
              @Inject(EsriAppSettingsToken) private esriAppSettings: EsriAppSettings,
              private store$: Store<LocalAppState>) {
    this.appStateService.activeClientLocations$.subscribe(sites => this.updateSiteLayer(ImpClientLocationTypeCodes.Site, sites));
    this.appStateService.activeCompetitorLocations$.subscribe(competitors => this.updateSiteLayer(ImpClientLocationTypeCodes.Competitor, competitors));

    this.appStateService.analysisLevel$
    //.pipe(filter(al => al != null && al.length > 0))
      .subscribe(al => this.setDefaultLayerVisibility(al));

    combineLatest(this.appStateService.applicationIsReady$, this.layerService.layersReady$)
      .pipe(filter(([appIsReady, layersReady]) => !appIsReady && layersReady))
      .subscribe(() => this.clearClientLayers());
  }

  public updateSiteLayer(siteType: SuccessfulLocationTypeCodes, sites: ImpGeofootprintLocation[]) : void {
    console.log('Updating Site Layer Visuals', [siteType, sites]);
    const groupName = `${siteType}s`;
    const layerName = `Project ${groupName}`;
    const points: __esri.Graphic[] = sites.map(site => this.createSiteGraphic(site));
    if (points.length > 0) {
      if (!this.layerService.layerExists(layerName) || !this.layerService.groupExists(groupName)) {
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
      } else {
        this.layerService.replaceGraphicsOnLayer(layerName, points);
      }
    } else {
      this.layerService.removeLayer(layerName);
    }
  }

  public addToTradeAreaLayer(siteType: string, tradeAreas: ImpGeofootprintTradeArea[], mergeType: TradeAreaMergeTypeCodes, taType?: TradeAreaTypeCodes) : void {
    const mergeBuffers = mergeType !== TradeAreaMergeTypeCodes.NoMerge;
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
    const symbol = new EsriApi.SimpleFillSymbol({
      style: 'solid',
      color: transparent,
      outline: {
        style: 'solid',
        color: color,
        width: 2
      }
    });
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
      if (taType === TradeAreaTypeCodes.Audience) {
          EsriApi.geometryEngineAsync.geodesicBuffer(points, radii, 'miles', true).then(geoBuffer => {
            const geometry = Array.isArray(geoBuffer) ? geoBuffer : [geoBuffer];
            const graphics = geometry.map(g => {
              return new EsriApi.Graphic({
                geometry: g,
                symbol: symbol,
                attributes: { parentId: (++layerId).toString() }
              });
            });
            const groupName = `${siteType}s`;
            const layerName = `${siteType} - ${name}`;
            this.layerService.removeLayer(layerName);
            this.layerService.createClientLayer(groupName, layerName, graphics, 'polygon', false);
            });
        } else {
          EsriApi.geometryEngineAsync.geodesicBuffer(points, radii, 'miles', mergeBuffers).then(geoBuffer => {
            const geometry = Array.isArray(geoBuffer) ? geoBuffer : [geoBuffer];
            const graphics = geometry.map(g => {
              return new EsriApi.Graphic({
                geometry: g,
                symbol: symbol,
                attributes: { parentId: (++layerId).toString() }
              });
            });
            const groupName = `${siteType}s`;
            const layerName = `${siteType} - ${name}`;
            this.layerService.removeLayer(layerName);
            this.layerService.createClientLayer(groupName, layerName, graphics, 'polygon', false);
          });
        }  
    });
  }

  private setDefaultLayerVisibility(currentAnalysisLevel: string) : void {
    this.logger.info('Setting default layer visibility for', currentAnalysisLevel);
    this.layerService.getAllPortalGroups().forEach(g => g.visible = false);
    if (currentAnalysisLevel != null && currentAnalysisLevel.length > 0 ){
      const groupKey = this.analysisLevelToGroupNameMap[currentAnalysisLevel];
      this.logger.debug('New visible groupKey', groupKey);
      if (groupKey != null) {
        const layerGroup = this.appConfig.layers[groupKey];
        if (layerGroup != null && this.layerService.portalGroupExists(layerGroup.group.name)) {
          this.layerService.getPortalGroup(layerGroup.group.name).visible = true;
        }
      }
    }
  }

  public initializeLayers() : Observable<__esri.FeatureLayer> {
    const layerGroups = new Map<string, LayerDefinition[]>();
    for (const layerGroup of Object.values(this.appConfig.layers)) {
      layerGroups.set(layerGroup.group.name, [layerGroup.centroids, layerGroup.boundaries]);
      this.setupPortalGroup(layerGroup.group.name);
    }
    this.pauseLayerWatch(this.pausableWatches);
    const results: Observable<__esri.FeatureLayer>[] = [];
    layerGroups.forEach((value, key) => {
      const layerObservables = this.setupLayerGroup(key, value.filter(l => l != null));
      results.push(...layerObservables);
    });
    return merge(...results, 2).pipe(
      finalize(() => {
        this.resumeLayerWatch(this.pausableWatches);
      })
    );
  }

  private setupLayerGroup(groupName: string, layerDefinitions: LayerDefinition[]) : Observable<__esri.FeatureLayer>[]{
    const group = this.layerService.getPortalGroup(groupName);
    const layerObservables: Observable<__esri.FeatureLayer>[] = [];
    layerDefinitions.forEach(layerDef => {
      const current = this.layerService.createPortalLayer(layerDef.id, layerDef.name, layerDef.minScale, layerDef.defaultVisibility).pipe(
        tap(newLayer => {
          this.setupLayerPopup(newLayer, layerDef);
          this.pausableWatches.push(EsriApi.watchUtils.pausable(newLayer, 'visible', () => this.collectLayerUsage(newLayer)));
          group.add(newLayer);
        })
      );
      layerObservables.push(current);
    });
    return layerObservables;
  }

  private setupPortalGroup(groupName: string) : void {
    this.layerService.createPortalGroup(groupName, false);
    const group = this.layerService.getPortalGroup(groupName);
    if (group == null) throw new Error(`Invalid Group Name: '${groupName}'`);
    this.pausableWatches.push(EsriApi.watchUtils.pausable(group, 'visible', () => this.collectLayerUsage(group)));
  }

  private setupLayerPopup(newLayer: __esri.FeatureLayer, layerDef: LayerDefinition) : void {
    const popupEnabled = (layerDef.useCustomPopUp === true) || (layerDef.popUpFields.length > 0);
    if (popupEnabled) {
      newLayer.on('layerview-create', e => {
        const localLayer = (e.layerView.layer as __esri.FeatureLayer);
        localLayer.popupTemplate = this.createPopupTemplate(localLayer, layerDef);
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
    const fieldInfos = target.fields.filter(f => fieldsToUse.has(f.name)).map(f => ({ fieldName: f.name, label: f.alias }));
    fieldInfos.sort(byDefinedFieldIndex);
    const result = new EsriApi.PopupTemplate({ title: layerDef.popupTitle, actions: [selectThisAction, measureThisAction] });
    if (layerDef.useCustomPopUp === true) {
      result.content = (feature: any) => this.generator.geographyPopupFactory(feature, fieldInfos, layerDef.customPopUpDefinition);
    } else {
      result.fieldInfos = fieldInfos;
      result.content = [{ type: 'fields' }];
    }
    return result;
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
      graphic.attributes[field] = value;
    }
    return graphic;
  }

  private clearClientLayers() {
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
   * Stop the ESRI watchUtils from watching the visible property on a layer
   * @argument pausableWatches An array of __esri.PausableWatchHandle
   */
  private pauseLayerWatch(pausableWatches: Array<__esri.PausableWatchHandle>) {
    for (const watch of pausableWatches) {
      watch.pause();
    }
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
