import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { ValGeocodingResponse } from '../models/val-geocoding-response.model';
import { ValGeocodingRequest } from '../models/val-geocoding-request.model';
import { map, pairwise, filter } from 'rxjs/operators';
import { AppMessagingService } from './app-messaging.service';
import { ValGeoService } from './app-geo.service';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';

@Injectable()
export class ValGeocodingService {

  public failures: BehaviorSubject<ValGeocodingResponse[]> = new BehaviorSubject<ValGeocodingResponse[]>([]);

  public geocodingFailures$: Observable<ValGeocodingResponse[]> = this.failures.asObservable();
  public failureCount$: Observable<number> = this.geocodingFailures$.pipe(map(failures => failures.length));
  public hasFailures$: Observable<boolean> = this.failureCount$.pipe(map(c => c > 0));
  public successCount: number;
  public totalCount: number;
  public failureCount: number;

  public currentFilefailedcount = 0;

  constructor(private messageService: AppMessagingService,
              private restService: RestDataService,
              private valGeoService: ValGeoService,
              private locationService: ImpGeofootprintLocationService) {
    
              this.failureCount$.pipe(
                pairwise(),
                filter(([prevCount, currentCount]) => prevCount < currentCount),
                map(([prevCount, currentCount]) => currentCount > 0)
              ).subscribe(hasNewError => this.messageService.showGrowlError('Error', 'Geocoding Error'));
   }

  public removeFailedGeocode(data: ValGeocodingResponse) : void {
    const failures = this.failures.getValue();
    const removedIndex = failures.indexOf(data);
    if (removedIndex >= 0) {
      failures.splice(removedIndex, 1);
      this.failures.next(failures);
    }
  }

  public geocodeLocations(sites: ValGeocodingRequest[]) : Promise<ValGeocodingResponse[]> {
    let geocoderPromise: Promise<ValGeocodingResponse[]>;
    this.currentFilefailedcount = 0;
    const preGeoCodedSites: ValGeocodingResponse[] = sites.filter(s => s.hasLatAndLong()).map(s => s.toGeocodingResponse());
    if (sites.length > preGeoCodedSites.length) {
      const cleanRequestData = sites.filter(s => !s.hasLatAndLong()).map(s => s.cleanUploadRequest());
      const requestData = this.chunkArray(cleanRequestData, 50);
      const observables: Observable<ValGeocodingResponse[]>[] = [];
      const promises: Promise<ValGeocodingResponse[]>[] = [];
      requestData.forEach(reqList => {
        const obs = this.restService.post('v1/geocoder/multiplesites', reqList).pipe(
          map(data => {
            const fail: ValGeocodingResponse[] = [];
            const success: ValGeocodingResponse[] = [];
            data.payload.forEach(d => {
              if (d['Match Quality'] === 'E' || (d['Match Code'].startsWith('E') && !d['Match Quality'].startsWith('Z'))) {
                d['Geocode Status'] = 'ERROR';
                fail.push(new ValGeocodingResponse(d));
              } else if (d['Match Quality'] === '' || (d['Match Quality'].startsWith('Z') && !d['Match Quality'].startsWith('ZT9')) || d['Match Code'] === 'Z') {
                d['Geocode Status'] = 'CENTROID';
                fail.push(new ValGeocodingResponse(d));
              } else {
                d['Geocode Status'] = 'SUCCESS';
                success.push(new ValGeocodingResponse(d));
              }
            });
            const projectFailures = this.failures.getValue();
            this.failures.next([...fail, ...projectFailures]);
            this.currentFilefailedcount = this.currentFilefailedcount + fail.length;
            return success;
          })
        );
        observables.push(obs);
      });

      observables.forEach(o => promises.push(o.toPromise()));
      geocoderPromise = Promise.all(promises).then(data => {
        this.showCompletedMessage();
        return Array.prototype.concat(...data);
      });

      // mergeMap()
      //const obs =  merge(...observables).subscribe(, null, () => obs.unsubscribe());
    }
    if (geocoderPromise) {
      return geocoderPromise;
    } else {
      return Promise.resolve(preGeoCodedSites);
    }
  }

  private showCompletedMessage(): void {
    if (this.failures.getValue().length === 0) {
      this.messageService.showGrowlSuccess('Success', 'Geocoding Success');
    }
  }

  private chunkArray(data: ValGeocodingRequest[], size: number) {
    return Array.from({ length: Math.ceil(data.length / size) })
      .map((_, i) => Array.from({ length: size })
        .map((_, j) => data[i * size + j]));
  }
}
