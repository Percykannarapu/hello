import { Injectable } from '@angular/core';
import { EsriLayerService, EsriApi } from '@val/esri';
import { FullState } from '../state';
import { ConfigService } from './config.service';
import { AppLayerService } from './app-layer-service';

interface PrintModel {
  clientName: string;
  layerSource: string;
  siteFeatures: Array<__esri.Graphic>;
  shadingFeatures: Array<__esri.Graphic>;
  boundaryDefinitionExpression: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppPrintingService {

  constructor (private esriLayerService: EsriLayerService,
    private configService: ConfigService,
    private appLayerService: AppLayerService) {}

  public createFeatureSet() {
    const shadingGraphics: __esri.Collection<__esri.Graphic> = this.esriLayerService.getGraphicsLayer('Selected Geos').graphics.clone();
    shadingGraphics.forEach(g => g.geometry = null);
    const definitionExpression = this.appLayerService.boundaryExpression;
    const siteGraphics: __esri.Collection<__esri.Graphic> = this.esriLayerService.getFeatureLayer('Project Sites').source;
    siteGraphics.forEach(g => delete g.attributes['OBJECTID']);
    const layerSource =this.configService.layers['zip'].boundaries.id;
    const printFeatures: PrintModel = { clientName: 'Buddy\'s Pizza', layerSource: layerSource, siteFeatures: siteGraphics.toArray(), shadingFeatures: shadingGraphics.toArray(), boundaryDefinitionExpression: definitionExpression };
    console.log(JSON.stringify(printFeatures, null, 2));
  }

}