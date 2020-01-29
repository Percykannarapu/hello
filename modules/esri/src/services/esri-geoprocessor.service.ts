import { Injectable } from '@angular/core';
import Geoprocessor from 'esri/tasks/Geoprocessor';
import PrintTask from 'esri/tasks/PrintTask';
import { Observable } from 'rxjs';

@Injectable()
export class EsriGeoprocessorService {

  constructor() { }

  public processJob<T>(serviceUrl: string, servicePayload: any, resultType: string = 'out_features') : Observable<{ value: T }> {
    const processor = new Geoprocessor({ url: serviceUrl });
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
    const processor: any = new PrintTask({url: printServiceUrl});
    const proxy_getPrintDefinition = processor._getPrintDefinition;

    processor._getPrintDefinition = function() {
       return proxy_getPrintDefinition.apply(processor, arguments).then((result) => {
         result.operationalLayers.forEach(l => {
          if ((l.title === 'Selected ATZs' || l.title === 'Selected ZIPs' || l.title === 'Selected PCRs' || l.title === 'Selected Digital ATZs') 
                                && l.layerDefinition.drawingInfo.renderer.symbol.style === 'esriSFSBackwardDiagonal'){
              l.opacity = 0.75;
           }
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
