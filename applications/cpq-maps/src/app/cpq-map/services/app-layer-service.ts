import { ComponentFactoryResolver, Injectable, Injector } from '@angular/core';
import Expand from '@arcgis/core/widgets/Expand';
import { EsriLabelLayerOptions, EsriLayerService, EsriMapService, EsriService } from '@val/esri';
import { LegendComponent } from '../components/legend/legend.component';
import { FullState } from '../state/index';
import { MapUIState } from '../state/map-ui/map-ui.reducer';
import { ConfigService } from './config.service';
import { ShadingService } from './shading.service';

@Injectable({
   providedIn: 'root'
})
export class AppLayerService {

   constructor(private esriLayerService: EsriLayerService,
               private esriMapService: EsriMapService,
               private esri: EsriService,
               private configService: ConfigService,
               private shadingService: ShadingService,
               private resolver: ComponentFactoryResolver,
               private injector: Injector) { }

   private legendCreated = false;

   public updateLabels(state: FullState) {
      if (state.mapUI.isDistrQtyEnabled) {
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
     const layerExpressions: any = {
       ...state.esri.map.layerExpressions
     };
     layerExpressions[updateId] = {
       ...layerExpressions[updateId],
       expression: newExpression
     };
     this.esri.setLayerLabelExpressions(layerExpressions);
   }

   private showDistrQty(state: FullState) {
      let newExpression: string = '';
      let updateId: string = '';
      switch (state.shared.analysisLevel) {
         case 'zip':
            updateId = this.configService.layers['zip'].boundaries.id;
            newExpression = `var geoData = ${this.createArcadeDictionary(state)};
                             if(hasKey(geoData, $feature.geocode)) {
                               return $feature.geocode + TextFormatting.NewLine + Text(geoData[$feature.geocode], "#,###") + " HH";
                             }
                             return $feature.geocode;`;
            break;
         case 'atz':
            updateId = this.configService.layers['atz'].boundaries.id;
            newExpression = `var geoData = ${this.createArcadeDictionary(state)};
                             var atz = iif(count($feature.geocode) > 5, right($feature.geocode, count($feature.geocode) - 5), "");
                             if (hasKey(geoData, $feature.geocode)) {
                               var dist = Text(geoData[$feature.geocode], "#,###") + " HH";
                               if (count(atz) > 0) {
                                 return atz + TextFormatting.NewLine + dist;
                               }
                               return dist;
                             }
                             return atz;`;
            break;
         case 'wrap':
            updateId = this.configService.layers['zip'].boundaries.id; // yes, we update the zip labels if we are at wrap level
            newExpression = `var geoData = ${this.createArcadeDictionary(state)};
                             if(hasKey(geoData, $feature.geocode)) {
                               return $feature.geocode + TextFormatting.NewLine + Text(geoData[$feature.geocode], "#,###") + " HH";
                             }
                             return $feature.geocode;`;
            break;
      }
     const layerExpressions: { [layerId: string] : EsriLabelLayerOptions } = {
       ...state.esri.map.layerExpressions
     };
      layerExpressions[updateId] = {
        ...layerExpressions[updateId],
        expression: newExpression
      };
      this.esri.setLayerLabelExpressions(layerExpressions);
   }

   private createArcadeDictionary(state: FullState) : string {
     const data: Record<string, number> = {};
     for (const id of state.rfpUiEditDetail.ids) {
       const currentDetail = state.rfpUiEditDetail.entities[id];
       data[currentDetail.geocode] = currentDetail.distribution;
     }
     return JSON.stringify(data);
   }

   public setupLegend() {
      if (this.legendCreated) return;
      const node = this.generateLegendHTML();
      const expand: __esri.Expand = new Expand({ content: node, view: this.esriMapService.mapView });
      expand.expandIconClass = 'esri-icon-maps';
      expand.expandTooltip = 'Open Legend';
      this.esriMapService.mapView.ui.add(expand, 'top-right');
      this.legendCreated = true;
   }

   private generateLegendHTML() : HTMLDivElement {
     const legendFactory = this.resolver.resolveComponentFactory(LegendComponent);
     const legendComponent = legendFactory.create(this.injector);
     legendComponent.changeDetectorRef.detectChanges();
     return legendComponent.location.nativeElement;
   }

   public turnOnWrapLayer() : void {
     const wrapLayer = this.esriLayerService.getGroup(this.configService.layers.wrap.group.name);
     if (wrapLayer != null) {
       wrapLayer.visible = true;
     }
   }

   public initializeGraphicGroup(graphics: __esri.Graphic[], groupName: string, layerName: string, addToBottomOfList: boolean = false) : void {
     const layer = this.esriLayerService.getGraphicsLayer(layerName);
     if (layer == null) {
       this.esriLayerService.createGraphicsLayer(groupName, layerName, graphics, true, addToBottomOfList);
     } else {
       layer.graphics.removeAll();
       layer.graphics.addMany(graphics);
     }
   }

  public setupAnneSoloLayers(mapUIState: MapUIState, groupName: string, analysisLevel: string, recreateLayers: boolean) : void {
    const anneName = 'ANNE Geographies';
    const soloName = 'Solo Geographies';
    const group = this.esriLayerService.getGroup(groupName);
    const layerConfig = this.configService.layers[analysisLevel];
    this.shadingService.setupCrossHatchLayer(layerConfig, anneName, group, 'IIF($feature.owner_group_primary == "ANNE", 1, 0)', mapUIState.shadeAnne, recreateLayers, mapUIState.annePattern);
    this.shadingService.setupCrossHatchLayer(layerConfig, soloName, group, 'IIF($feature.cov_frequency == "Solo", 1, 0)', mapUIState.shadeSolo, recreateLayers, mapUIState.soloPattern);
  }
}
