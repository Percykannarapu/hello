import { Injectable } from '@angular/core';
import { ColorPallete, EsriLayerService, MapSymbols, EsriApi, EsriMapService, SetHighlightOptions, SetSelectedGeos, SetLayerLabelExpressions } from '@val/esri';
import { UniversalCoordinates } from '@val/common';
import { calculateStatistics } from '@val/common';
import { Store } from '@ngrx/store';
import { HighlightMode } from '@val/esri';
import { LocalState, FullState } from '../state';
import { ConfigService } from './config.service';
import { Observable } from 'rxjs';

@Injectable({
   providedIn: 'root'
})
export class AppLayerService {

   constructor(private esriLayerService: EsriLayerService,
      private esriMapService: EsriMapService,
      private store$: Store<FullState>,
      private configService: ConfigService) { }

   private currentLayerNames: Map<string, string[]> = new Map<string, string[]>();

   public addLocationsLayer(groupName: string, layerName: string, coordinates: UniversalCoordinates[]) {
      const renderer = new EsriApi.SimpleRenderer({
         symbol: new EsriApi.SimpleMarkerSymbol({
            color: [0, 0, 255, 1],
            path: MapSymbols.STAR
         })
      });
      if (this.currentLayerNames.has(groupName)) {
         for (const curName of this.currentLayerNames.get(groupName)) {
            if (layerName === curName) {
               console.warn('Attempted to add layer name that already exists');
               return;
            }
         }
         this.currentLayerNames.get(groupName).push(layerName);
      } else {
         this.currentLayerNames.set(groupName, [layerName]);
      }
      const graphics: Array<__esri.Graphic> = this.esriLayerService.coordinatesToGraphics(coordinates);
      //this.esriLayerService.createClientLayer(groupName, layerName, graphics, 'point', false, null, renderer);
      this.esriLayerService.createGraphicsLayer(groupName, layerName, graphics);
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
      this.esriLayerService.removeLayer('Trade Area');
      const renderer = new EsriApi.SimpleRenderer({
         symbol: new EsriApi.SimpleFillSymbol({
            style: 'solid',
            color: [0, 0, 0, 0],
            outline: {
               style: 'solid',
               color: [0, 0, 255, 1],
               width: 2
            }
          })
      });
      const points: Array<__esri.Point> = [];
      for (const location of locations) {
         const point: __esri.Point = new EsriApi.Point();
         point.x = location.x;
         point.y = location.y;
         points.push(point);
      }
      EsriApi.geometryEngineAsync.geodesicBuffer(points, radius, 'miles', false).then(geoBuffer => {
         const geometry = Array.isArray(geoBuffer) ? geoBuffer : [geoBuffer];
         const graphics = geometry.map(g => {
            return new EsriApi.Graphic({
               geometry: g,
               symbol: renderer.symbol,
            });
         });
         //this.esriLayerService.createClientLayer('Sites', 'Trade Area', graphics, 'polygon', false, null, renderer);
         this.esriLayerService.createGraphicsLayer('Sites', 'Trade Areas', graphics);
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

   public shadeBySite(state: FullState) {
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
      this.store$.dispatch(new SetHighlightOptions({ higlightMode: HighlightMode.SHADE_GROUPS, layerGroup: 'Shading', layer: 'Selected Geos', colorPallete: ColorPallete.CPQMAPS, groups: shadingGroups }));
      this.store$.dispatch(new SetSelectedGeos(selectedGeos));
   }

   private getWrapShadingGroups(state: FullState) : { selectedGeos: Array<string>, shadingGroups: { groupName: string, ids: string[] }[] } {
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

   public updateLabels(state: FullState) {
      if (state.shared.isDistrQtyEnabled) {
         this.showDistrQty(state);
      } else {
         this.restoreDefaultLabels(state);
      }
   }

   private restoreDefaultLabels(state: FullState) {
      let newExpression: string = '';
      let updateId: string = '';
      switch (state.shared.analysisLevel) {
         case 'zip':
            updateId = this.configService.layers['zip'].boundaries.id;
            newExpression = this.configService.layers['zip'].boundaries.labelExpression;
            break;
         case 'atz':
            updateId = this.configService.layers['atz'].boundaries.id;
            newExpression = this.configService.layers['atz'].boundaries.labelExpression;
            break;
         case 'wrap':
            updateId = this.configService.layers['zip'].boundaries.id; // yes, we update the zip labels if we are at wrap level
            newExpression = this.configService.layers['zip'].boundaries.labelExpression;
            break;
      }
      const layerExpressions: any = state.esri.map.layerExpressions;
      layerExpressions[updateId].expression = newExpression;
      this.store$.dispatch(new SetLayerLabelExpressions({ expressions: layerExpressions }));
   }

   private showDistrQty(state: FullState) {
      let newExpression: string = '';
      let updateId: string = '';
      switch (state.shared.analysisLevel) {
         case 'zip':
            updateId = this.configService.layers['zip'].boundaries.id;
            newExpression = `var geoData = ${this.createArcadeDictionary(state)};
                             var distrQty = "";
                             if(hasKey(geoData, $feature.geocode)) {
                               distrQty = geoData[$feature.geocode] + " HH";
                             }
                             return Concatenate([$feature.geocode, distrQty], TextFormatting.NewLine);`;
            break;
         case 'atz':
            updateId = this.configService.layers['atz'].boundaries.id;
            newExpression = `var geoData = ${this.createArcadeDictionary(state)};
                             var id = iif(count($feature.geocode) > 5, right($feature.geocode, count($feature.geocode) - 5), "");
                             var distrQty = "";
                             if(hasKey(geoData, $feature.geocode)) {
                               distrQty = geoData[$feature.geocode] + " HH";
                             }
                             return Concatenate([id, distrQty], TextFormatting.NewLine);`;
            break;
         case 'wrap':
            updateId = this.configService.layers['zip'].boundaries.id; // yes, we update the zip labels if we are at wrap level
            newExpression = `var geoData = ${this.createArcadeDictionary(state)};
                             var distrQty = "";
                             if(hasKey(geoData, $feature.geocode)) {
                               distrQty = geoData[$feature.geocode] + " HH";
                             }
                             return Concatenate([$feature.geocode, distrQty], TextFormatting.NewLine);`;
            break;
      }
      const layerExpressions: any = state.esri.map.layerExpressions;
      layerExpressions[updateId].expression = newExpression;
      this.store$.dispatch(new SetLayerLabelExpressions({ expressions: layerExpressions }));
   }

   private createArcadeDictionary(state: FullState) : string {
      let dictionary: string = '{';
      for (const id of state.rfpUiEditDetail.ids) {
         const geocode: string = state.rfpUiEditDetail.entities[id].geocode;
         const distrQty: number = state.rfpUiEditDetail.entities[id].distribution;
         dictionary = `${dictionary}"${geocode}":${distrQty},`;
      }
      dictionary = dictionary.substring(0, dictionary.length - 1);
      dictionary = `${dictionary}}`;
      return dictionary;
   }

   public setPopupData(state: FullState) {
      const layerNames = ['zip', 'atz'];
      layerNames.forEach(name => {
         let fields = [];
         fields = [...this.createStandardPopupFields()];
         const template = new EsriApi.PopupTemplate({
            title: '{geocode}',
            content: [{
               type: 'fields',
               fieldInfos: fields
            }]
         });
         const layerId = this.configService.layers[name].boundaries.id;
         const layer = this.esriLayerService.getPortalLayerById(layerId);
         layer.popupTemplate = template;

      });
   }

   private createStandardPopupFields() : __esri.FieldInfo[] {
      const fields: Array<__esri.FieldInfo> = [];
      fields.push(this.createPopupField('zip', 'Zip'));
      fields.push(this.createPopupField('pricing_name', 'Pricing Market'));
      fields.push(this.createPopupField('sdm_name', 'Shared Distribution Market'));
      fields.push(this.createPopupField('wrap', 'Redplum Wrap Zone'));
      fields.push(this.createPopupField('county', 'DMA Code'));
      fields.push(this.createPopupField('county', 'County FIPS Code'));
      fields.push(this.createPopupField('cl0c00', '% CY HHs Familes With Related Children < 18 Yrs'));
      fields.push(this.createPopupField('cl2i0r', '% CY HHs w/HH Inc $50K +'));
      fields.push(this.createPopupField('cl2i0p', '% CY HHs w/HH Inc $75,000 +'));
      fields.push(this.createPopupField('cl0utw', '% CY Owner Occupied Housing Units'));
      fields.push(this.createPopupField('cl2prb', '% Pop White Alone Non-Hisp'));
      fields.push(this.createPopupField('cl2prw', '% Pop White Alone Non-Hisp'));
      fields.push(this.createPopupField('null', '% Population Growth 2018-2023'));
      fields.push(this.createPopupField('cl2i00', 'CY Median Household Income'));
      fields.push(this.createPopupField('cl2hwv', 'CY Median Value, Owner OCC Housing Units'));
      fields.push(this.createPopupField('hhld_w', 'HouseHolds, Winter'));
      fields.push(this.createPopupField('hhld_s', 'HouseHolds, Summer'));
      return fields;
   }

   private createPopupField(fieldName: string, fieldLabel: string) : __esri.FieldInfo {
      const field: __esri.FieldInfo = new EsriApi.FieldInfo({
         fieldName: fieldName,
         label: fieldLabel
      });
      return field;
   }
}