import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EsriModules } from '../core/esri-modules.service';
import { LoggingService } from '../../val-modules/common/services/logging.service';

@Injectable({
  providedIn: 'root'
})
export class EsriGeoprocessorService {

  constructor(private logger: LoggingService) { }

  public processJob<T>(serviceUrl: string, servicePayload: any) : Observable<{ value: T }> {
    const processor = new EsriModules.Geoprocessor({ url: serviceUrl });
    return Observable.create(observer => {
      this.logger.debug('Submitting Job with ', servicePayload);
      processor.submitJob(servicePayload).then(
        jobResult => {
          this.logger.debug('Submit Job promise resolved with ', jobResult);
          processor.getResultData(jobResult.jobId, 'out_features').then(
            result => {
              this.logger.debug('Get Job Data promise resolved with ', result);
              observer.next(result);
              observer.complete();
            },
            err => {
              this.logger.error('Get Job Data promise rejected with ', err);
              observer.error(err);
            });
          },
        err => {
          this.logger.error('Submit Job promise rejected with ', err);
          observer.error(err);
        });
    });
  }
}
