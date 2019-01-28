import { Injectable } from '@angular/core';
import { EsriLayerService, MapSymbols, EsriApi, EsriMapService } from '@val/esri';
import { UniversalCoordinates } from '@val/common';
import { calculateStatistics } from '@val/common';

@Injectable({
   providedIn: 'root'
})
export class AppLayerService {

   constructor(private esriLayerService: EsriLayerService, private esriMapService: EsriMapService) { }

   private currentLayerNames: Map<string, string[]> = new Map<string, string[]>();

   public addLocationsLayer(groupName: string, layerName: string, coordinates: UniversalCoordinates[]) {
      if (this.currentLayerNames.has(groupName)) {
         for (const curName of this.currentLayerNames.get(groupName)) {
            if (layerName === curName) {
               console.warn('Attempted to add layer name that already exists');
               return;
            }
         }
         this.esriLayerService.createPointLayer(groupName, layerName, coordinates, MapSymbols.STAR);
         this.currentLayerNames.get(groupName).push(layerName);
      } else {
         this.esriLayerService.createPointLayer(groupName, layerName, coordinates, MapSymbols.STAR);
         this.currentLayerNames.set(groupName, [layerName]);
      }
   }

   public removeLocationsLayer(groupName: string, layerName: string) {
      if (this.currentLayerNames.has(groupName)) {
         let layerFound: boolean = false;
         for (let i = 0; i < this.currentLayerNames.get(groupName).length; i++) {
            const currName = this.currentLayerNames.get(groupName)[i];
            if (layerName === currName) {
               layerFound = true;
               this.esriLayerService.removeLayer(layerName);
               const newList = this.currentLayerNames.get(groupName).filter(l => l !== currName);
               this.currentLayerNames.set(groupName, newList);
            }
         }
         if (!layerFound) {
            console.warn('Attempted to remove layer that does not exist: ', layerName);
         }
      } else {
         console.warn('Layer group not found when attempting to remove layer: ', groupName);
      }
   }

   public addTradeAreaRings(locations: UniversalCoordinates[], radius: number) {
      const color = new EsriApi.Color([0, 0, 255, 1]);
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
      const points: Array<__esri.Point> = [];
      for (const location of locations) {
         const point: __esri.Point = new EsriApi.Point();
         point.x = location.x;
         point.y = location.y;
         points.push(point);
      }
      EsriApi.geometryEngineAsync.geodesicBuffer(points, radius, 'miles', true).then(geoBuffer => {
         const geometry = Array.isArray(geoBuffer) ? geoBuffer : [geoBuffer];
         const graphics = geometry.map(g => {
           return new EsriApi.Graphic({
             geometry: g,
             symbol: symbol,
           });
         });
         this.esriLayerService.addGraphicsToLayer('Project Sites', graphics);
      });
   }

   public zoomToTradeArea(locations: UniversalCoordinates[]) {
      const latitudes: Array<number> = [];
      const longitudes: Array<number> = [];
      for (const location of locations) {
         latitudes.push(location.y);
         longitudes.push(location.x);
      }
      const xStats = calculateStatistics(longitudes);
      const yStats = calculateStatistics(latitudes);
      this.esriMapService.zoomOnMap(xStats, yStats, latitudes.length);
   }
}