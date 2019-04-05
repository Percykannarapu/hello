import { Component, OnDestroy, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { isNumber } from '@val/common';
import { filter, takeUntil } from 'rxjs/operators';
import { RfpUiEditDetail } from '../../../val-modules/mediaexpress/models/RfpUiEditDetail';
import { localSelectors } from '../../state/app.selectors';
import { FullState } from '../../state';
import { Observable, Subject } from 'rxjs';

@Component({
  selector: 'cpq-header-bar',
  templateUrl: './header-bar.component.html',
  styleUrls: ['./header-bar.component.css']
})
export class HeaderBarComponent implements OnInit, OnDestroy {

  private componentDestroyed$ = new Subject();

  appReady$: Observable<boolean>;

  totalDistribution: number;
  totalInvestment: number;
  mediaPlanId: number;
  mediaPlanGroupNumber: number;
  rfpNumber: string;
  rfpName: string;
  productName: string;
  rfpId: string;

  get reviewPageUrl() { return `/apex/RFP_Media_Plan_Display?rfpId=${this.rfpId}&displayAll=true&groupId=${this.mediaPlanGroupNumber}`; }

  constructor(private store$: Store<FullState>) { }

  ngOnInit() {
    this.store$.pipe(
      select(localSelectors.getRfpUiEditDetailEntities),
      takeUntil(this.componentDestroyed$)
    ).subscribe(state => {
      this.calcMetrics(state);
    });

    this.store$.pipe(
      select(localSelectors.getHeaderInfo),
      filter(header => header != null),
      takeUntil(this.componentDestroyed$)
    ).subscribe(headers => {
      this.mediaPlanId = headers.mediaPlanId;
      this.rfpNumber = headers.rfpNumber;
      this.rfpName = headers.rfpName;
      this.productName = headers.productName;
      this.mediaPlanGroupNumber = headers.mediaPlanGroup;
      this.rfpId = headers.rfpId;
    });

    this.appReady$ = this.store$.pipe(
      select(localSelectors.getAppReady)
    );
  }

  ngOnDestroy() : void {
    this.componentDestroyed$.next();
  }

  onCancel() : void {
    window.location.href = this.reviewPageUrl;
  }

  private calcMetrics(entities: RfpUiEditDetail[]) {
    this.totalInvestment = 0;
    this.totalDistribution = 0;
    for (const entity of entities) {
      if (entity.isSelected && isNumber(entity.distribution) && isNumber(entity.investment)) {
        this.totalDistribution += entity.distribution;
        this.totalInvestment += entity.investment;
      }
    }
  }
}
