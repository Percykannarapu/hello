import { Injectable } from '@angular/core';
import { AppConfig } from '../app.config';
import { toUniversalCoordinates } from '../app.utils';
import { EsriLayerService } from '../esri-modules/layers/esri-layer.service';
import { groupBy } from '../val-modules/common/common.utils';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { TradeAreaMergeTypeCodes } from '../val-modules/targeting/targeting.enums';
import { MapService } from './map.service';
import { EsriModules } from '../esri-modules/core/esri-modules.service';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { combineLatest } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { AppStateService } from './app-state.service';

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

  constructor(private layerService: EsriLayerService, private moduleService: EsriModules,
               private locationService: ImpGeofootprintLocationService, private appStateService: AppStateService,
               private config: AppConfig) {
    this.moduleService.onReady(() => {
      // set up the location rendering using stars colored by site type
      const locationSplit$ = combineLatest(this.locationService.storeObservable, this.appStateService.projectIsLoading$).pipe(
        filter(([locations, isLoading]) => locations != null && !isLoading),
        map(([locations]) => [locations.filter(l => l.clientLocationTypeCode === 'Site'), locations.filter(l => l.clientLocationTypeCode === 'Competitor')]),
      );
      locationSplit$.pipe(
        map(([sites]) => sites),
      ).subscribe(sites => this.updateSiteLayer('Site', sites));
      locationSplit$.pipe(
        map(([sites, competitors]) => competitors),
      ).subscribe(competitors => this.updateSiteLayer('Competitor', competitors));

      this.appStateService.analysisLevel$
        .pipe(filter(al => al != null && al.length > 0))
        .subscribe(al => this.setDefaultLayers(al));

      this.appStateService.projectIsLoading$
        .pipe(filter(isLoading => isLoading))
        .subscribe(() => this.clearLayers());
    });
  }

  public updateSiteLayer(siteType: string, sites: ImpGeofootprintLocation[]) : void {
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
      return new EsriModules.Point({ spatialReference: { wkid: this.config.val_spatialReference }, x, y });
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

  public setDefaultLayers(currentAnalysisLevel: string) : void {
    MapService.DmaGroupLayer.visible = false;
    MapService.ZipGroupLayer.visible = false;
    MapService.AtzGroupLayer.visible = false;
    MapService.DigitalAtzGroupLayer.visible = false;
    MapService.PcrGroupLayer.visible = false;
    MapService.WrapGroupLayer.visible = false;
    MapService.CountyGroupLayer.visible = false;

    switch (currentAnalysisLevel) {
      case 'Digital ATZ':
        MapService.DigitalAtzGroupLayer.visible = true;
        break;
      case 'ATZ':
        MapService.AtzGroupLayer.visible = true;
        break;
      case 'ZIP':
        MapService.ZipGroupLayer.visible = true;
        break;
      case 'PCR':
        MapService.PcrGroupLayer.visible = true;
        break;
      default:
        console.error(`ValMapService.setDefaultLayers - Unknown Analysis Level selected: ${currentAnalysisLevel}`);
    }
  }

  private createSiteGraphic(site: ImpGeofootprintLocation) : __esri.Graphic {
    const graphic = new EsriModules.Graphic({
      geometry: new EsriModules.Point({
        x: site.xcoord,
        y: site.ycoord
      }),
      attributes: { parentId: (site.locationNumber || '').toString() },
      visible: site.isActive
    });
    for (const [field, value] of Object.entries(site)) {
      graphic.attributes[field] = value;
    }
    return graphic;
  }

  private clearLayers() {
    this.layerService.clearAll();
  }
}
