import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { MessageService } from 'primeng/components/common/messageservice';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import 'rxjs/add/operator/toPromise';
import { Observable } from 'rxjs/Observable';
import { ValGeocodingResponse } from '../models/val-geocoding-response.model';
import { ValGeocodingRequest } from '../models/val-geocoding-request.model';

@Injectable()
export class ValGeocodingService {

  private failures: BehaviorSubject<ValGeocodingResponse[]> = new BehaviorSubject<ValGeocodingResponse[]>([]);

  public geocodingFailures$: Observable<ValGeocodingResponse[]> = this.failures.asObservable();
  public failureCount$: Observable<number> = this.geocodingFailures$.map(failures => failures.length);
  public hasFailures$: Observable<boolean> = this.failureCount$.map(c => c > 0);

  constructor(private messageService: MessageService, private restService: RestDataService) { }

  public removeFailedGeocode(data: ValGeocodingResponse) : void {
    const failures = this.failures.getValue();
    const removedIndex = failures.indexOf(data);
    if (removedIndex >= 0) {
      failures.splice(removedIndex, 1);
      this.failures.next(failures);
    }
  }

  public resubmitFailedGeocode(data: ValGeocodingResponse) : Promise<ValGeocodingResponse> {
    const retry = data.toGeocodingRequest();
    const failures = this.failures.getValue();
    const removedIndex = failures.indexOf(data);
    if (removedIndex >= 0) {
      failures.splice(removedIndex, 1);
    }
    return this.geocodeLocations([retry]).then(res => res[0]);
  }

  public geocodeLocations(sites: ValGeocodingRequest[]) : Promise<ValGeocodingResponse[]> {
    let geoCoderPromise: Promise<ValGeocodingResponse[]>;
    if (sites.length > 0) {
      geoCoderPromise = this.restService.post('v1/geocoder/multiplesites', sites).toPromise()
        .catch(err => {
          console.error(err);
          return Promise.reject([]);
        })
        .then(data => {
          const splitData: { success: ValGeocodingResponse[], failure: ValGeocodingResponse[] } = data.payload.reduce((p, c: ValGeocodingResponse) => {
            if (c['Match Quality'] === 'E' || c['Match Code'].startsWith('E')) {
              c['Geocode Status'] = 'ERROR';
              p.failure.push(new ValGeocodingResponse(c));
            } else {
              p.success.push(new ValGeocodingResponse(c));
            }
            return p;
          }, {success: [], failure: []});
          this.failures.next([...splitData.failure]);
          this.showCompletedMessage();
          return splitData.success;
        });
    }
    if (geoCoderPromise) {
      return geoCoderPromise;
    } else {
      return Promise.resolve([]);
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
