import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { isConvertibleToNumber } from '@val/common';
import { Observable, Subject } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';
import { RfpUiEditDetail } from '../../../val-modules/mediaexpress/models/RfpUiEditDetail';
import { FullState } from '../../state/index';
import { localSelectors } from '../../state/app.selectors';
import { GeneratePdf, NavigateToReviewPage, SaveMediaPlan } from '../../state/shared/shared.actions';

@Component({
  selector: 'cpq-header-bar',
  templateUrl: './header-bar.component.html',
  styleUrls: ['./header-bar.component.scss']
})
export class HeaderBarComponent implements OnInit, OnDestroy {

  private componentDestroyed$ = new Subject();

  appReady$: Observable<boolean>;
  isSaving$: Observable<boolean>;
  addCount$: Observable<number>;
  updateCount$: Observable<number>;
  prefsChanged$: Observable<boolean>;

  generateDisabled$: Observable<boolean>;

  totalDistribution: number;
  totalInvestment: number;
  mediaPlanId: number;
  mediaPlanGroupNumber: number;
  rfpNumber: string;
  rfpName: string;
  productName: string;
  rfpId: string;

  constructor(private store$: Store<FullState>) { }

  ngOnInit() {
    this.appReady$ = this.store$.select(localSelectors.getAppReady);
    this.isSaving$ = this.store$.select(localSelectors.getIsSaving);
    this.addCount$ = this.store$.select(localSelectors.getAddIds).pipe(map(ids => ids.length));
    this.updateCount$ = this.store$.select(localSelectors.getUpdateIds).pipe(map(ids => ids.length));
    this.prefsChanged$ = this.store$.select(localSelectors.getPrefsChanged);

    this.generateDisabled$ = this.store$.select(localSelectors.getFilteredGeos);

    this.store$.select(localSelectors.getRfpUiEditDetailEntities).pipe(
      takeUntil(this.componentDestroyed$)
    ).subscribe(state => {
      this.calcMetrics(state);
    });

    this.store$.select(localSelectors.getHeaderInfo).pipe(
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
  }

  ngOnDestroy() : void {
    this.componentDestroyed$.next();
  }

  onCancel() : void {
    this.store$.dispatch(new NavigateToReviewPage({ rfpId: this.rfpId, mediaPlanGroupNumber: this.mediaPlanGroupNumber }));
  }

  onSave() {
    this.store$.dispatch(new SaveMediaPlan());
  }

  exportMaps() {
    this.store$.dispatch(new GeneratePdf());
  }

  private calcMetrics(entities: RfpUiEditDetail[]) {
    this.totalInvestment = 0;
    this.totalDistribution = 0;
    for (const entity of entities) {
      if (entity.isSelected && isConvertibleToNumber(entity.distribution) && isConvertibleToNumber(entity.investment)) {
        this.totalDistribution += entity.distribution;
        this.totalInvestment += entity.investment;
      }
    }
  }
}
