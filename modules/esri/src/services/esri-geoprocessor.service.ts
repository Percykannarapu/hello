import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EsriApi } from '../core';

@Injectable()
export class EsriGeoprocessorService {

  constructor() { }

  public processJob<T>(serviceUrl: string, servicePayload: any) : Observable<{ value: T }> {
    const processor = new EsriApi.Geoprocessor({ url: serviceUrl });
    return Observable.create(async observer => {
      try {
        const jobResult = await processor.submitJob(servicePayload);
        const dataResult = await processor.getResultData(jobResult.jobId, 'out_features');
        observer.next(dataResult);
        observer.complete();
      } catch (err) {
        observer.error(err);
      }
    });
  }
}
