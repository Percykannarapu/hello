import { Injectable } from '@angular/core';
import { isEmpty, isNil, toNullOrNumber } from '@val/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { AbstractControl, ValidatorFn } from '@angular/forms';

@Injectable({ providedIn: 'root' })
export class AppEditSiteService {
  data: any = null;
  private editLocationData: BehaviorSubject<any> = new BehaviorSubject<any>(this.data);
  public editLocationData$: Observable<any> = this.editLocationData.asObservable();

  private customData: BehaviorSubject<any> = new BehaviorSubject<any>(this.data);
  public customData$: Observable<any> = this.customData.asObservable();

  private customTradeAreaData: BehaviorSubject<any> = new BehaviorSubject<any>(this.data);
  public customTradeAreaData$: Observable<any> = this.customTradeAreaData.asObservable();

  constructor() { }

  sendEditLocationData(message: any) {
    this.editLocationData.next(message);
  }

  sendCustomData(message: any) {
     this.customData.next(message);
  }

  customTradeArea(message: any) {
    this.customTradeAreaData.next(message);
  }

  public latLonValidator() : ValidatorFn {
    return (c: AbstractControl) => {
      const enteredValue = c.value as string;
      if (isEmpty(enteredValue)) {
        return null;
      }
      const coords = enteredValue.split(',');
      if (coords.length === 2) {
        const lat = toNullOrNumber(coords[0]);
        const lon = toNullOrNumber(coords[1]);
        if (isNil(lat) || isNil(lon)) {
          return {
            latLon: 'Both Lat & Long values must be numeric'
          };
        } else if (lat < -90 || lat > 90) {
          return {
            latLon: 'Latitude is limited to +/- 90'
          };
        } else {
          return null;
        }
      } else if (coords.length != 2) {
        return {
          latLon: 'Should have 2 values(latitude & longitude)'
        };
      }
    };
  }

}
