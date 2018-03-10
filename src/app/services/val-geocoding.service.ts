import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { MessageService } from 'primeng/components/common/messageservice';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { Observable } from 'rxjs/Observable';
import { ValGeocodingResponse } from '../models/val-geocoding-response.model';
import { ValGeocodingRequest } from '../models/val-geocoding-request.model';
import { map } from 'rxjs/operators';

@Injectable()
export class ValGeocodingService {

  private failures: BehaviorSubject<ValGeocodingResponse[]> = new BehaviorSubject<ValGeocodingResponse[]>([]);

  public geocodingFailures$: Observable<ValGeocodingResponse[]> = this.failures.asObservable();
  public failureCount$: Observable<number> = this.geocodingFailures$.pipe(map(failures => failures.length));
  public hasFailures$: Observable<boolean> = this.failureCount$.pipe(map(c => c > 0));

  constructor(private messageService: MessageService, private restService: RestDataService) { }

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
    const preGeoCodedSites: ValGeocodingResponse[] = sites.filter(s => s.hasLatAndLong()).map(s => s.toGeocodingResponse());
    if (sites.length > preGeoCodedSites.length) {
      const cleanRequestData = sites.filter(s => s.hasLatAndLong() === false).map(s => s.cleanUploadRequest());
      geocoderPromise = this.restService.post('v1/geocoder/multiplesites', cleanRequestData).toPromise()
        .catch(err => {
          console.error(err);
          return Promise.reject([]);
        })
        .then(data => {
          const fail: ValGeocodingResponse[] = [];
          const success: ValGeocodingResponse[] = [];
          data.payload.forEach(d => {
            if (d['Match Quality'] === 'E' || d['Match Code'].startsWith('E')) {
              d['Geocode Status'] = 'ERROR';
              fail.push(new ValGeocodingResponse(d));
            } else {
              d['Geocode Status'] = 'SUCCESS';
              success.push(new ValGeocodingResponse(d));
            }
          });
          const projectFailures =  this.failures.getValue();
          this.failures.next([...fail, ...projectFailures]);
          this.showCompletedMessage();
          return preGeoCodedSites.concat(success);
        });
    }
    if (geocoderPromise) {
      return geocoderPromise;
    } else {
      return Promise.resolve(preGeoCodedSites);
    }
  }

  private showCompletedMessage() : void {
    if (this.failures.getValue().length === 0) {
      this.messageService.add({ severity: 'success', summary: 'Success', detail: `Geocoding Success` });
    } else {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: `Geocoding Error` });
    }
  }
}
