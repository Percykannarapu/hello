import { Injectable } from '@angular/core';
import { EsriLayerService, EsriApi } from '@val/esri';
import { FullState } from '../state';
import { ConfigService } from './config.service';

interface PrintModel {
  layerId: string;
  siteFeatures: Array<__esri.Graphic>;
  shadingFeatures: Array<__esri.Graphic>;
}

@Injectable({
  providedIn: 'root'
})
export class AppPrintingService {

  constructor (private esriLayerService: EsriLayerService,
    private configService: ConfigService) {}

  public createFeatureSet() {
    const shadingGraphics: __esri.Collection<__esri.Graphic> = this.esriLayerService.getGraphicsLayer('Selected Geos').graphics.clone();
    shadingGraphics.forEach(g => g.geometry = null);
    const siteGraphics: __esri.Collection<__esri.Graphic> = this.esriLayerService.getGraphicsLayer('Project Sites').graphics.clone();
    const layerId = this.configService.layers['zip'].boundaries.id;
    const printFeatures: PrintModel = { layerId: layerId, siteFeatures: siteGraphics.toArray(), shadingFeatures: shadingGraphics.toArray() };
    console.log(JSON.stringify(printFeatures, null, 2));
  }

}