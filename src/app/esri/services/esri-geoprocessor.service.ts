import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EsriApi } from '../core/esri-api.service';

@Injectable({
  providedIn: 'root'
})
export class EsriGeoprocessorService {

  constructor() { }

  public processJob<T>(serviceUrl: string, servicePayload: any) : Observable<{ value: T }> {
    const processor = new EsriApi.Geoprocessor({ url: serviceUrl });
    return Observable.create(observer => {
      processor.submitJob(servicePayload).then(
        jobResult => {
          processor.getResultData(jobResult.jobId, 'out_features').then(
            result => {
              observer.next(result);
              observer.complete();
            },
            err => {
              observer.error(err);
            });
          },
        err => {
          observer.error(err);
        });
    });
  }
}
