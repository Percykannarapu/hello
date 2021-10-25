import { Injectable } from '@angular/core';
import { EsriLayerService } from '@val/esri';

@Injectable({ providedIn: 'root' })
export class AppLayerService {

  constructor(private layerService: EsriLayerService) { }

  public clearClientLayers() {
    this.layerService.clearClientLayers('Sites');
    this.layerService.clearClientLayers('Competitors');
  }
}
