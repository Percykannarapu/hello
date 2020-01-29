import { Injectable } from '@angular/core';
import PrintParameters from 'esri/tasks/support/PrintParameters';
import PrintTemplate from 'esri/tasks/support/PrintTemplate';
import { EsriMapService } from './esri-map.service';

@Injectable()
export class EsriPrintingService {

  constructor(private esriMapService: EsriMapService){}

    public createPrintPayload(templateOptions: {title: string, author: string, customTextElements: any}) : __esri.PrintParameters {
      const currentLayout: any  = {
        titleText: templateOptions.title,
        authorText: templateOptions.author,
        customTextElements: [{
          'description': templateOptions.customTextElements[0]
        }, {
          'projectID': templateOptions.customTextElements[1]
        }]
      } ;
      const template = new PrintTemplate({
          format: 'pdf',
          layout: 'imPower_Print_Layout',
          layoutOptions: currentLayout ,
         });

      return new PrintParameters({
         view: this.esriMapService.mapView,
         template: template
       });
    }

}
