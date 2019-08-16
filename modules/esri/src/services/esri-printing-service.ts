import { Injectable } from '@angular/core';
import { EsriMapService } from './esri-map.service';
import { EsriApi } from '../core/esri-api.service';




@Injectable()

export class EsriPrintingService {
  constructor(private esriMapService: EsriMapService){}

    public createPrintPayload(templateOptions: {title: string, author: string }) : __esri.PrintParameters {

      const currentLayout: any  = {
        titleText: templateOptions.title,
        authorText: templateOptions.author,
        // customTextElements: [{
        //   'description': 'My description',
        // 'location': 'My Location'
        // }]
      } ;

      const template = new EsriApi.PrintTemplate({
          format: 'pdf',
          layout: 'imPower_Print_Layout',
          layoutOptions: currentLayout ,
         });
      
      const params =  new EsriApi.PrintParameters({
        view: this.esriMapService.mapView,
        template: template
       });
       return params;
  
    }

}
