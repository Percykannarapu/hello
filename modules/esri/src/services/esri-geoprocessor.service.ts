import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { ObservableGeoprocessor, ObservablePrintTask } from '../models/observable-processors';

@Injectable()
export class EsriGeoprocessorService {

  constructor() { }

  public processJob<T>(serviceUrl: string, servicePayload: any, resultType: string = 'out_features') : Observable<{ value: T }> {
    const processor = new ObservableGeoprocessor({ url: serviceUrl });
    return processor.submitJob(servicePayload).pipe(
      switchMap(result => processor.getResultData(result.jobId, resultType)),
    );
  }

  public processPrintJob(printServiceUrl: string, servicePayload: __esri.PrintParameters) : Observable<string> {
    const processor: ObservablePrintTask = new ObservablePrintTask({url: printServiceUrl});
    const proxy = (result) => {
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
    };

    processor.attachProxyToPromise('_getPrintDefinition', proxy);

    return processor.execute(servicePayload).pipe(
      filter(result => result != null && result.url != null),
      map(result => result.url)
    );
  }
}
