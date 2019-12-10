import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { EsriApi } from '../core/esri-api.service';
import { EsriMapService } from './esri-map.service';

@Injectable()
export class EsriGeoprocessorService {

  constructor(private esriMapService: EsriMapService) { }

  public processJob<T>(serviceUrl: string, servicePayload: any, resultType: string = 'out_features') : Observable<{ value: T }> {
    const processor = new EsriApi.Geoprocessor({ url: serviceUrl });
    return Observable.create(async observer => {
      try {
        const jobResult = await processor.submitJob(servicePayload);
        if (jobResult.jobStatus === 'job-failed') {
            observer.error(jobResult);
          } else {
            const dataResult = await processor.getResultData(jobResult.jobId, resultType);
            observer.next(dataResult);
            observer.complete();
          }
      } catch (err) {
        observer.error(err);
      }
    });
  }

  public processPrintJob<T>(printServiceUrl: string, servicePayload: __esri.PrintParameters) : Observable<T> {

    const processor: any = new EsriApi.PrintTask({url: printServiceUrl});
    const proxy_getPrintDefinition = processor._getPrintDefinition;
    
    processor._getPrintDefinition = function() {
       return proxy_getPrintDefinition.apply(processor, arguments).then((result) => {
         console.log('Print Payload::', result);
         result.operationalLayers.forEach(l => {
           if (l.showLabels){
            l.layerDefinition.drawingInfo.labelingInfo[0].removeDuplicates = 'none';
            if (l.title === 'ZIP Boundaries'){
              l.layerDefinition.drawingInfo.labelingInfo[0].symbol.font.size = 9;
             }
             if (l.title === 'ATZ Boundaries' || l.title === 'Digital ATZ Boundaries' || l.title === 'PCR Boundaries'){
              l.layerDefinition.drawingInfo.labelingInfo[0].symbol.font.size = 7;
             }
           }
            
         });
         return result;
       });
 
    };


   return Observable.create(async observer => {
      try {
        const printResult = await processor.execute(servicePayload);
        if (printResult != null && printResult.url != null) {
            observer.next(printResult.url);
            observer.complete();
          } 
        } catch (err) {
          observer.error(err);
        }
    });
    
  }

}
