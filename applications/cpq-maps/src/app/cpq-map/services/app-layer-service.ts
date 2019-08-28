import { ComponentFactoryResolver, Injectable, Injector } from '@angular/core';
import { Store } from '@ngrx/store';
import { EsriApi, EsriDomainFactoryService, EsriLayerService, EsriMapService, EsriQueryService, SetLayerLabelExpressions } from '@val/esri';
import { LegendComponent } from '../components/legend/legend.component';
import { FullState } from '../state';
import { ConfigService } from './config.service';

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
               private resolver: ComponentFactoryResolver,
               private injector: Injector) { }

   private legendCreated = false;

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
      if (this.legendCreated) return;
      const node = this.generateLegendHTML();
      const expand: __esri.Expand = new EsriApi.Expand({ content: node, view: this.esriMapService.mapView });
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
       this.esriLayerService.createGraphicsLayer(groupName, layerName, graphics, addToBottomOfList);
     } else {
       layer.graphics.removeAll();
       layer.graphics.addMany(graphics);
     }
   }

  public setupAnneSoloLayers(shadeAnne: boolean, shadeSolo: boolean, groupName: string, analysisLevel: string) : void {
    const anneName = 'ANNE Geographies';
    const soloName = 'Solo Geographies';
    const group = this.esriLayerService.getGroup(groupName);
    this.setupDupeLayer(analysisLevel, anneName, group, shadeAnne, 'IIF($feature.owner_group_primary == "ANNE", 1, 0)');
    this.setupDupeLayer(analysisLevel, soloName, group, shadeSolo, 'IIF($feature.cov_frequency == "Solo", 1, 0)');
  }

  private setupDupeLayer(analysisLevel: string, layerName: string, group: __esri.GroupLayer, visibility: boolean, expression: string) : void {
    const currentLayer = this.esriLayerService.getFeatureLayer(layerName);
    if (currentLayer == null) {
      let layerId = null;
      let layerScale = null;
      for (const layerGroup of Object.values(this.configService.layers)) {
        if (layerGroup.group.analysisLevelName == analysisLevel) {
          layerId = layerGroup.boundaries.id;
          layerScale = layerGroup.boundaries.minScale;
          break;
        }
      }
      let fillStyle = 'horizontal';
      if (layerName.toLowerCase().includes('anne')) {
        fillStyle = 'diagonal-cross';
      }
      this.esriLayerService.createPortalLayer(layerId, layerName, layerScale, visibility).subscribe(newLayer => {
        newLayer.legendEnabled = false;
        newLayer.labelsVisible = false;
        newLayer.renderer = new EsriApi.UniqueValueRenderer({
          defaultSymbol: new EsriApi.SimpleFillSymbol({ color: [0, 0, 0, 0], outline: { color: [0, 0, 0, 0] } }),
          uniqueValueInfos: [{
            value: 1,
            symbol: new EsriApi.SimpleFillSymbol({
              style: fillStyle,
              color: [0, 0, 0, 1]
            })
          }],
          valueExpression: expression,
        });
        group.add(newLayer);
      });
    } else {
      currentLayer.visible = visibility;
    }
  }
}
