import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { calculateStatistics, UniversalCoordinates } from '@val/common';
import { EsriApi, EsriDomainFactoryService, EsriLayerService, EsriMapService, EsriQueryService, EsriUtils, MapSymbols, SetLayerLabelExpressions } from '@val/esri';
import { FullState } from '../state';
import { AppShadingService } from './app-shading.service';
import { ConfigService } from './config.service';

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
               private appShadingService: AppShadingService) { }

   private currentLayerNames: Map<string, string[]> = new Map<string, string[]>();
   public analysisLevel: string;
   private legendRef: __esri.Expand = null;


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
        graphic.setAttribute('siteFk', s.siteId.toString());
        graphics.push(graphic);

        this.appShadingService.setSiteInfo(s.name, s.siteRef.toString());
      });
      const label = this.esriFactory.createLabelClass(new EsriApi.Color([0, 0, 255, 1]), '$feature.siteName');
      this.esriLayerService.createClientLayer(groupName, layerName, graphics, 'OBJECTID', renderer, null, [label]);
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

   public setWrapLayerVisibility(isWrap: boolean) : void {
     const wrapLayer = this.esriLayerService.getGroup(this.configService.layers.wrap.group.name);
     if (wrapLayer != null) {
       wrapLayer.visible = isWrap;
     }
   }
}
