import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { pad } from '@val/common';
import { Observable, of } from 'rxjs';
import { filter, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { RestDataService } from '../../val-modules/common/services/restdata.service';
import { AvailabilityDetailResponse } from '../models/availability-detail-response';
import { FullState } from '../state';
import { localSelectors } from '../state/app.selectors';

export enum GeoStatus {
  PastIhd,
  Selected,
  Unselected,
  Added,
  AvailabilityCheckRequired
}

@Injectable({
  providedIn: 'root'
})
export class AppAvailabilityService {

  constructor(private store$: Store<FullState>,
              private restService: RestDataService) { }

  getStatus(geocode: string) : Observable<GeoStatus> {
    return this.store$.pipe(
      select(localSelectors.getRfpUiEditDetailEntities),
      filter(mbus => mbus != null && mbus.length > 0),
      map(mbus => mbus.filter(m => m.geocode === geocode)),
      withLatestFrom(this.store$.pipe(select(localSelectors.getSharedState)), this.store$.pipe(select(localSelectors.getAvailabilityParams))),
      map(([foundGeos, shared, avails]) => {
        const newIdSet = new Set(shared.newLineItemIds);
        if (new Date(Date.now()) > avails.toDate) return GeoStatus.PastIhd;
        if (foundGeos.length === 0) return GeoStatus.AvailabilityCheckRequired;
        if (foundGeos.every(m => newIdSet.has(m['@ref']))) return GeoStatus.Added;
        if (foundGeos.every(m => m.isSelected)) return GeoStatus.Selected;
        return GeoStatus.Unselected;
      })
    );
  }

  isAvailable(geocode: string, wrapZoneName: string) : Observable<AvailabilityDetailResponse[]> {
    return this.store$.pipe(
      select(localSelectors.getAvailabilityParams),
      switchMap(params => this.requestAvailability(params.productCode, params.fromDate, params.toDate, geocode, wrapZoneName).pipe(
        map(response => response.payload.rows as AvailabilityDetailResponse[])
      ))
    );
  }

  private requestAvailability(productCode: string, fromDate: Date, toDate: Date, geocode: string, wrapZoneName: string) {
    const fromDateString = `${fromDate.getFullYear()}-${pad(fromDate.getMonth(), 2)}-${pad(fromDate.getDate(), 2)}`;
    const toDateString = `${toDate.getFullYear()}-${pad(toDate.getMonth(), 2)}-${pad(toDate.getDate(), 2)}`;
    const url = `v1/availability/base/productgeoschedule/${productCode}/${fromDateString}/${toDateString}/search`;
    let params = new HttpParams().append('q', 'availabilityDetail');
    if (productCode === 'WRAP') {
      params = params.append('wrapName', wrapZoneName);
    } else {
      params = params.append('geocode', geocode);
    }
    return this.restService.get(url, { params });
  }
}
