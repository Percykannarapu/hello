import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AbstractControl, ValidatorFn } from '@angular/forms';

@Injectable()
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
      if (enteredValue == null || enteredValue.length === 0) {
        return null;
      }
      const coords = enteredValue.split(',');
      if (coords.length === 2) {
        const lat = coords[0] ? Number(coords[0]) : NaN;
        const lon = coords[1] ? Number(coords[1]) : NaN;
        if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
          if ( lat < -90 || lat > 90 ) {
            return {
              latLon: 'Latitude is limited to +/- 90'
            };
          }
        return null;
      }
        if (Number.isNaN(lat) || Number.isNaN(lon)) {
          return {
            latLon: 'Value must be numeric'
          };
        }
      } else if (coords.length != 2) {
        return {
          latLon: 'Should have 2 values(latitude & longitude)'
        };
      }
    };
  }

}
