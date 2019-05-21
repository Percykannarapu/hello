import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { calculateStatistics, groupByExtended, UniversalCoordinates } from '@val/common';
import { ColorPalette, EsriApi, EsriDomainFactoryService, EsriLayerService, EsriMapService, EsriQueryService, getColorPalette, MapSymbols, SetLayerLabelExpressions } from '@val/esri';
import { FullState } from '../state';
import { SetShadingData } from '../state/shared/shared.actions';
import { shadingType } from '../state/shared/shared.reducers';
import { ConfigService } from './config.service';
import { RfpUiEditWrapService } from './rfpEditWrap-service';
import { RfpUiEditDetailService } from './rfpUiEditDetail-service';

export interface SiteInformation {
  geocode?: string;
  name: string;
  coordinates: UniversalCoordinates;
  radius: number;
  siteId: number;
  siteRef: number;
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
   private siteIdMap: Map<string, string> = new Map<string, string>();
   public analysisLevel: string;
   private zipShadingMap: Map<string, number[]> = new Map<string, number[]>();
   private atzShadingMap: Map<string, number[]> = new Map<string, number[]>();
   private wrapShadingMap: Map<string, number[]> = new Map<string, number[]>();
   private geoHHC = new Map<string, string>();
   private legendRef: __esri.Expand = null;

   public boundaryExpression: string;
   
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
      siteInformation.forEach(s => {
        const graphic = this.esriLayerService.coordinateToGraphic(s.coordinates);
        graphic.setAttribute('OBJECTID', s.siteRef);
        graphic.setAttribute('siteId', s.siteRef.toString());
        graphic.setAttribute('siteName', s.name);
        graphic.setAttribute('radius', s.radius.toString());
        graphic.setAttribute('inHomeDate', s.inHomeDate);
        graphic.setAttribute('siteFk', s.siteId);
        graphics.push(graphic);

        this.siteIdMap.set(s.name, graphic.getAttribute('siteId').toString());
      });
      const label = this.esriFactory.createLabelClass(new EsriApi.Color([0, 0, 255, 1]), '$feature.SHADING_GROUP');
      this.esriLayerService.createClientLayer(groupName, layerName, graphics, 'OBJECTID', renderer, null, [label]);
   }

   // public removeLayer(groupName: string, layerName: string) {
   //    if (this.currentLayerNames.has(groupName)) {
   //       let layerFound: boolean = false;
   //       for (let i = 0; i < this.currentLayerNames.get(groupName).length; i++) {
   //          const currName = this.currentLayerNames.get(groupName)[i];
   //          if (layerName === currName) {
   //             layerFound = true;
   //             this.esriLayerService.removeLayer(layerName);
   //             const newList = this.currentLayerNames.get(groupName).filter(l => l !== currName);
   //             this.currentLayerNames.set(groupName, newList);
   //          }
   //       }
   //       if (!layerFound) {
   //          this.forceLayerRemoval(layerName);
   //       }
   //    } else {
   //       this.forceLayerRemoval(layerName);
   //    }
   // }

   // private forceLayerRemoval(layerName: string) : boolean {
   //    if (this.esriLayerService.getAllLayerNames().filter(l => l === layerName).length > 0) {
   //       this.esriLayerService.removeLayer(layerName);
   //       return true;
   //    }
   //    return false;
   // }

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
      const shadingData: Array<{key: string | number, value: number[]}> = [];
      this.setHouseholdCount(state);
      switch (state.shared.shadingType) {
         case shadingType.SITE:
            this.shadeBySite(state);
            for (const id of state.rfpUiEdit.ids) {
               const record = state.rfpUiEdit.entities[id];
               shadingData.push({ key: record.siteName, value: this.shadingMap.get(Number(record.siteId)) });
            }
            break;
         case shadingType.ZIP:
            this.shadeByZip(state);
            for (const key of Array.from(this.zipShadingMap.keys())) {
               shadingData.push({ key: key, value: this.zipShadingMap.get(key) });
            }
            break;
         case shadingType.WRAP_ZONE:
            this.shadeByWrapZone(state);
            for (const key of Array.from(this.wrapShadingMap.keys())) {
               shadingData.push({ key: key, value: this.wrapShadingMap.get(key) });
            }
            break;
         case shadingType.ATZ_DESIGNATOR:
            this.shadeByATZDesignator(state);
            for (const key of Array.from(this.atzShadingMap.keys())) {
               shadingData.push({ key: key, value: this.atzShadingMap.get(key) });
            }
            break;
         case shadingType.VARIABLE:
            this.shadeByVariable(state);
            break;
      }
      this.store$.dispatch(new SetShadingData({ shadingData: shadingData }));
   }

   // private setShadingData() {
   //    const shadingData: Array<{key: string | number, value: number[]}> = [];
   //    for (const key of Array.from(this.zipShadingMap.keys())) {
   //       shadingData.push({ key: key, value: this.zipShadingMap.get(key) });
   //    }
   // }

   private shadeByZip(state: FullState) {
      this.esriLayerService.getGraphicsLayer('Selected Geos').graphics.removeAll();
      const selectedGeos = this.editDetailService.getSelectedEditDetails(state);
      const sitesByZip: Map<string, string> = new Map<string, string>();

      if (state.rfpUiEditDetail.ids != null && state.rfpUiEditDetail.ids.length > 0){
         for (const id in state.rfpUiEditDetail.ids){
            if (state.rfpUiEditDetail.entities[id] != null && state.rfpUiEditDetail.entities[id].geocode && state.rfpUiEditDetail.entities[id].siteName != null){
               sitesByZip.set(state.rfpUiEditDetail.entities[id].geocode, state.rfpUiEditDetail.entities[id].siteName);
            }
         }
      }
      let count: number = 0;
      const uniques = new Set<string>();
      for (const geo of selectedGeos) {
        uniques.add(geo.zip);
         if (this.zipShadingMap.has(geo.zip)) {
            continue;
         } else {
            const palette: number [][] = getColorPalette(ColorPalette.Cpqmaps);
            palette.forEach(color => color.push(0.6));
            this.zipShadingMap.set(geo.zip, palette[count % palette.length]);
         }
         count++;
      }
      const uniqueZips = Array.from(uniques).map(z => `'${z}'`);
      this.boundaryExpression = `geocode in (${uniqueZips.join(',')})`;
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
            graphic.symbol = new EsriApi.SimpleFillSymbol({color: this.zipShadingMap.get(geo.getAttribute('zip'))});
            graphic.geometry = geo.geometry;
            graphic.setAttribute('geocode', geo.getAttribute('geocode'));
            if (this.geoHHC.has(geo.getAttribute('geocode')))
               graphic.setAttribute('householdCount', this.geoHHC.get(geo.getAttribute('geocode')));
            graphic.setAttribute('SHADING_GROUP', geo.getAttribute('zip'));
            if (sitesByZip.has(geo.getAttribute('geocode'))) {
               graphic.setAttribute('siteId', this.siteIdMap.get(sitesByZip.get(geo.getAttribute('geocode'))));
            }
            graphics.push(graphic);
         }
         this.esriLayerService.getGraphicsLayer('Selected Geos').graphics.addMany(graphics);
      });
   }

   // private parseWrapZoneName(wrapZone) : string {
   //    wrapZone = wrapZone.replace(new RegExp(/\ /, 'g'), '');
   //    wrapZone = wrapZone.replace(new RegExp(/\//, 'g'), '');
   //    wrapZone = wrapZone.toUpperCase();
   //    wrapZone = wrapZone.substr(0, 8);
   //    return wrapZone;
   // }

   private shadeByWrapZone(state: FullState) {
      this.esriLayerService.getGraphicsLayer('Selected Geos').graphics.removeAll();
      const selectedGeos = this.editDetailService.getSelectedEditDetails(state);
      const allZones = [];
      const sitesByWrapZone: Map<string, string> = new Map<string, string>();
      if (state.rfpUiEditWrap.ids != null && state.rfpUiEditWrap.ids.length > 0){
         for (const id in state.rfpUiEditWrap.ids){
            if (state.rfpUiEditWrap.entities[id] != null){
               sitesByWrapZone.set(state.rfpUiEditWrap.entities[id].wrapZone, state.rfpUiEditWrap.entities[id].siteName);
            }
         }
      }

      if (state.rfpUiEditDetail.ids != null && state.rfpUiEditDetail.ids.length > 0){
         for (const id in state.rfpUiEditDetail.ids){
            if (state.rfpUiEditDetail.entities[id] != null){
                  const wrapZoneList = {
                  geocode: state.rfpUiEditDetail.entities[id].geocode,
                  wrapZone: state.rfpUiEditDetail.entities[id].wrapZone,
                  hhc: state.rfpUiEditDetail.entities[id].households
               };
              allZones.push(wrapZoneList);
            }

         }
      }
      let count: number = 0;
      const wrapZones = this.editDetailService.getEditDetailsByWrapZone(state);
      for (const wrapZone of Array.from(wrapZones.keys())) {
         if (this.wrapShadingMap.has(wrapZones.get(wrapZone)[0].wrapZone)) {
            continue;
         } else {
            const palette: number [][] = getColorPalette(ColorPalette.Cpqmaps);
            palette.forEach(color => color.push(0.6));
            this.wrapShadingMap.set(wrapZones.get(wrapZone)[0].wrapZone, palette[count % palette.length]);
         }
         count++;
      }

      const query: __esri.Query = new EsriApi.Query();
      query.outFields = ['geocode, wrap_name'];
      query.where = 'wrap_name in (';
      selectedGeos.forEach(sg => query.where += `'${sg.wrapZone}',`);
      query.where = query.where.substr(0, query.where.length - 1);
      query.where += ')';
      const uniques = new Set<string>();
      this.queryService.executeQuery(this.configService.layers['wrap'].boundaries.id, query, true).subscribe(res => {
         const graphics: Array<__esri.Graphic> = [];
         for (const geo of res.features) {
            uniques.add(geo.getAttribute('geocode'));
            const graphic: __esri.Graphic = new EsriApi.Graphic();
            graphic.symbol = new EsriApi.SimpleFillSymbol({color: this.wrapShadingMap.get(geo.getAttribute('wrap_name'))});
            graphic.geometry = geo.geometry;
            graphic.setAttribute('geocode', geo.getAttribute('geocode'));
            graphic.setAttribute('wrapZone', geo.getAttribute('wrap_name'));
            graphic.setAttribute('SHADING_GROUP', geo.getAttribute('wrap_name'));
            if (this.geoHHC.has(geo.getAttribute('wrap_name')))
               graphic.setAttribute('householdCount', this.geoHHC.get(geo.getAttribute('wrap_name')));
            if (sitesByWrapZone.has(geo.getAttribute('wrap_name')))
               graphic.setAttribute('siteId', this.siteIdMap.get(sitesByWrapZone.get(geo.getAttribute('wrap_name'))));
            
            graphics.push(graphic);
         }
         const uniqueWrapZones = Array.from(uniques).map(w => `'${w}'`);
         this.boundaryExpression = `geocode in (${uniqueWrapZones.join(',')})`;
         this.esriLayerService.getGraphicsLayer('Selected Geos').graphics.addMany(graphics);
      });
   }

   private shadeByATZDesignator(state: FullState) {
      this.esriLayerService.getGraphicsLayer('Selected Geos').graphics.removeAll();
      const selectedGeos = this.editDetailService.getSelectedEditDetails(state);
      let count: number = 0;
      const designators = this.editDetailService.getEditDetailsByATZDesignator(state);
      const sitesByAtz: Map<string, string> = new Map<string, string>();

      for (const designator of Array.from(designators.keys())) {
         if (this.atzShadingMap.has(designator)) {
            continue;
         } else {
            const palette: number [][] = getColorPalette(ColorPalette.Cpqmaps);
            palette.forEach(color => color.push(0.6));
            this.atzShadingMap.set(designator, palette[count % palette.length]);
         }
         count++;
      }
      if (state.rfpUiEditDetail.ids != null && state.rfpUiEditDetail.ids.length > 0){
         for (const id in state.rfpUiEditDetail.ids){
            if (state.rfpUiEditDetail.entities[id] != null && state.rfpUiEditDetail.entities[id].geocode != null && state.rfpUiEditDetail.entities[id].siteName != null){
               sitesByAtz.set(state.rfpUiEditDetail.entities[id].geocode, state.rfpUiEditDetail.entities[id].siteName);
            }
         }
      }

      const query: __esri.Query = new EsriApi.Query();
      query.outFields = ['geocode, zip, atz'];
      query.where = 'geocode in (';
      selectedGeos.forEach(sg => query.where += `'${sg.geocode}',`);
      query.where = query.where.substr(0, query.where.length - 1);
      query.where += ')';
      const uniques = new Set<string>();
      this.queryService.executeQuery(this.configService.layers['atz'].boundaries.id, query, true).subscribe(res => {
         const graphics: Array<__esri.Graphic> = [];
         for (const geo of res.features) {
            const graphic: __esri.Graphic = new EsriApi.Graphic();
            uniques.add(geo.getAttribute('geocode'));

            let designator = geo.getAttribute('geocode');
            if (designator.length > 5)
               designator = designator.substring(5, designator.length);
            graphic.symbol = new EsriApi.SimpleFillSymbol({color: this.atzShadingMap.get(designator)});
            graphic.geometry = geo.geometry;
            graphic.setAttribute('geocode', geo.getAttribute('geocode'));
            if (this.geoHHC.has(geo.getAttribute('geocode')))
               graphic.setAttribute('householdCount', this.geoHHC.get(geo.getAttribute('geocode')));
            if (geo.getAttribute('atz') != null)
               graphic.setAttribute('SHADING_GROUP', geo.getAttribute('atz'));
            else
               graphic.setAttribute('SHADING_GROUP', 'Full Zip');
            if (sitesByAtz.has(geo.getAttribute('geocode'))) {
               graphic.setAttribute('siteId', this.siteIdMap.get(sitesByAtz.get(geo.getAttribute('geocode'))));
            }
            graphics.push(graphic);
         }
         const uniqueAtz = Array.from(uniques).map(a => `'${a}'`);
         this.boundaryExpression = `geocode in (${uniqueAtz.join(',')})`;
         this.esriLayerService.getGraphicsLayer('Selected Geos').graphics.addMany(graphics);
      });
   }

   private shadeByVariable(state: FullState) {
      console.warn('VARIABLE SHADING NOT IMPLEMENTED YET');
   }

   private shadeBySite(state: FullState) {
      const shadingGroups: Map<string, number> = new Map<string, number>();
      const shadingGroupName: Map<string, string> = new Map<string, string>();
      const selectedGeos: Array<string> = [];
      let count = 0;
      for (const site of state.rfpUiEdit.ids) {
         const siteId = state.rfpUiEdit.entities[site].siteId;
         const siteName = state.rfpUiEdit.entities[site].siteName;
         const palette: number [][] = getColorPalette(ColorPalette.Cpqmaps);
         palette.forEach(color => color.push(0.6));
         this.shadingMap.set(state.rfpUiEdit.entities[site].siteId, palette[count % palette.length]);
         for (const detail of state.rfpUiEditDetail.ids) {
            if (!state.rfpUiEditDetail.entities[detail].isSelected) continue;
            if (siteId === Number(state.rfpUiEditDetail.entities[detail].fkSite)) {
               selectedGeos.push(state.rfpUiEditDetail.entities[detail].geocode);
               shadingGroups.set(state.rfpUiEditDetail.entities[detail].geocode, siteId);
               shadingGroupName.set(state.rfpUiEditDetail.entities[detail].geocode, siteName);
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
      const uniqueGeos = Array.from(new Set(selectedGeos)).map(g => `'${g}'`);
      this.boundaryExpression = `geocode in (${uniqueGeos.join(',')})`;
      this.queryService.executeQuery(this.configService.layers[analysisLevel].boundaries.id, query, true).subscribe(res => {
         const graphics: Array<__esri.Graphic> = [];
            for (const geo of res.features) {
            const graphic: __esri.Graphic = new EsriApi.Graphic();
            graphic.symbol = new EsriApi.SimpleFillSymbol({color: this.shadingMap.get(shadingGroups.get(geo.getAttribute('geocode')))});
            graphic.geometry = geo.geometry;
            graphic.setAttribute('geocode', geo.getAttribute('geocode'));
            if (shadingGroupName.has(geo.getAttribute('geocode'))){
               graphic.setAttribute('SHADING_GROUP', shadingGroupName.get(geo.getAttribute('geocode')));
            }
            if (this.geoHHC.has(geo.getAttribute('geocode')))
               graphic.setAttribute('householdCount', this.geoHHC.get(geo.getAttribute('geocode')));
            if (this.siteIdMap.has(shadingGroupName.get(geo.getAttribute('geocode'))))
               graphic.setAttribute('siteId', this.siteIdMap.get(shadingGroupName.get(geo.getAttribute('geocode'))));   
            graphics.push(graphic);
            }
         if (this.esriLayerService.getGraphicsLayer('Selected Geos') == null)
            this.esriLayerService.createGraphicsLayer('Shading', 'Selected Geos', graphics, true);
         else {
            const layer: __esri.GraphicsLayer = this.esriLayerService.getGraphicsLayer('Selected Geos');
            layer.graphics.removeAll();
            layer.graphics.addMany(graphics);
         }
      });
   }

   private setHouseholdCount(state){
      const entities = (state.rfpUiEditDetail.ids as number[]).map(i => state.rfpUiEditDetail.entities[i]);
      const wrapCounts = groupByExtended(entities, item => item.wrapZone, item => item.households);
      if (state.rfpUiEditDetail.ids != null && state.rfpUiEditDetail.ids.length > 0){
         for (const id in state.rfpUiEditDetail.ids){
            if (state.rfpUiEditDetail.entities[id] != null){
               if (state.shared.shadingType === shadingType.WRAP_ZONE){
                  wrapCounts.forEach((v, k) => {
                        const val = v.reduce((p, c) => p + c);
                        this.geoHHC.set(k, val.toString());
                     });
               }
               else
                  this.geoHHC.set(state.rfpUiEditDetail.entities[id].geocode, state.rfpUiEditDetail.entities[id].households.toString());
            }
         }
      }
   }

   public toggleGeoShading(editDetailIds: number[], state: FullState, deletedGeocodes?: string[]) {
      if (editDetailIds.length < 1 && (deletedGeocodes == null || deletedGeocodes.length === 0)) {
         console.warn('attempted to toggle geo shading but no geos were provided');
         return;
      }
      let selectedGeocodes: Set<string> = new Set<string>();
      const fkSiteMap: Map<string, number | string> = new Map<string, number | string>();
      const wrapZones: Set<string> = new Set<string>();
      if (deletedGeocodes != null) {
        selectedGeocodes = new Set<string>(deletedGeocodes);
        deletedGeocodes.forEach(g => {
          if (state.shared.shadingType === shadingType.WRAP_ZONE) {
            wrapZones.add(fkSiteMap.get(g) as string);
          }
          fkSiteMap.delete(g);
        });
      } else {
        editDetailIds.forEach(id => {
          const ed = state.rfpUiEditDetail.entities[id];
          selectedGeocodes.add(ed.geocode);
          if (state.shared.shadingType === shadingType.WRAP_ZONE)
            fkSiteMap.set(ed.geocode, ed.wrapZone);
          else
            fkSiteMap.set(ed.geocode, ed.fkSite);
          wrapZones.add(ed.wrapZone);
        });
      }
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
            graphic.symbol = new EsriApi.SimpleFillSymbol({color: color});
            graphic.geometry = feature.geometry;
            graphic.setAttribute('geocode', feature.getAttribute('geocode'));
            graphic.setAttribute('wrapZone', feature.getAttribute('wrap_name'));
            graphics.push(graphic);
         });
         this.esriLayerService.getGraphicsLayer('Selected Geos').addMany(graphics);
      });
   }

   private getGeoColor(state: FullState, geocode: string, fkSiteMap?: Map<string, number | string>) : number[] {
      const palette: number [][] = getColorPalette(ColorPalette.Cpqmaps);
      switch (state.shared.shadingType) {
         case shadingType.SITE:
            return this.shadingMap.get(Number(fkSiteMap.get(geocode)));
         case shadingType.ZIP:
            if (this.zipShadingMap.has(geocode))
               return this.zipShadingMap.get(geocode);
            const nextColor = palette[(this.zipShadingMap.size + 1) % palette.length];
            this.zipShadingMap.set(geocode, nextColor);
            return nextColor;
         case shadingType.ATZ_DESIGNATOR:
            let designator = geocode;
            if (designator.length > 5)
               designator = designator.substring(5, designator.length);
            if (this.atzShadingMap.has(designator))
               return this.atzShadingMap.get(designator);
            const nextATZColor = palette[(this.atzShadingMap.size + 1) % palette.length];
            this.atzShadingMap.set(designator, nextATZColor);
            return nextATZColor;
         case shadingType.WRAP_ZONE:
            if (this.wrapShadingMap.has(geocode))
               return this.wrapShadingMap.get(geocode);
            const nextWrapColor = palette[(this.wrapShadingMap.size + 1) % palette.length];
            this.wrapShadingMap.set(geocode, nextWrapColor);
            return nextWrapColor;
         case shadingType.VARIABLE:
            return null;
         default:
            return null;
      }
   }

   // private getWrapShadingGroups(state: FullState) : { selectedGeos: Array<string>, shadingGroups: { groupName: string, ids: string[] }[] } {
   //    const shadingGroups: Map<string, Set<string>> = new Map<string, Set<string>>();
   //    const selectedGeos: Set<string> = new Set<string>();
   //    for (const wrapId of state.rfpUiEditWrap.ids) {
   //       const geos: Set<string> = new Set<string>();
   //       const siteName = state.rfpUiEditWrap.entities[wrapId].siteName;
   //       const zoneId = state.rfpUiEditWrap.entities[wrapId].wrapZoneId;
   //       for (const detailId of state.rfpUiEditDetail.ids) {
   //          if (!state.rfpUiEditDetail.entities[detailId].isSelected) continue;
   //          if (zoneId === state.rfpUiEditDetail.entities[detailId].wrapZoneId) {
   //             let wrapZone: string = state.rfpUiEditDetail.entities[detailId].wrapZone;
   //             wrapZone = wrapZone.replace(new RegExp(/\ /, 'g'), '');
   //             wrapZone = wrapZone.replace(new RegExp(/\//, 'g'), '');
   //             wrapZone = wrapZone.toUpperCase();
   //             wrapZone = wrapZone.substr(0, 8);
   //             selectedGeos.add(wrapZone);
   //             geos.add(wrapZone);
   //          }
   //       }
   //       if (shadingGroups.has(siteName)) {
   //          const ids = shadingGroups.get(siteName);
   //          geos.forEach(geo => ids.add(geo));
   //       } else {
   //          shadingGroups.set(siteName, geos);
   //       }
   //    }
   //    const data: Array<{ groupName: string, ids: Array<string> }> = [];
   //    for (const groupName of Array.from(shadingGroups.keys())) {
   //       const ids: Array<string> = Array.from(shadingGroups.get(groupName));
   //       const datum = { groupName: groupName, ids: ids };
   //       data.push(datum);
   //    }
   //    return { selectedGeos: Array.from(selectedGeos), shadingGroups: data };
   // }

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

   public setupLegend() {
      const node: HTMLElement = this.generateLegendHTML('legend', null);
      const expand: __esri.Expand = new EsriApi.Expand({ content: node, view: this.esriMapService.mapView });
      expand.expandIconClass = 'esri-icon-maps';
      expand.expandTooltip = 'Open Legend';
      this.esriMapService.mapView.ui.add(expand, 'top-right');
      this.legendRef = expand;
   }

   private generateLegendHTML(nodeId: string, state: FullState) : HTMLElement {
      if (this.legendRef)
         this.esriMapService.mapView.ui.remove(this.legendRef);
      const legend = document.createElement('div');
      legend.style.background = 'white';
      legend.innerHTML = document.getElementById(nodeId).innerHTML;
      return legend;
   }
}
