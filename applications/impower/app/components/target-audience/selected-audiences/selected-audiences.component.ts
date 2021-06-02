import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Store } from '@ngrx/store';
import { CommonSort } from '@val/common';
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
import { ConfirmationService } from 'primeng/api';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { debounceTime, filter, takeUntil, tap } from 'rxjs/operators';
import { FetchGeoVars } from '../../../impower-datastore/state/transient/geo-vars/geo-vars.actions';
import { geoTransactionId } from '../../../impower-datastore/state/transient/transactions/transactions.reducer';
import { AppStateService } from '../../../services/app-state.service';
import { LocalAppState } from '../../../state/app.interfaces';
import { CreateAudienceUsageMetric } from '../../../state/usage/targeting-usage.actions';

@Component({
  selector: 'val-selected-audiences',
  templateUrl: './selected-audiences.component.html',
  styleUrls: ['./selected-audiences.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SelectedAudiencesComponent implements OnInit, OnDestroy {

  audiences$ = new BehaviorSubject<Audience[]>([]);
  gridAudiences$ = new BehaviorSubject<Audience[]>([]);
  audienceCount: number = 0;
  gridAll: boolean = false;
  gfpAll: boolean = true;

  public showDialog: boolean = false;
  public dialogMessage: string = '';
  public dialogHeader: string = '';

  private nationalAudiences$ = new BehaviorSubject<Audience[]>([]);
  private createdAudiences$ = new BehaviorSubject<Audience[]>([]);
  private geoTxId$ = new BehaviorSubject<number | null>(null);

  private destroyed$ = new Subject<void>();

  constructor(private appStateService: AppStateService,
              private confirmationService: ConfirmationService,
              private logger: AppLoggingService,
              private store$: Store<LocalAppState>) {
  }

  ngOnInit() {
    this.store$.select(fromAudienceSelectors.allAudiences).pipe(
      filter(audiences => audiences != null),
      tap(audiences => this.audienceCount = audiences.length),
      // tap(audiences => audiences.sort((a, b) => CommonSort.GenericNumber(a.sortOrder, b.sortOrder))),
      takeUntil(this.destroyed$)
    ).subscribe(this.audiences$);
    this.store$.select(fromAudienceSelectors.getAudiencesInExtract).pipe(takeUntil(this.destroyed$)).subscribe(this.nationalAudiences$);
    this.store$.select(fromAudienceSelectors.getCreatedAudiences).pipe(takeUntil(this.destroyed$)).subscribe(this.createdAudiences$);
    this.store$.select(fromAudienceSelectors.getAudiencesInGrid).pipe(takeUntil(this.destroyed$)).subscribe(this.gridAudiences$);
    this.store$.select(geoTransactionId).pipe(takeUntil(this.destroyed$)).subscribe(this.geoTxId$);

    this.appStateService.analysisLevel$.subscribe(() => {
      const audiences = this.audiences$.getValue().map(a => ({ id: a.audienceIdentifier, changes: { exportNationally: false } }));
      this.store$.dispatch(new UpdateAudiences({ audiences }));
    });
  }

  ngOnDestroy() {
    this.destroyed$.next();
  }

  public onApplyClicked() {
    this.store$.dispatch(new FetchGeoVars({ audiences: this.gridAudiences$.getValue(), txId: this.geoTxId$.getValue() }));
  }

  public closeDialog() {
    this.showDialog = false;
  }

  onRemove(audience: Audience) {
    let isDependent: boolean = false;
    isDependent = this.createdAudiences$.getValue().filter(combineAud => combineAud.combinedAudiences.includes(audience.audienceIdentifier)).length > 0;
    this.createdAudiences$.getValue().forEach((aud: Audience) => aud.compositeSource.forEach(a => {
      if (a.id.toString() === audience.audienceIdentifier)
        isDependent = true;
    }));
    if (isDependent) {
      this.dialogHeader = 'Invalid Delete!';
      this.dialogMessage = 'Audiences used to create a Combined or Converted or Composite Audience can not be deleted.';
      this.showDialog = true;
    } else {
      const message = 'Do you want to delete the following audience from your project? <br/> <br/>' +
        `${audience.audienceName}  (${audience.audienceSourceType}: ${audience.audienceSourceName})`;
      this.confirmationService.confirm({
        message: message,
        header: 'Delete Confirmation',
        icon: 'pi pi-trash',
        accept: () => {
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
        },
        reject: () => {
        }
      });
    }
  }

  onMoveUp(audience: Audience) {
    this.store$.dispatch(new MoveAudienceUp({audienceIdentifier: audience.audienceIdentifier}));
  }

  onMoveDn(audience: Audience) {
    this.store$.dispatch(new MoveAudienceDn({audienceIdentifier: audience.audienceIdentifier}));
  }

  onNationalSelected(audience: Audience, newValue: boolean) {
    if (newValue) {
      if (this.appStateService.analysisLevel$.getValue() === 'PCR' && this.nationalAudiences$.value.length > 1) {
        this.dialogHeader = 'Selected Audiences Error';
        this.dialogMessage = 'Only 1 variable can be selected at one time for PCR level National exports.';
        this.showDialog = true;
        return;
      }
      if (this.nationalAudiences$.value.length > 5) {
        this.dialogHeader = 'Selected Audiences Error';
        this.dialogMessage = 'Only 5 variables can be selected at one time for the National export.';
        this.showDialog = true;
        return;
      }
    }
    this.store$.dispatch(new UpdateAudience({ audience: { id: audience.audienceIdentifier, changes: { exportNationally: newValue } }}));
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
}
