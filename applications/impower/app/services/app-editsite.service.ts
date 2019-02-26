import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable()
export class AppEditSiteService {
  data: any;
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

}