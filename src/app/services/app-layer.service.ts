import { Injectable } from '@angular/core';
import { merge, Observable } from 'rxjs';
import { filter, finalize, tap } from 'rxjs/operators';
import { LayerDefinition } from '../../environments/environment-definitions';
import { AppConfig } from '../app.config';
import { toUniversalCoordinates } from '../app.utils';
import { EsriModules } from '../esri-modules/core/esri-modules.service';
import { EsriLayerService } from '../esri-modules/layers/esri-layer.service';
import { groupBy } from '../val-modules/common/common.utils';
import { ImpMetricName } from '../val-modules/metrics/models/ImpMetricName';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes, TradeAreaMergeTypeCodes } from '../val-modules/targeting/targeting.enums';
import { AppComponentGeneratorService } from './app-component-generator.service';
import { AppLoggingService } from './app-logging.service';
import { AppStateService } from './app-state.service';
import { UsageService } from './usage.service';

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
               private moduleService: EsriModules,
               private appStateService: AppStateService,
               private usageService: UsageService,
               private generator: AppComponentGeneratorService,
               private logger: AppLoggingService,
               private appConfig: AppConfig) {
    this.moduleService.onReady(() => {
      this.appStateService.activeClientLocations$.subscribe(sites => this.updateSiteLayer(ImpClientLocationTypeCodes.Site, sites));
      this.appStateService.activeCompetitorLocations$.subscribe(competitors => this.updateSiteLayer(ImpClientLocationTypeCodes.Competitor, competitors));

      this.appStateService.analysisLevel$
        .pipe(filter(al => al != null && al.length > 0))
        .subscribe(al => this.setDefaultLayerVisibility(al));

      this.appStateService.projectIsLoading$
        .pipe(filter(isLoading => isLoading))
        .subscribe(() => this.clearClientLayers());
    });
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
        layer.popupTemplate = new EsriModules.PopupTemplate({
          title: '{clientLocationTypeCode}: {locationName}',
          content: [{ type: 'fields' }],
          fieldInfos: defaultLocationPopupFields
        });
        layer.renderer = new EsriModules.SimpleRenderer({
          symbol: new EsriModules.SimpleMarkerSymbol({
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

  public addToTradeAreaLayer(siteType: string, tradeAreas: ImpGeofootprintTradeArea[], mergeType: TradeAreaMergeTypeCodes) : void {
    const mergeBuffers = mergeType !== TradeAreaMergeTypeCodes.NoMerge;
    const pointMap: Map<number, __esri.Point[]> = groupBy(tradeAreas, 'taRadius', ta => {
      const { x, y } = toUniversalCoordinates(ta.impGeofootprintLocation);
      return new EsriModules.Point({ spatialReference: { wkid: this.appConfig.val_spatialReference }, x, y });
    });
    const colorVal = (siteType === 'Site') ? [0, 0, 255] : [255, 0, 0];
    const color = new EsriModules.Color(colorVal);
    const transparent = new EsriModules.Color([0, 0, 0, 0]);
    const symbol = new EsriModules.SimpleFillSymbol({
      style: 'solid',
      color: transparent,
      outline: {
        style: 'solid',
        color: color,
        width: 2
      }
    });
    const layersToRemove = this.layerService.getAllLayerNames().filter(name => name != null && name.startsWith(siteType) && name.endsWith('Trade Area'));
    layersToRemove.forEach(layerName => this.layerService.removeLayer(layerName));
    let layerId = 0;
    pointMap.forEach((points, radius) => {
      const radii = Array(points.length).fill(radius);
      EsriModules.geometryEngineAsync.geodesicBuffer(points, radii, 'miles', mergeBuffers).then(geoBuffer => {
        const geometry = Array.isArray(geoBuffer) ? geoBuffer : [geoBuffer];
        const graphics = geometry.map(g => {
          return new EsriModules.Graphic({
            geometry: g,
            symbol: symbol,
            attributes: { parentId: (++layerId).toString() }
          });
        });
        const groupName = `${siteType}s`;
        const layerName = `${siteType} - ${radius} Mile Trade Area`;
        this.layerService.removeLayer(layerName);
        this.layerService.createClientLayer(groupName, layerName, graphics, 'polygon', false);
      });
    });
  }

  private setDefaultLayerVisibility(currentAnalysisLevel: string) : void {
    this.logger.info('Setting default layer visibility for', currentAnalysisLevel);
    const groupKey = this.analysisLevelToGroupNameMap[currentAnalysisLevel];
    this.logger.debug('New visible groupKey', groupKey);
    this.layerService.getAllPortalGroups().forEach(g => g.visible = false);
    if (groupKey != null) {
      const layerGroup = this.appConfig.layerIds[groupKey];
      if (layerGroup != null && this.layerService.portalGroupExists(layerGroup.group.name)) {
        this.layerService.getPortalGroup(layerGroup.group.name).visible = true;
      }
    }
  }

  public initializeLayers() : Observable<__esri.FeatureLayer> {
    const layerGroups = new Map<string, LayerDefinition[]>();
    for (const layerGroup of Object.values(this.appConfig.layerIds)) {
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
        this.layerService.setupLayerWatches();
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
          this.pausableWatches.push(EsriModules.watchUtils.pausable(newLayer, 'visible', () => this.collectLayerUsage(newLayer)));
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
    this.pausableWatches.push(EsriModules.watchUtils.pausable(group, 'visible', () => this.collectLayerUsage(group)));
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
    const measureThisAction = new EsriModules.ActionButton({
      title: 'Measure Length',
      id: 'measure-this',
      className: 'esri-icon-share'
    });
    const selectThisAction = new EsriModules.ActionButton({
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
    const result = new EsriModules.PopupTemplate({ title: layerDef.popupTitle, actions: [selectThisAction, measureThisAction] });
    if (layerDef.useCustomPopUp === true) {
      result.content = (feature: any) => this.generator.geographyPopupFactory(feature, fieldInfos, layerDef.customPopUpDefinition);
    } else {
      result.fieldInfos = fieldInfos;
      result.content = [{ type: 'fields' }];
    }
    return result;
  }

  private createSiteGraphic(site: ImpGeofootprintLocation) : __esri.Graphic {
    const graphic = new EsriModules.Graphic({
      geometry: new EsriModules.Point({
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
    const layerActivated: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'map', target: 'layer-visibility', action: 'activated' });
    const layerDeactivated: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'map', target: 'layer-visibility', action: 'deactivated' });
    if (layer.visible) {
      this.usageService.createCounterMetric(layerActivated, layer.title, null);
    } else {
      this.usageService.createCounterMetric(layerDeactivated, layer.title, null);
    }
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
