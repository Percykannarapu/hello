import { Injectable } from '@angular/core';
import { EsriLayerService, MapSymbols, EsriApi, EsriMapService, SetHighlightOptions, SetSelectedGeos } from '@val/esri';
import { UniversalCoordinates } from '@val/common';
import { calculateStatistics } from '@val/common';
import { Store } from '@ngrx/store';
import { HighlightMode } from '@val/esri';
import { LocalState, FullState } from '../state';

@Injectable({
   providedIn: 'root'
})
export class AppLayerService {

   constructor(private esriLayerService: EsriLayerService, 
      private esriMapService: EsriMapService,
      private store$: Store<FullState>) { }

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

   public removeLayer(groupName: string, layerName: string) {
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
            this.forceLayerRemoval(layerName);
         }
      } else {
         this.forceLayerRemoval(layerName);
      }
   }

   private forceLayerRemoval(layerName: string) : boolean {
      if (this.esriLayerService.getAllLayerNames().filter(l => l === layerName).length > 0) {
         this.esriLayerService.removeLayer(layerName);
         return true;
      }
      return false;
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

   public shadeBySite(state: LocalState) {
      const shadingGroups: Array<{ groupName: string, ids: string[] }> = [];
      const selectedGeos: Array<string> = [];
      for (const site of state.rfpUiEdit.ids) {
         const geos: Array<string> = [];
         const siteId = state.rfpUiEdit.entities[site].siteId;
         const siteName = state.rfpUiEdit.entities[site].siteName;
         for (const detail of state.rfpUiEditDetail.ids) {
            if (!state.rfpUiEditDetail.entities[detail].isSelected) continue;
            if (siteId === state.rfpUiEditDetail.entities[detail].fkSite) {
               geos.push(state.rfpUiEditDetail.entities[detail].geocode);
               selectedGeos.push(state.rfpUiEditDetail.entities[detail].geocode); 
            }
         }
         shadingGroups.push({ groupName: siteName, ids: geos });
      }
      this.esriLayerService.createClientGroup('Shading', true, true);
      this.store$.dispatch(new SetHighlightOptions({ higlightMode: HighlightMode.SHADE_GROUPS, layerGroup: 'Shading', layer: 'Selected Geos', groups: shadingGroups }));
      this.store$.dispatch(new SetSelectedGeos(selectedGeos));
   }

   private getWrapShadingGroups(state: LocalState) : { selectedGeos: Array<string>, shadingGroups: { groupName: string, ids: string[] }[]} {
      const shadingGroups: Map<string, Set<string>> = new Map<string, Set<string>>();
      const selectedGeos: Set<string> = new Set<string>();
      for (const wrapId of state.rfpUiEditWrap.ids) {
         const geos: Set<string> = new Set<string>();
         const siteName = state.rfpUiEditWrap.entities[wrapId].siteName;
         const zoneId = state.rfpUiEditWrap.entities[wrapId].wrapZoneId;
         for (const detailId of state.rfpUiEditDetail.ids) {
            if (!state.rfpUiEditDetail.entities[detailId].isSelected) continue;
            if (zoneId === state.rfpUiEditDetail.entities[detailId].wrapZoneId) {
               let wrapZone: string = state.rfpUiEditDetail.entities[detailId].wrapZone;
               wrapZone = wrapZone.replace(new RegExp(/\ /, 'g'), '');
               wrapZone = wrapZone.replace(new RegExp(/\//, 'g'), '');
               wrapZone = wrapZone.toUpperCase();
               wrapZone = wrapZone.substr(0, 8);
               selectedGeos.add(wrapZone); 
               geos.add(wrapZone);
            }
         }
         if (shadingGroups.has(siteName)) {
            const ids = shadingGroups.get(siteName);
            geos.forEach(geo => ids.add(geo));
         } else {
            shadingGroups.set(siteName, geos);
         }
      }
      const data: Array<{ groupName: string, ids: Array<string> }> = [];
      for (const groupName of Array.from(shadingGroups.keys())) {
         const ids: Array<string> = Array.from(shadingGroups.get(groupName));
         const datum = { groupName: groupName, ids: ids };
         data.push(datum);
      }
      return { selectedGeos: Array.from(selectedGeos), shadingGroups: data };
   }
}