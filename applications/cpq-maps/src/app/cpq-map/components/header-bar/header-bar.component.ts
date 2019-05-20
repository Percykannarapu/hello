import { Component, OnDestroy, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { isNumber } from '@val/common';
import { filter, takeUntil } from 'rxjs/operators';
import { RfpUiEditDetail } from '../../../val-modules/mediaexpress/models/RfpUiEditDetail';
import { localSelectors } from '../../state/app.selectors';
import { FullState } from '../../state';
import { Observable, Subject } from 'rxjs';
import { NavigateToReviewPage, SaveMediaPlan, ExportMaps } from '../../state/shared/shared.actions';

@Component({
  selector: 'cpq-header-bar',
  templateUrl: './header-bar.component.html',
  styleUrls: ['./header-bar.component.css']
})
export class HeaderBarComponent implements OnInit, OnDestroy {

  private updateIds: number[] = [];
  private addIds: number[] = [];
  private componentDestroyed$ = new Subject();

  appReady$: Observable<boolean>;
  isSaving$: Observable<boolean>;

  totalDistribution: number;
  totalInvestment: number;
  mediaPlanId: number;
  mediaPlanGroupNumber: number;
  rfpNumber: string;
  rfpName: string;
  productName: string;
  rfpId: string;
  get hasAdditions() { return this.addIds.length > 0; }

  get isClean() {
    return this.updateIds.length === 0 && this.addIds.length === 0;
  }

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
      this.addIds = headers.addIds;
      this.updateIds = headers.updateIds;
    });

    this.appReady$ = this.store$.pipe(
      select(localSelectors.getAppReady)
    );
    this.isSaving$ = this.store$.pipe(
      select(localSelectors.getIsSaving)
    );
  }

  ngOnDestroy() : void {
    this.componentDestroyed$.next();
  }

  onCancel() : void {
    this.store$.dispatch(new NavigateToReviewPage({ rfpId: this.rfpId, mediaPlanGroupNumber: this.mediaPlanGroupNumber }));
  }

  onSave() {
    this.store$.dispatch(new SaveMediaPlan({ addIds: this.addIds, updateIds: this.updateIds }));
  }

  exportMaps(){
    this.store$.dispatch(new ExportMaps());
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
