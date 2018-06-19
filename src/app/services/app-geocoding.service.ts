import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { ValGeocodingResponse } from '../models/val-geocoding-response.model';
import { ValGeocodingRequest } from '../models/val-geocoding-request.model';
import { map, pairwise, filter, tap, distinctUntilChanged } from 'rxjs/operators';
import { merge, of } from 'rxjs';
import { AppMessagingService } from './app-messaging.service';
import { AppGeoService } from './app-geo.service';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { chunkArray } from '../app.utils';
import { AppConfig } from '../app.config';

@Injectable()
export class AppGeocodingService {

  public failures: BehaviorSubject<ValGeocodingResponse[]> = new BehaviorSubject<ValGeocodingResponse[]>([]);

  public geocodingFailures$: Observable<ValGeocodingResponse[]> = this.failures.asObservable();
  public failureCount$: Observable<number> = this.geocodingFailures$.pipe(map(failures => failures.length));
  public hasFailures$: Observable<boolean> = this.failureCount$.pipe(map(c => c > 0));

  constructor(private messageService: AppMessagingService,
              private restService: RestDataService,
              private valGeoService: AppGeoService,
              private locationService: ImpGeofootprintLocationService,
              private config: AppConfig) {
    this.failureCount$.pipe(
      pairwise(),
      filter(([prevCount, currentCount]) => prevCount < currentCount),
      map(([prevCount, currentCount]) => currentCount > 0),
      distinctUntilChanged()
    ).subscribe(() => this.messageService.showGrowlError('Error', 'Geocoding Error'));
  }

  public removeFailedGeocode(data: ValGeocodingResponse) : void {
    const failures = this.failures.getValue();
    const removedIndex = failures.indexOf(data);
    if (removedIndex >= 0) {
      failures.splice(removedIndex, 1);
      this.failures.next(failures);
    }
  }

  public geocodeLocations(sites: ValGeocodingRequest[]) : Observable<ValGeocodingResponse[]> {
    let result$: Observable<ValGeocodingResponse[]>;
    const preGeoCodedSites: ValGeocodingResponse[] = sites.filter(s => s.hasLatAndLong()).map(s => s.toGeocodingResponse());
    if (sites.length > preGeoCodedSites.length) {
      const observables: Observable<ValGeocodingResponse[]>[] = [];
      const cleanRequestData = sites.filter(s => !s.hasLatAndLong()).map(s => s.cleanUploadRequest());
      const requestData = chunkArray(cleanRequestData, this.config.maxValGeocodingReqSize);
      const fail: ValGeocodingResponse[] = [];
      requestData.forEach(reqList => {
        const obs = this.restService.post('v1/geocoder/multiplesites', reqList).pipe(
          map(data => {
            const success: ValGeocodingResponse[] = [];
            data.payload.forEach(d => {
              if (d['Match Quality'] === 'E' || (d['Match Code'].startsWith('E') && !d['Match Quality'].startsWith('Z'))) {
                d['Geocode Status'] = 'ERROR';
                fail.push(new ValGeocodingResponse(d));
              } else if ((d['Match Quality'].startsWith('Z') && !d['Match Quality'].startsWith('ZT9')) || d['Match Code'] === 'Z') {
                d['Geocode Status'] = 'CENTROID';
                fail.push(new ValGeocodingResponse(d));
              } else {
                d['Geocode Status'] = 'SUCCESS';
                success.push(new ValGeocodingResponse(d));
              }
            });
            Array.prototype.push.apply(success, preGeoCodedSites);
            return success;
          })
        );
        observables.push(obs);
      });

      result$ = merge(...observables, 4).pipe(
        tap(null, null, () => {
          const projectFailures = this.failures.getValue();
          this.failures.next([...fail, ...projectFailures]);
          this.showCompletedMessage();
        }),
      );
    }
    if (result$ != null) {
      return result$;
    } else {
      return of(preGeoCodedSites);
    }
  }

  private showCompletedMessage() : void {
    if (this.failures.getValue().length === 0) {
      this.messageService.showGrowlSuccess('Success', 'Geocoding Success');
    }
  }
}
