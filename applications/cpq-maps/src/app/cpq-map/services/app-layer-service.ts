import { Injectable } from '@angular/core';
import { ColorPalette, EsriLayerService, MapSymbols, EsriApi, EsriMapService, SetHighlightOptions, SetSelectedGeos, SetLayerLabelExpressions, EsriQueryService, getColorPalette, EsriDomainFactoryService } from '@val/esri';
import { UniversalCoordinates } from '@val/common';
import { calculateStatistics } from '@val/common';
import { Store } from '@ngrx/store';
import { HighlightMode } from '@val/esri';
import { FullState } from '../state';
import { ConfigService } from './config.service';
import { RfpUiEditDetail } from '../../val-modules/mediaexpress/models/RfpUiEditDetail';
import { UpsertRfpUiEditDetail, UpsertRfpUiEditDetails } from '../state/rfpUiEditDetail/rfp-ui-edit-detail.actions';
import { PopupGeoToggle } from '../state/shared/shared.actions';
import { RfpUiEditWrap } from 'src/app/val-modules/mediaexpress/models/RfpUiEditWrap';
import { UpsertRfpUiEditWrap, UpsertRfpUiEditWraps } from '../state/rfpUiEditWrap/rfp-ui-edit-wrap.actions';
import { RfpUiEditWrapService } from './rfpEditWrap-service';
import { RfpUiEditDetailService } from './rfpUiEditDetail-service';
import { shadingType } from '../state/shared/shared.reducers';

export interface SiteInformation {
  geocode?: string;
  name: string;
  coordinates: UniversalCoordinates;
  radius: number;
  siteId: number;
  inHomeDate: string;
}

@Injectable({
   providedIn: 'root'
})
export class AppLayerService {

   constructor(private esriLayerService: EsriLayerService,
               private esriMapService: EsriMapService,
               private queryService: EsriQueryService,
               private esriFactory: EsriDomainFactoryService,
               private store$: Store<FullState>,
               private configService: ConfigService,
               private wrapService: RfpUiEditWrapService,
               private editDetailService: RfpUiEditDetailService) { }

   private currentLayerNames: Map<string, string[]> = new Map<string, string[]>();
   private shadingMap: Map<number, number[]> = new Map<number, number[]>();
   private analysisLevel: string;
   private zipShadingMap: Map<string, number[]> = new Map<string, number[]>();
   private atzShadingMap: Map<string, number[]> = new Map<string, number[]>();
   private wrapShadingMap: Map<string, number[]> = new Map<string, number[]>();
   private newGeoId: number = 500000;

   public addLocationsLayer(groupName: string, layerName: string, siteInformation: SiteInformation[], analysisLevel: string) {
      this.analysisLevel = analysisLevel;
      const renderer = new EsriApi.SimpleRenderer({
         symbol: new EsriApi.SimpleMarkerSymbol({
            color: [0, 0, 255, 1],
            path: MapSymbols.STAR,
            outline: new EsriApi.SimpleLineSymbol({
              color: [0, 0, 0, 0],
              width: 0
            })
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
      const graphics: Array<__esri.Graphic> = [];
      let fakeOid = 0;
      siteInformation.forEach(s => {
        const graphic = this.esriLayerService.coordinateToGraphic(s.coordinates);
        graphic.setAttribute('OBJECTID', fakeOid++);
        graphic.setAttribute('SHADING_GROUP', s.name);
        graphic.setAttribute('radius', s.radius.toString());
        graphic.setAttribute('siteId', s.siteId.toString());
        graphic.setAttribute('inHomeDate', s.inHomeDate);
        graphics.push(graphic);
      });
      const label = this.esriFactory.createLabelClass(new EsriApi.Color([0, 0, 255, 1]), '$feature.SHADING_GROUP');
      this.esriLayerService.createClientLayer(groupName, layerName, graphics, 'OBJECTID', renderer, null, [label]);
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

   public addTradeAreaRings(siteInformation: SiteInformation[], radius: number) {
      this.esriLayerService.removeLayer('Trade Area');
      const symbol = new EsriApi.SimpleFillSymbol({
        style: 'solid',
        color: [0, 0, 0, 0],
        outline: {
          style: 'solid',
          color: [0, 0, 255, 1],
          width: 2
        }
      });
      const points: Array<__esri.Point> = [];
      for (const siteInfo of siteInformation) {
         const point: __esri.Point = new EsriApi.Point();
         point.x = siteInfo.coordinates.x;
         point.y = siteInfo.coordinates.y;
         points.push(point);
      }
      EsriApi.geometryEngineAsync.geodesicBuffer(points, radius, 'miles', false).then(geoBuffer => {
         const geometry = Array.isArray(geoBuffer) ? geoBuffer : [geoBuffer];
         const graphics = geometry.map(g => {
            return new EsriApi.Graphic({
               geometry: g,
               symbol: symbol,
            });
         });
         this.esriLayerService.createGraphicsLayer('Sites', 'Trade Areas', graphics);
      });
   }

   public zoomToTradeArea(siteInformation: SiteInformation[]) {
      const latitudes: Array<number> = [];
      const longitudes: Array<number> = [];
      for (const siteInfo of siteInformation) {
         latitudes.push(siteInfo.coordinates.y);
         longitudes.push(siteInfo.coordinates.x);
      }
      const xStats = calculateStatistics(longitudes);
      const yStats = calculateStatistics(latitudes);
      this.esriMapService.zoomOnMap(xStats, yStats, latitudes.length);
   }

   public shadeMap(state: FullState) {
      switch (state.shared.shadingType) {
         case shadingType.SITE:
            this.shadeBySite(state);
            break;
         case shadingType.ZIP:
            this.shadeByZip(state);
            break;
         case shadingType.WRAP_ZONE:
            this.shadeByWrapZone(state);
            break;
         case shadingType.ATZ_DESIGNATOR:
            this.shadeByATZDesignator(state);
            break;
         case shadingType.VARIABLE:
            this.shadeByVariable(state);
            break;
      }
   }

   private shadeByZip(state: FullState) {
      this.esriLayerService.getGraphicsLayer('Selected Geos').graphics.removeAll();
      const selectedGeos = this.editDetailService.getSelectedEditDetails(state);
      let count: number = 0;
      for (const geo of selectedGeos) {
         if (this.zipShadingMap.has(geo.zip)) {
            continue;
         } else {
            const pallete: number [][] = getColorPalette(ColorPalette.Cpqmaps);
            pallete.forEach(color => color.push(0.6));
            this.zipShadingMap.set(geo.zip, pallete[count % pallete.length]);
         }
         count++;
      }
      const analysisLevel: string = state.shared.analysisLevel;
      const query: __esri.Query = new EsriApi.Query();
      query.outFields = ['geocode, zip'];
      query.where = 'geocode in (';
      selectedGeos.forEach(sg => query.where += `'${sg.geocode}',`);
      query.where = query.where.substr(0, query.where.length - 1);
      query.where += ')';
      this.queryService.executeQuery(this.configService.layers[analysisLevel].boundaries.id, query, true).subscribe(res => {
         const graphics: Array<__esri.Graphic> = [];
         for (const geo of res.features) {
            const graphic: __esri.Graphic = new EsriApi.Graphic();
            const symbol: __esri.Symbol = new EsriApi.SimpleFillSymbol({ color:  this.zipShadingMap.get(geo.getAttribute('zip'))});
            graphic.symbol = symbol;
            graphic.geometry = geo.geometry;
            graphic.setAttribute('geocode', geo.getAttribute('geocode'));
            graphics.push(graphic);
         }
         this.esriLayerService.getGraphicsLayer('Selected Geos').graphics.addMany(graphics);
      });
   }

   private parseWrapZoneName(wrapZone) : string {
      wrapZone = wrapZone.replace(new RegExp(/\ /, 'g'), '');
      wrapZone = wrapZone.replace(new RegExp(/\//, 'g'), '');
      wrapZone = wrapZone.toUpperCase();
      wrapZone = wrapZone.substr(0, 8);
      return wrapZone;
   }

   private shadeByWrapZone(state: FullState) {
      this.esriLayerService.getGraphicsLayer('Selected Geos').graphics.removeAll();
      const selectedGeos = this.editDetailService.getSelectedEditDetails(state);
      let count: number = 0;
      const wrapZones = this.editDetailService.getEditDetailsByWrapZone(state);
      for (const wrapZone of Array.from(wrapZones.keys())) {
         if (this.wrapShadingMap.has(wrapZones.get(wrapZone)[0].wrapZone)) {
            continue;
         } else {
            const pallete: number [][] = getColorPalette(ColorPalette.Cpqmaps);
            pallete.forEach(color => color.push(0.6));
            this.wrapShadingMap.set(wrapZones.get(wrapZone)[0].wrapZone, pallete[count % pallete.length]);
         }
         count++;
      }
      const query: __esri.Query = new EsriApi.Query();
      query.outFields = ['geocode, wrap_name'];
      query.where = 'wrap_name in (';
      selectedGeos.forEach(sg => query.where += `'${sg.wrapZone}',`);
      query.where = query.where.substr(0, query.where.length - 1);
      query.where += ')';
      this.queryService.executeQuery(this.configService.layers['wrap'].boundaries.id, query, true).subscribe(res => {
         const graphics: Array<__esri.Graphic> = [];
         for (const geo of res.features) {
            const graphic: __esri.Graphic = new EsriApi.Graphic();
            const symbol: __esri.Symbol = new EsriApi.SimpleFillSymbol({ color:  this.wrapShadingMap.get(geo.getAttribute('wrap_name')) });
            graphic.symbol = symbol;
            graphic.geometry = geo.geometry;
            graphic.setAttribute('geocode', geo.getAttribute('geocode'));
            graphic.setAttribute('wrapZone', geo.getAttribute('wrap_name'));
            graphics.push(graphic);
         }
         this.esriLayerService.getGraphicsLayer('Selected Geos').graphics.addMany(graphics);
      });
   }

   private shadeByATZDesignator(state: FullState) {
      this.esriLayerService.getGraphicsLayer('Selected Geos').graphics.removeAll();
      const selectedGeos = this.editDetailService.getSelectedEditDetails(state);
      let count: number = 0;
      const designators = this.editDetailService.getEditDetailsByATZDesignator(state);
      for (const designator of Array.from(designators.keys())) {
         if (this.atzShadingMap.has(designator)) {
            continue;
         } else {
            const pallete: number [][] = getColorPalette(ColorPalette.Cpqmaps);
            pallete.forEach(color => color.push(0.6));
            this.atzShadingMap.set(designator, pallete[count % pallete.length]);
         }
         count++;
      }
      const query: __esri.Query = new EsriApi.Query();
      query.outFields = ['geocode, zip'];
      query.where = 'geocode in (';
      selectedGeos.forEach(sg => query.where += `'${sg.geocode}',`);
      query.where = query.where.substr(0, query.where.length - 1);
      query.where += ')';
      this.queryService.executeQuery(this.configService.layers['atz'].boundaries.id, query, true).subscribe(res => {
         const graphics: Array<__esri.Graphic> = [];
         for (const geo of res.features) {
            const graphic: __esri.Graphic = new EsriApi.Graphic();
            let designator = geo.getAttribute('geocode');
            if (designator.length > 5)
               designator = designator.substring(5, designator.length);
            const symbol: __esri.Symbol = new EsriApi.SimpleFillSymbol({ color:  this.atzShadingMap.get(designator)});
            graphic.symbol = symbol;
            graphic.geometry = geo.geometry;
            graphic.setAttribute('geocode', geo.getAttribute('geocode'));
            graphics.push(graphic);
         }
         this.esriLayerService.getGraphicsLayer('Selected Geos').graphics.addMany(graphics);
      });
   }

   private shadeByVariable(state: FullState) {
      console.warn('VARIABLE SHADING NOT IMPLEMENTED YET');
   }

   private shadeBySite(state: FullState) {
      const shadingGroups: Map<string, number> = new Map<string, number>();
      const selectedGeos: Array<string> = [];
      let count = 0;
      for (const site of state.rfpUiEdit.ids) {
         const geos: Array<string> = [];
         const siteId = state.rfpUiEdit.entities[site].siteId;
         const pallete: number [][] = getColorPalette(ColorPalette.Cpqmaps);
         pallete.forEach(color => color.push(0.6));
         this.shadingMap.set(state.rfpUiEdit.entities[site].siteId, pallete[count % pallete.length]);
         for (const detail of state.rfpUiEditDetail.ids) {
            if (!state.rfpUiEditDetail.entities[detail].isSelected) continue;
            if (siteId === Number(state.rfpUiEditDetail.entities[detail].fkSite)) {
               geos.push(state.rfpUiEditDetail.entities[detail].geocode);
               selectedGeos.push(state.rfpUiEditDetail.entities[detail].geocode);
               shadingGroups.set(state.rfpUiEditDetail.entities[detail].geocode, siteId);
            }
         }
         count++;
      }
      const analysisLevel = state.shared.analysisLevel;
      const query: __esri.Query = new EsriApi.Query();
      query.outFields = ['geocode, zip'];
      query.where = 'geocode in (';
      selectedGeos.forEach(sg => query.where += `'${sg}',`);
      query.where = query.where.substr(0, query.where.length - 1);
      query.where += ')';
      this.queryService.executeQuery(this.configService.layers[analysisLevel].boundaries.id, query, true).subscribe(res => {
         const graphics: Array<__esri.Graphic> = [];
         for (const geo of res.features) {
            const graphic: __esri.Graphic = new EsriApi.Graphic();
            const symbol: __esri.Symbol = new EsriApi.SimpleFillSymbol({ color:  this.shadingMap.get(shadingGroups.get(geo.getAttribute('geocode')))});
            graphic.symbol = symbol;
            graphic.geometry = geo.geometry;
            graphic.setAttribute('geocode', geo.getAttribute('geocode'));
            graphics.push(graphic);
         }
         if (this.esriLayerService.getGraphicsLayer('Selected Geos') == null)
            this.esriLayerService.createGraphicsLayer('Shading', 'Selected Geos', graphics, true);
         else {
            this.esriLayerService.getGraphicsLayer('Selected Geos').graphics.removeAll();
            this.esriLayerService.getGraphicsLayer('Selected Geos').graphics.addMany(graphics);
         }
      });
   }

   public toggleGeoShading(editDetails: RfpUiEditDetail[], state: FullState) {
      if (editDetails.length < 1) {
         console.warn('attempted to toggle geo shading but no geos were provided');
         return;
      }
      const selectedGeocodes: Set<string> = new Set<string>();
      const fkSiteMap: Map<string, number | string> = new Map<string, number | string>();
      const wrapZones: Set<string> = new Set<string>();
      editDetails.forEach(ed => {
         selectedGeocodes.add(ed.geocode);
         if (state.shared.shadingType === shadingType.WRAP_ZONE)
            fkSiteMap.set(ed.geocode, ed.wrapZone);
         else
            fkSiteMap.set(ed.geocode, ed.fkSite);
         wrapZones.add(ed.wrapZone);
      });
      const existingGraphics: Array<__esri.Graphic> = this.esriLayerService.getGraphicsLayer('Selected Geos').graphics.filter(g => 
         selectedGeocodes.has(g.getAttribute('geocode')) || 
         (state.shared.isWrap && g.getAttribute('wrapZone') != undefined && wrapZones.has(g.getAttribute('wrapZone')))
      ).toArray();
      if (existingGraphics.length > 0) {
         this.esriLayerService.getGraphicsLayer('Selected Geos').removeMany(existingGraphics);
         return;
      }
      const query: __esri.Query = new EsriApi.Query();
      query.outFields = ['geocode, wrap_name'];
      let analysisLevel = '';
      if (state.shared.isWrap) {
         query.where = `wrap_name in (`;
         wrapZones.forEach(wz => query.where += `'${wz}',`);
         query.where = query.where.substr(0, query.where.length - 1);
         query.where += ')';
         analysisLevel = 'zip'; 

      } else {
         analysisLevel = state.shared.analysisLevel;
         query.where = `geocode in (`;
         selectedGeocodes.forEach(sg => query.where += `'${sg}',`);
         query.where = query.where.substr(0, query.where.length - 1);
         query.where += ')';
      }
      if (state.shared.shadingType === shadingType.WRAP_ZONE)
         analysisLevel = 'wrap'; // this is one of the only times we set analysis level to wrap
      this.queryService.executeQuery(this.configService.layers[analysisLevel].boundaries.id, query, true).subscribe(res => {
         const graphics: Array<__esri.Graphic> = [];
         res.features.forEach (feature => {
            const graphic: __esri.Graphic = new EsriApi.Graphic();
            let color = null;
            if (state.shared.shadingType === shadingType.WRAP_ZONE)
               color = this.getGeoColor(state, feature.getAttribute('wrap_name'), fkSiteMap);
            else
               color = this.getGeoColor(state, feature.getAttribute('geocode'), fkSiteMap);
            const symbol = new EsriApi.SimpleFillSymbol({ color: color });
            graphic.symbol = symbol;
            graphic.geometry = feature.geometry;
            graphic.setAttribute('geocode', feature.getAttribute('geocode'));
            graphic.setAttribute('wrapZone', feature.getAttribute('wrap_name'));
            graphics.push(graphic);
         });
         this.esriLayerService.getGraphicsLayer('Selected Geos').addMany(graphics);
      });
   }

   private getGeoColor(state: FullState, geocode: string, fkSiteMap?: Map<string, number | string>) : number[] {
      const pallete: number [][] = getColorPalette(ColorPalette.Cpqmaps);
      switch (state.shared.shadingType) {
         case shadingType.SITE:
            return this.shadingMap.get(Number(fkSiteMap.get(geocode)));
         case shadingType.ZIP:
            if (this.zipShadingMap.has(geocode))
               return this.zipShadingMap.get(geocode);
            const length = Array.from(this.zipShadingMap.keys()).length;
            const nextColor = pallete[(length + 1) % pallete.length];
            this.zipShadingMap.set(geocode, nextColor);
            return nextColor;
         case shadingType.ATZ_DESIGNATOR:
            let designator = geocode;
            if (designator.length > 5)
               designator = designator.substring(5, designator.length);
            if (this.atzShadingMap.has(designator))
               return this.atzShadingMap.get(designator);
            const atzMapLength = Array.from(this.atzShadingMap.keys()).length;
            const nextATZColor = pallete[(atzMapLength + 1) % pallete.length];
            this.atzShadingMap.set(designator, nextATZColor);
            return nextATZColor;
         case shadingType.WRAP_ZONE:
            if (this.wrapShadingMap.has(geocode))
               return this.wrapShadingMap.get(geocode);
            const wrapMaplength = Array.from(this.wrapShadingMap.keys()).length;
            const nextWrapColor = pallete[(wrapMaplength + 1) % pallete.length];
            this.wrapShadingMap.set(geocode, nextColor);
            return nextWrapColor;
         case shadingType.VARIABLE:
            return null;
         default:
            return null;
      }
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
      const layerNames = ['zip', 'atz', 'wrap'];
      layerNames.forEach(name => {
         const layerId = this.configService.layers[name].boundaries.id;
         const layer = this.esriLayerService.getPortalLayerById(layerId);
         if (name !== state.shared.analysisLevel || name === 'wrap') {
           layer.popupTemplate = null;
           return;
         }
         let fields = [];
         fields = [...this.createStandardPopupFields()];
         const toggleAction: __esri.ActionButton = new EsriApi.ActionButton({
          title: 'Add/Remove Geo',
          id: 'toggle-selection',
          className: 'esri-icon-plus-circled'
         });
         const template = new EsriApi.PopupTemplate({
            title: '{geocode} {city_name}',
            content: [{
               type: 'fields',
               fieldInfos: fields
            }],
            actions: [toggleAction]
         });     
         layer.popupTemplate = template;
      });
      this.esriMapService.mapView.popup.on('trigger-action', (event) => this.store$.dispatch(new PopupGeoToggle({ eventName: 'toggle-selection' })));
   }

   // TODO: This method should be refactored into two different methods,
   // one for wrap and one for non-wrap, the logic in here is getting too complex
   public onPopupToggleAction(event: string, state: FullState) {
     if (event !== 'toggle-selection') {
       return;
     }
     const selectedFeature = this.esriMapService.mapView.popup.selectedFeature;
     const geocode: string = selectedFeature.attributes.geocode;
     const wrapZone: string = selectedFeature.attributes.wrap_name;
     const exisintgEditDetails: Array<RfpUiEditDetail> = this.editDetailService.getEditDetailsByGeocode(geocode, state).map(ed => {
        if (!state.shared.isWrap)
          ed.isSelected = !ed.isSelected; //only toggle this state if we aren't using wrap
        return ed;
     });
     const found: boolean = exisintgEditDetails.length > 0;
     if (found && !state.shared.isWrap) {
       this.store$.dispatch(new UpsertRfpUiEditDetails({ rfpUiEditDetails: exisintgEditDetails }));
     } else if (found && state.shared.isWrap) {
       const existingEditWraps: Array<RfpUiEditWrap> = this.wrapService.getEditWrapZonesByZoneName(wrapZone, state).map(wz => {
          wz.isSelected = !wz.isSelected;
          return wz;
       }); 
       this.store$.dispatch(new UpsertRfpUiEditWraps({ rfpUiEditWraps: existingEditWraps }));
     } else {
       if (!state.shared.isWrap) {
         const query = new EsriApi.Query();
         query.outFields = ['geocode'];
         query.where = `geocode = '${selectedFeature.attributes.geocode}'`;
         this.queryService.executeQuery(this.configService.layers[state.shared.analysisLevel].centroids.id, query, true).subscribe(res => {
            this.createNewRfpUiEditDetails([{ geocode: geocode, point: <__esri.Point> res.features[0].geometry, zip: geocode.substr(0, 5) }]);   
         });
       } else {
         this.createNewRfpUiEditWrap(wrapZone);
       }
     }
   }

   private createNewRfpUiEditWrap(wrapZone: string) {
      const newWrap = new RfpUiEditWrap();
      newWrap.wrapZone = wrapZone;
      newWrap['@ref'] = this.newGeoId;
      newWrap.isSelected = true;
      this.newGeoId++;
      this.store$.dispatch(new UpsertRfpUiEditWraps({ rfpUiEditWraps: [newWrap] }));
      const query: __esri.Query = new EsriApi.Query();
      query.outFields = ['geocode'];
      query.where = `wrap_name = '${wrapZone}'`;
      this.queryService.executeQuery(this.configService.layers['zip'].boundaries.id, query, false).subscribe(res => {
         const wrapGeocodes: Array<string> = [];
         res.features.forEach(f => wrapGeocodes.push(f.getAttribute('geocode')));
         const pointQuery = new EsriApi.Query();
         pointQuery.outFields = ['geocode'];
         pointQuery.where = 'geocode IN (';
         wrapGeocodes.forEach(wg => pointQuery.where += `'${wg}',`);
         pointQuery.where = pointQuery.where.substr(0, pointQuery.where.length - 1);
         pointQuery.where += ')';
         this.queryService.executeQuery(this.configService.layers['zip'].centroids.id, pointQuery, true).subscribe(pointRes => {
            const editDetailsInput: Array<{ geocode: string, point: __esri.Point, wrapZone: string, zip: string }> = [];
            pointRes.features.forEach(f => {
               const centroid: __esri.Point = <__esri.Point> f.geometry;
               editDetailsInput.push({ geocode: f.getAttribute('geocode'), point: centroid, wrapZone: wrapZone, zip: f.getAttribute('geocode') });
            });
            this.createNewRfpUiEditDetails(editDetailsInput);
         });
      });
   }

   private createNewRfpUiEditDetails(editDetailInput: { geocode: string, point: __esri.Point, wrapZone?: string, zip?: string }[]) {
     const newDetails: Array<RfpUiEditDetail> = [];
     editDetailInput.forEach(edi => {
         const newDetail: RfpUiEditDetail = new RfpUiEditDetail();
         const closestSite: __esri.Graphic = this.findClosestSite(edi.point);
         newDetail.geocode = edi.geocode;
         newDetail.isSelected = true;
         newDetail.fkSite = closestSite.getAttribute('siteId');
         newDetail['@ref'] = this.newGeoId;
         if (edi.wrapZone != null)
            newDetail.wrapZone = edi.wrapZone;
         if (edi.zip != null)
            newDetail.zip = edi.zip;
         this.newGeoId++;
         newDetails.push(newDetail);
     });

     this.store$.dispatch(new UpsertRfpUiEditDetails({ rfpUiEditDetails: newDetails }));
   }

   private findClosestSite(point: __esri.Point) : __esri.Graphic {
     const geometry: __esri.Multipoint = new EsriApi.Multipoint();
     const layer: __esri.FeatureLayer = <__esri.FeatureLayer> this.esriLayerService.getLayer('Project Sites');
     layer.source.forEach(g => {
       const p: __esri.Point = <__esri.Point> g.geometry;
       geometry.addPoint([p.x, p.y]);
     });
     const nearestPoint = EsriApi.geometryEngine.nearestCoordinate(geometry, point);
     const sitesGraphic: __esri.Collection<__esri.Graphic> = layer.source.filter(gr => {
       const p: __esri.Point = <__esri.Point> gr.geometry;
       return p.x === nearestPoint.coordinate.x && p.y === nearestPoint.coordinate.y;
     });
     return sitesGraphic.getItemAt(0);
   }

   private createStandardPopupFields() : __esri.FieldInfo[] {
      const fields: Array<__esri.FieldInfo> = [];
      fields.push(this.createPopupField('zip', 'Zip'));
      fields.push(this.createPopupField('pricing_name', 'Pricing Market'));
      fields.push(this.createPopupField('sdm_name', 'Shared Distribution Market'));
      fields.push(this.createPopupField('wrap_name', 'Redplum Wrap Zone'));
      fields.push(this.createPopupField('dma_code', 'DMA Code'));
      fields.push(this.createPopupField('county', 'County FIPS Code'));
      fields.push(this.createPopupField('cl0c00', '% CY HHs Familes With Related Children < 18 Yrs', 2));
      fields.push(this.createPopupField('cl2i0r', '% CY HHs w/HH Inc $50K +', 2));
      fields.push(this.createPopupField('cl2i0p', '% CY HHs w/HH Inc $75,000 +', 2));
      fields.push(this.createPopupField('cl0utw', '% CY Owner Occupied Housing Units', 2));
      fields.push(this.createPopupField('cl2prb', '% Pop Black Alone Non-Hisp', 2));
      fields.push(this.createPopupField('cl2prw', '% Pop White Alone Non-Hisp', 2));
      fields.push(this.createPopupField('cl2i00', 'CY Median Household Income'));
      fields.push(this.createPopupField('cl2hwv', 'CY Median Value, Owner OCC Housing Units'));
      fields.push(this.createPopupField('hhld_w', 'HouseHolds, Winter'));
      fields.push(this.createPopupField('hhld_s', 'HouseHolds, Summer'));
      return fields;
   }

   private createPopupField(fieldName: string, fieldLabel: string, places?: number) : __esri.FieldInfo {
      const field: __esri.FieldInfo = new EsriApi.FieldInfo({
         fieldName: fieldName,
         label: fieldLabel,
         format: {
            places: places != null ? places : 0
         }
      });
      return field;
   }
}
