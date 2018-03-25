import { Injectable } from '@angular/core';
import { ValSiteListService } from './app-site-list.service';
import { Subscription } from 'rxjs/Subscription';
import { LocationUiModel } from '../models/location-ui.model';
import { EsriLayerService } from '../esri-modules/layers/esri-layer.service';
import { EsriMapService } from '../esri-modules/core/esri-map.service';
import { AppConfig } from '../app.config';
import { EsriModules } from '../esri-modules/core/esri-modules.service';
import { ValLayerService } from './app-layer.service';
import { ValGeoService } from './app-geo.service';
import { ImpDiscoveryService } from './ImpDiscoveryUI.service';
import { ImpDiscoveryUI } from '../models/ImpDiscoveryUI';
import { EsriQueryService } from '../esri-modules/layers/esri-query.service';
import { ValMetricsService } from './app-metrics.service';
import { ValTradeAreaService } from './app-trade-area.service';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';

export interface Coordinates {
  xcoord: number;
  ycoord: number;
}

@Injectable()
export class ValMapService {
  private siteSubscription: Subscription;
  private geoSubscription: Subscription;
  private discoverySubscription: Subscription;
  private clientTradeAreaSubscription: Subscription;
  private competitorTradeAreaSubscription: Subscription;

  private currentAnalysisLevel: string;
  private currentLocationList = new Map<string, LocationUiModel[]>();
  private currentBufferLayerNames = new Map<string, string[]>();
  private currentGeocodeList: string[] = [];

  constructor(private siteService: ValSiteListService, private layerService: EsriLayerService,
              private mapService: EsriMapService, private config: AppConfig,
              private appLayerService: ValLayerService, private appGeoService: ValGeoService,
              private discoveryService: ImpDiscoveryService, private queryService: EsriQueryService,
              private metricsService: ValMetricsService, private tradeAreaService: ValTradeAreaService) {
    this.currentAnalysisLevel = '';
    this.mapService.onReady$.subscribe(ready => {
      if (ready) {
        this.siteSubscription = this.siteService.allUiSites$.subscribe(sites => {
          const clientSites = sites.filter(s => s.location.clientLocationTypeCode === 'Site');
          const competitorSites = sites.filter(s => s.location.clientLocationTypeCode === 'Competitor');
          if (clientSites.length > 0) {
            if (!this.currentLocationList.has('Site')) this.currentLocationList.set('Site', []);
            this.onSiteListChanged(clientSites, 'Site');
          }
          if (competitorSites.length > 0) {
            if (!this.currentLocationList.has('Competitor')) this.currentLocationList.set('Competitor', []);
            this.onSiteListChanged(competitorSites, 'Competitor');
          }
        });
        this.geoSubscription = this.appGeoService.uniqueSelectedGeocodes$.subscribe(geocodes => this.onGeocodeListChanged(geocodes));
        this.discoverySubscription = this.discoveryService.storeObservable.subscribe(discovery => this.onDiscoveryChange(discovery));
        this.clientTradeAreaSubscription = this.tradeAreaService.clientBuffer$.subscribe(buffer => this.onTradeAreaBufferChange(buffer, 'Site'));
        this.competitorTradeAreaSubscription = this.tradeAreaService.competitorBuffer$.subscribe(buffer => this.onTradeAreaBufferChange(buffer, 'Competitor'));
      }
    });
  }

  private onSiteListChanged(sites: LocationUiModel[], siteType: string) {
    const oldSites = new Set(this.currentLocationList.get(siteType));
    const newSites = new Set(sites);
    const addedPoints = sites.filter(s => !oldSites.has(s)).map(s => s.point);
    const removedPoints = this.currentLocationList.get(siteType).filter(s => !newSites.has(s)).map(s => s.point);
    const updatedPoints = sites.filter(s => oldSites.has(s)).map(s => s.point);
    const groupName = `${siteType}s`;
    const layerName = `Project ${groupName}`;
    if (this.mapService.map.layers.map(l => l.title).includes(groupName)) {
      this.layerService.addGraphicsToLayer(layerName, addedPoints);
      this.layerService.removeGraphicsFromLayer(layerName, removedPoints);
      this.layerService.updateGraphicAttributes(layerName, updatedPoints);
      this.layerService.setGraphicVisibility(layerName, updatedPoints);
    } else {
      this.layerService.createClientLayer(groupName, layerName, sites.map(s => s.point), 'point');
    }
    this.currentLocationList.set(siteType, Array.from(sites));
  }

  private onDiscoveryChange(discovery: ImpDiscoveryUI[]) : void {
    if (discovery && discovery[0] && discovery[0].analysisLevel != null && discovery[0].analysisLevel !== this.currentAnalysisLevel) {
      this.currentAnalysisLevel = discovery[0].analysisLevel;
    }
  }

  private onGeocodeListChanged(geocodes: string[]) {
    const currentGeocodes = new Set(this.currentGeocodeList);
    const newGeocodes = new Set(geocodes);
    const adds = geocodes.filter(g => !currentGeocodes.has(g));
    const deletes = this.currentGeocodeList.filter(g => !newGeocodes.has(g));
    this.currentGeocodeList = Array.from(geocodes);
    if (adds.length > 0) this.addToSelection(adds, this.currentAnalysisLevel);
    if (deletes.length > 0) this.removeFromSelection(deletes, this.currentAnalysisLevel);
  }

  private onTradeAreaBufferChange(buffer: Map<ImpGeofootprintLocation, number[]>, siteType: string) {
    const mergeFlag = siteType === 'Site' ? this.tradeAreaService.clientMergeFlag : this.tradeAreaService.competitorMergeFlag;
    this.drawRadiusBuffers(buffer, mergeFlag, siteType);
  }

  public setupMap() : void {

  }

  public handleClickEvent(event:  __esri.MapViewClickEvent) {
    // still need to figure out how add these geos to the data model
    console.log('NO SOUP FOR YOU');
    return;

    // const layerId = this.config.getLayerIdForAnalysisLevel(this.currentAnalysisLevel);
    // const layer = this.layerService.getPortalLayerById(layerId);
    // const query = layer.createQuery();
    // query.geometry = event.mapPoint;
    // query.outFields = ['geocode'];
    // const sub = this.queryService.executeQuery(layer, query).subscribe(featureSet => {
    //   console.log('query Map point result', featureSet);
    //   if (featureSet && featureSet.features && featureSet.features.length === 1) {
    //     this.addToSelection([featureSet.features[0].attributes.geocode], this.currentAnalysisLevel);
    //   }
    // }, err => console.error('Error getting geocode for map click event', err), () => sub.unsubscribe());
  }

  public drawRadiusBuffers(locationBuffers: Map<Coordinates, number[]>, mergeBuffers: boolean, locationType: string) : void {
    const locationKeys = Array.from(locationBuffers.keys());
    if (locationKeys.length === 0) return;
    console.log('drawing buffers', locationBuffers);
    const radiusSet = Array.from(new Set([].concat(...Array.from(locationBuffers.values())))); // this gets a unique list of radii
    const pointMap: Map<number, __esri.Point[]> = new Map<number, __esri.Point[]>();
    for (const location of locationKeys) {
      for (const radius of radiusSet) {
        const currentLocationBuffers = new Set(locationBuffers.get(location));
        if (currentLocationBuffers.has(radius)) {
          const p = new EsriModules.Point({
            spatialReference: { wkid: this.config.val_spatialReference },
            x: location.xcoord,
            y: location.ycoord
          });
          if (pointMap.has(radius)) {
            pointMap.get(radius).push(p);
          } else {
            pointMap.set(radius, [p]);
          }
        }
      }
    }
    const colorVal = (locationType === 'Site') ? [0, 0, 255] : [255, 0, 0];
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
    if (this.currentBufferLayerNames.has(locationType)) {
      for (const layer of this.currentBufferLayerNames.get(locationType)) {
        this.layerService.removeLayer(layer);
      }
    }
    for (const [radius, points] of Array.from(pointMap.entries())) {
      const radii = Array(points.length).fill(radius);
      EsriModules.geometryEngineAsync.geodesicBuffer(points, radii, 'miles', mergeBuffers).then(geoBuffer => {
        const geometry = Array.isArray(geoBuffer) ? geoBuffer : [geoBuffer];
        const graphics = geometry.map(g => {
          return new EsriModules.Graphic({
            geometry: g,
            symbol: symbol
          });
        });
        const groupName = `${locationType}s`;
        const layerName = `${locationType} - ${radius} Mile Trade Area`;
        if (this.currentBufferLayerNames.has(locationType)) {
          this.currentBufferLayerNames.get(locationType).push(layerName);
        } else {
          this.currentBufferLayerNames.set(locationType, [layerName]);
        }
        this.layerService.createClientLayer(groupName, layerName, graphics, 'polygon');
      });
    }
  }

  public addToSelection(geocodes: string[], analysisLevel: string) {
    if (geocodes == null || geocodes.length === 0) return;

    const layerName = `Selected Geography - ${analysisLevel}`;
    const highlightColor = new EsriModules.Color([0, 255, 0, 0.1]);
    const outlineColor = new EsriModules.Color([0, 255, 0, 0.65]);
    const highlightSymbol = new EsriModules.SimpleFillSymbol({
      color: highlightColor,
      outline: { color: outlineColor, style: 'solid', width: 2},
      style: 'solid'
    });
    const portalId = this.config.getLayerIdForAnalysisLevel(analysisLevel);
    const outFields = this.metricsService.getLayerAttributes();
    const sub = this.queryService.queryAttributeIn({ portalLayerId: portalId }, 'geocode', geocodes, true, outFields).subscribe(graphics => {
        const newGraphics = graphics.map(f => {
          return new EsriModules.Graphic({
            symbol: highlightSymbol,
            geometry: f.geometry,
            attributes: f.attributes
          });
        });
        const attributesForUpdate = graphics.map(g => g.attributes);
        this.appGeoService.updatedGeoAttributes(attributesForUpdate);
        if (this.layerService.layerExists(layerName)) {
          this.layerService.addGraphicsToLayer(layerName, newGraphics);
        } else {
          this.layerService.createClientLayer('Sites', layerName, newGraphics, 'polygon');
        }
    }, err => console.error(err), () => {
      console.log('addToSelection complete');
      sub.unsubscribe();
    });
  }

  public removeFromSelection(geocodes: string[], analysisLevel: string) {
    const layerName = `Selected Geography - ${analysisLevel}`;
    const sub = this.queryService.queryAttributeIn({ clientLayerName: layerName }, 'geocode', geocodes, true).subscribe(graphics => {
      this.layerService.removeGraphicsFromLayer(layerName, graphics);
    }, err => console.error(err), () => sub.unsubscribe());
  }
}
