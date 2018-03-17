import { Injectable } from '@angular/core';
import { ValSiteListService } from './app-site-list.service';
import { Subscription } from 'rxjs/Subscription';
import { LocationUiModel } from '../models/location-ui.model';
import { EsriLayerService } from '../esri-modules/layers/esri-layer.service';
import { EsriMapService } from '../esri-modules/core/esri-map.service';
import { Coordinates } from '../esri-modules/rest-api/esri-rest-query.service';
import { AppConfig } from '../app.config';
import { EsriModules } from '../esri-modules/core/esri-modules.service';

@Injectable()
export class ValMapService {
  private siteSubscription: Subscription;
  private currentLocationList = new Map<string, LocationUiModel[]>();
  private currentBufferLayerNames = new Map<string, string[]>();

  constructor(private siteService: ValSiteListService, private layerService: EsriLayerService,
               private mapService: EsriMapService, private config: AppConfig) {
    this.mapService.onReady$.subscribe(ready => {
      if (ready) {
        this.siteSubscription = this.siteService.allUiSites$.subscribe(sites => {
          const clientSites = sites.filter(s => s.location.impClientLocationType.clientLocationType === 'Site');
          const competitorSites = sites.filter(s => s.location.impClientLocationType.clientLocationType === 'Competitor');
          if (clientSites.length > 0) {
            if (!this.currentLocationList.has('Site')) this.currentLocationList.set('Site', []);
            this.onSiteListChanged(clientSites, 'Site');
          }
          if (competitorSites.length > 0) {
            if (!this.currentLocationList.has('Competitor')) this.currentLocationList.set('Competitor', []);
            this.onSiteListChanged(competitorSites, 'Competitor');
          }
        });
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

  public setupMap() : void {

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
}
