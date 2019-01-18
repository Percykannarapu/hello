import { Injectable } from '@angular/core';
import { EsriLayerService, MapSymbols } from '@val/esri';
import { UniversalCoordinates } from '@val/common';

@Injectable({
   providedIn: 'root'
})
export class AppLayerService {

   constructor(private esriLayerService: EsriLayerService) { }

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

   public addLayerLocations(locations: UniversalCoordinates[]) {

   }
}