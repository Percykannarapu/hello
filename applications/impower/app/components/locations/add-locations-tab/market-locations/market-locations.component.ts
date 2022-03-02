import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { CommonSort, formatMilli, isArray, isEmpty, isNil, KeyedSet } from '@val/common';
import { ErrorNotification } from '@val/messaging';
import { AppLoggingService } from 'app/services/app-logging.service';
import { AppStateService } from 'app/services/app-state.service';
import { MarketGeoService } from 'app/services/market-geo.service';
import { FullAppState } from 'app/state/app.interfaces';
import { SelectItem } from 'primeng/api';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, finalize, map, tap } from 'rxjs/operators';
import { ContainerValue } from 'worker-shared/data-model/other/market-geo.model';
import { GetGeosEvent, GetGridDataEvent, RowSelectionEvent } from './market-geos/market-geos.component';

function containerSort (a: ContainerValue, b: ContainerValue) : number {
  return CommonSort.NullableString(a?.name, b?.name)
    || CommonSort.NullableString(a?.code, b?.code)
    || CommonSort.NullableNumber(a?.id, b?.id);
}

function stateSort (a: SelectItem<string>, b: SelectItem<string>) : number {
  return CommonSort.GenericString(a.label, b.label);
}

@Component({
  selector: 'val-market-locations',
  templateUrl: './market-locations.component.html'
})
export class MarketLocationsComponent implements OnInit {

  public isFetchingData$ = new BehaviorSubject<boolean>(false);
  public isFetchingGeos$ = new BehaviorSubject<boolean>(false);
  public allStates$ = new BehaviorSubject<SelectItem<string>[]>([]);
  public containerValues$ = new BehaviorSubject<ContainerValue[]>([]);
  public gridUniqueStates$: Observable<SelectItem<string>[]>;
  public currentActiveRowCount$: Observable<number>;

  private stateCache = new Map<string, string>();

  constructor(private stateService: AppStateService,
              private marketService: MarketGeoService,
              private store$: Store<FullAppState>,
              private logger: AppLoggingService) { }

  ngOnInit() {
    this.stateService.clearUI$.subscribe(() => this.handleReset());

    this.gridUniqueStates$ = this.containerValues$.pipe(
      map(result => result.map(cv => ({ label: this.stateCache.get(cv.state), value: cv.state }))),
      map(selectItems => new KeyedSet<SelectItem<string>, string>(item => item.label, selectItems)),
      map(itemSet => Array.from(itemSet)),
      tap(items => items.sort(stateSort))
    );

    this.currentActiveRowCount$ = this.containerValues$.pipe(map(result => result?.filter(cv => cv.isActive).length ?? 0));

    this.populateAllStateValues();
  }

  private populateAllStateValues() {
    this.marketService.getContainerData('state').pipe(
      tap({
        next: value => {
          if ((value?.length ?? 0) === 0) this.reportError('Error Fetching States', 'No States Found To Populate Dropdown');
        },
        error: err => this.reportError('Error Fetching States', err?.message, err)
      }),
      filter(result => !isEmpty(result))
    ).subscribe(result => {
      const newValues: SelectItem<string>[] = [];
      result.forEach(cv => {
        newValues.push({ label: cv.name, value: cv.state });
        this.stateCache.set(cv.state, cv.name);
      });
      this.allStates$.next(newValues);
    });
  }

  public handleGetGridValues(event: GetGridDataEvent) {
    if (event?.clearGrid) {
      this.handleReset();
      return;
    }
    if (isNil(event?.market)) return;
    this.isFetchingData$.next(true);
    this.marketService.getContainerData(event.market, event.stateFilters?.join(',')).pipe(
      finalize(() => this.isFetchingData$.next(false)),
      tap({ error: err => {
          this.reportError('Error Fetching Market Data', err?.message, err);
          this.containerValues$.next([]);
        }})
    ).subscribe(values => this.containerValues$.next(values.sort(containerSort)));
  }

  public handleRowSelection(event: RowSelectionEvent) {
    const currentValues = this.containerValues$.getValue();
    if (isNil(event.row)) {
      // update all
      currentValues.forEach(cv => cv.isActive = event.newActiveFlag);
    } else {
      if (isArray<ContainerValue>(event.row)) {
        const ids = event.row.map(r => r.id ?? r.code);
        currentValues.filter(cv => ids.includes(cv.id ?? cv.code)).forEach(cv => cv.isActive = event.newActiveFlag);
      } else {
        const id = event.row.id ?? event.row.code;
        const valueToUpdate = currentValues.find(cv => id === (cv.id ?? cv.code));
        if (!isNil(valueToUpdate)) valueToUpdate.isActive = event.newActiveFlag;
      }
    }
    this.containerValues$.next(currentValues);
  }

  // Event that fires when geos are starting to be retrieved
  public handleGetGeos(event: GetGeosEvent) {
    this.isFetchingGeos$.next(true);
    this.marketService.createMarketLocations(event.container, event.containerName, event.markets, this.containerValues$.getValue().filter(cv => cv.isActive)).pipe(
      tap({
        error: err => this.reportError('Error Creating Market Locations', err.message, err)
      })
    ).subscribe(() => {
      this.isFetchingGeos$.next(false);
    });
  }

  public handleReset() {
    this.containerValues$.next([]);
    this.isFetchingData$.next(false);
    this.isFetchingGeos$.next(false);
  }

  private reportError(errorHeader: string, errorMessage: string = 'There was an unspecified error during Market Geo processing', errorObject: any = null, startTime: number = 0) {
    this.isFetchingData$.next(false);
    this.isFetchingGeos$.next(false);
    this.logger.error.log(errorHeader + ' (', formatMilli(performance.now() - startTime), ')', errorObject);
    this.store$.dispatch(ErrorNotification({ message: errorMessage, notificationTitle: errorHeader, additionalErrorInfo: errorObject }));
  }
}
