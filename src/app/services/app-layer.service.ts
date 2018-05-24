import { Injectable } from '@angular/core';
import { EsriModules } from '../esri-modules/core/esri-modules.service';
import { TargetAudienceService } from './target-audience.service';
import { EsriMapService } from '../esri-modules/core/esri-map.service';

@Injectable()
export class ValLayerService {

  private layerListWidget: __esri.LayerList;
  private sliderElementId: string = null;

  constructor(private modules: EsriModules,
      private topVars: TargetAudienceService,
      private mapService: EsriMapService){ }

  public static getAttributeValue(attributeInstance: any, fieldName: string) : any {
    return attributeInstance && (attributeInstance[fieldName.toLowerCase()] || attributeInstance[fieldName.toUpperCase()]);
  }

  public initLayerList(sliderElementId: string) : void {
    console.log('Loading Esri Modules for Layer Service');
    this.sliderElementId = sliderElementId;
    this.modules.onReady(() => { this.initImpl(); });
  }

  private initImpl() : void {
    console.log('Creating Layer List');

  }
}
