import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { toNullOrNumber } from '@val/common';
import { MessageBoxService } from '@val/messaging';
import {
  DeleteAudience,
  MoveAudienceDn,
  MoveAudienceUp,
  UpdateAudience,
  UpdateAudiences
} from 'app/impower-datastore/state/transient/audience/audience.actions';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { AppLoggingService } from 'app/services/app-logging.service';
import { PrimeIcons } from 'primeng/api';
import { BehaviorSubject, Subject } from 'rxjs';
import { filter, takeUntil, tap } from 'rxjs/operators';
import { FetchGeoVars } from '../../../impower-datastore/state/transient/geo-vars/geo-vars.actions';
import { geoTransactionId } from '../../../impower-datastore/state/transient/transactions/transactions.reducer';
import { AppStateService } from '../../../services/app-state.service';
import { LocalAppState } from '../../../state/app.interfaces';
import { CreateAudienceUsageMetric } from '../../../state/usage/targeting-usage.actions';

@Component({
  selector: 'val-selected-audiences',
  templateUrl: './selected-audiences.component.html',
  styleUrls: ['./selected-audiences.component.scss']
})
export class SelectedAudiencesComponent implements OnInit, OnDestroy {

  reservedAudiences = new Set<number>();
  audiences$ = new BehaviorSubject<Audience[]>([]);
  gridAudiences$ = new BehaviorSubject<Audience[]>([]);
  audienceCount: number = 0;
  gridAll: boolean = false;
  gfpAll: boolean = true;

  isNationalRestricted = false;
  restrictionMessage = '';

  private nationalAudiences$ = new BehaviorSubject<Audience[]>([]);
  private createdAudiences$ = new BehaviorSubject<Audience[]>([]);
  private geoTxId$ = new BehaviorSubject<number | null>(null);

  private destroyed$ = new Subject<void>();

  constructor(private appStateService: AppStateService,
              private logger: AppLoggingService,
              private messageService: MessageBoxService,
              private store$: Store<LocalAppState>) {
  }

  ngOnInit() {
    this.store$.select(fromAudienceSelectors.allAudiences).pipe(
      tap(audiences => this.audienceCount = audiences?.length ?? 0),
      filter(audiences => audiences != null),
      takeUntil(this.destroyed$)
    ).subscribe(this.audiences$);
    this.store$.select(fromAudienceSelectors.getAudiencesInExtract).pipe(takeUntil(this.destroyed$)).subscribe(this.nationalAudiences$);
    this.store$.select(fromAudienceSelectors.getCreatedAudiences).pipe(takeUntil(this.destroyed$)).subscribe(this.createdAudiences$);
    this.store$.select(fromAudienceSelectors.getAudiencesInGrid).pipe(takeUntil(this.destroyed$)).subscribe(this.gridAudiences$);
    this.store$.select(geoTransactionId).pipe(takeUntil(this.destroyed$)).subscribe(this.geoTxId$);

    this.store$.select(fromAudienceSelectors.getAudiencesInExtract).pipe(
      takeUntil(this.destroyed$)
    ).subscribe(nationalAudiences => {
      const restrictionCount = this.appStateService.analysisLevel$.getValue() === 'PCR' ? 1 : 5;
      this.isNationalRestricted = nationalAudiences.length >= restrictionCount;
      this.restrictionMessage = `${this.appStateService.analysisLevel$.getValue()} National Extracts are limited to ${restrictionCount} audience${restrictionCount > 1 ? 's' : ''}.`;
    });

    this.appStateService.analysisLevel$.subscribe(() => {
      const audiences = this.audiences$.getValue().map(a => ({ id: a.audienceIdentifier, changes: { exportNationally: false } }));
      this.store$.dispatch(new UpdateAudiences({ audiences }));
    });

    this.store$.select(fromAudienceSelectors.getReservedIds).pipe(
      takeUntil(this.destroyed$)
    ).subscribe(reservedAudiences => {
      this.logger.debug.log(`Reserved audience count = ${reservedAudiences.size}`, reservedAudiences);
      this.reservedAudiences = reservedAudiences;
    });
  }

  ngOnDestroy() {
    this.destroyed$.next();
  }

  public onApplyClicked() {
    const audiences = this.gridAudiences$.getValue().filter(a => a.audienceSourceType !== 'Custom');
    this.store$.dispatch(new FetchGeoVars({ audiences, txId: this.geoTxId$.getValue() }));
  }

  onRemove(audience: Audience) {
    const message = 'Are you sure you want to remove ' +
      `${audience.audienceName} (${audience.audienceSourceType}: ${audience.audienceSourceName})` +
      ' from your project?';
    this.messageService.showDeleteConfirmModal(message).subscribe(result => {
      if (result) this.deleteAudience(audience);
    });
  }

  private deleteAudience(audience: Audience) {
    let metricText;
    switch (audience.audienceSourceType) {
      case 'Custom':
        metricText = `CUSTOM~${audience.audienceName}~${audience.audienceSourceName}~${this.appStateService.analysisLevel$.getValue()}`;
        break;
      case 'Offline':
        metricText = `${audience.audienceIdentifier}~${audience.audienceName}~${audience.audienceSourceName}~Offline~${this.appStateService.analysisLevel$.getValue()}`;
        break;
      default:
        metricText = `${audience.audienceIdentifier}~${audience.audienceName}~${audience.audienceSourceName}~${this.appStateService.analysisLevel$.getValue()}`;
        break;
    }
    this.store$.dispatch(new CreateAudienceUsageMetric('audience', 'delete', metricText));
    this.store$.dispatch(new DeleteAudience({ id: audience.audienceIdentifier }));
  }

  onMoveUp(audience: Audience) {
    this.store$.dispatch(new MoveAudienceUp({audienceIdentifier: audience.audienceIdentifier}));
  }

  onMoveDn(audience: Audience) {
    this.store$.dispatch(new MoveAudienceDn({audienceIdentifier: audience.audienceIdentifier}));
  }

  onNationalSelected(audience: Audience, newValue: boolean) {
    if (this.isNationalRestricted) {
      this.store$.dispatch(new UpdateAudience({ audience: { id: audience.audienceIdentifier, changes: { exportNationally: false } }}));
    } else {
      this.store$.dispatch(new UpdateAudience({ audience: { id: audience.audienceIdentifier, changes: { exportNationally: newValue } }}));
    }
  }

  onShowGridSelected(audience: Audience, newValue: boolean) {
    this.store$.dispatch(new UpdateAudience({ audience: { id: audience.audienceIdentifier, changes: { showOnGrid: newValue } }}));
  }

  onExportInGeoFootprintSelected(audience: Audience, newValue: boolean) {
    this.store$.dispatch(new UpdateAudience({ audience: { id: audience.audienceIdentifier, changes: { exportInGeoFootprint: newValue } }}));
  }

  onIndexBaseChange(audience: Audience, newValue: string) {
    this.store$.dispatch(new UpdateAudience({ audience: { id: audience.audienceIdentifier, changes: { selectedDataSet: newValue } }}));
  }

  public formatString(audienceSourceType: string) : string {
    const charsToReplace = {'+': '+<wbr>', '_': '_<wbr>', '.': '.<wbr>', '-': '-<wbr>'};
    let formattedString = audienceSourceType;
    formattedString = formattedString.replace(/[+_.-]/g, char => charsToReplace[char]);
    return formattedString;
  }

  public onSetGridForAll(gridAll: boolean) {
    const audiences = this.audiences$.getValue().map(a => ({ id: a.audienceIdentifier, changes: { showOnGrid: gridAll } }));
    this.store$.dispatch(new UpdateAudiences({ audiences }));
  }

  public onSetGfpForAll(gfpFilter: boolean) {
    const audiences = this.audiences$.getValue().map(a => ({ id: a.audienceIdentifier, changes: { exportInGeoFootprint: gfpFilter } }));
    this.store$.dispatch(new UpdateAudiences({ audiences }));
  }

  public isReserved(audience: Audience) : boolean {
    return this.reservedAudiences.has(toNullOrNumber(audience.audienceIdentifier));
  }
}
