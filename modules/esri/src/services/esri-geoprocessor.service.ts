import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EsriApi } from '../core/esri-api.service';

@Injectable()
export class EsriGeoprocessorService {

  constructor() { }

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
}
