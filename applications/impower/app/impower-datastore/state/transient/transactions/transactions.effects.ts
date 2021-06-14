import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { isEmpty, isNotNil } from '@val/common';
import { StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { combineLatest, of } from 'rxjs';
import { catchError, filter, map, mergeMap, switchMap, take, tap, withLatestFrom } from 'rxjs/operators';
import { AppLoggingService } from '../../../../services/app-logging.service';
import { FullAppState } from '../../../../state/app.interfaces';
import { GeoCacheService } from '../../../services/geo-cache.service';
import * as fromTransientActions from '../transient.actions';
import * as fromActions from './transactions.actions';
import { GeoTransactionType } from './transactions.actions';
import { actionedTransactionId, geoTransactionId, mapTransactionId } from './transactions.reducer';

@Injectable()
export class TransactionsEffects {

  private geoCacheWaitKey = 'GEO_CACHE_SPINNER';
  private mapCacheWaitKey = 'MAP_CACHE_SPINNER';
  private message = 'Caching Geos';

  cacheGfpGeos$ = createEffect(() => this.actions$.pipe(
    ofType(fromActions.CacheGeos),
    filter(action => action.geoType === GeoTransactionType.Geofootprint),
    switchMap(action => combineLatest([of(action), this.store$.select(actionedTransactionId, action)]).pipe(take(1))),
    tap(([action]) => {
      if (action.showSpinner) this.store$.dispatch(new StartBusyIndicator({key: this.geoCacheWaitKey, message: this.message}));
    }),
    switchMap(([action, txId]) => this.geoCacheService.refreshCache(action.geos, txId).pipe(
      tap(() => this.store$.dispatch(new StopBusyIndicator({ key: this.geoCacheWaitKey }))),
      map(transactionId => fromActions.CacheGeosComplete({ transactionId, geoType: action.geoType })),
      catchError(err => of(fromActions.CacheGeosFailure({ err, geoType: action.geoType })))
    )),
  ));

  cacheMapGeos$ = createEffect(() => this.actions$.pipe(
    ofType(fromActions.CacheGeos),
    filter(action => action.geoType === GeoTransactionType.Map),
    switchMap(action => combineLatest([of(action), this.store$.select(actionedTransactionId, action)]).pipe(take(1))),
    tap(([action]) => {
      if (action.showSpinner) this.store$.dispatch(new StartBusyIndicator({key: this.mapCacheWaitKey, message: this.message}));
    }),
    switchMap(([action, txId]) => this.geoCacheService.refreshCache(action.geos, txId).pipe(
      tap(() => this.store$.dispatch(new StopBusyIndicator({ key: this.mapCacheWaitKey }))),
      map(transactionId => fromActions.CacheGeosComplete({ transactionId, geoType: action.geoType })),
      catchError(err => of(fromActions.CacheGeosFailure({ err, geoType: action.geoType })))
    ))
  ));

  removeGeos$ = createEffect(() => this.actions$.pipe(
    ofType(fromActions.RemoveGeoCache),
    switchMap(action => combineLatest([of(action), this.store$.select(actionedTransactionId, action)]).pipe(take(1))),
    filter(([, txId]) => txId != null),
    switchMap(([action, txId]) => this.geoCacheService.removeCache(txId).pipe(
      map(() => fromActions.RemoveGeoCacheComplete({ geoType: action.geoType })),
      catchError(err => of(fromActions.RemoveGeoCacheFailure({ err, geoType: action.geoType })))
    ))
  ));

  clearCache$ = createEffect(() => this.actions$.pipe(
    ofType(fromTransientActions.clearTransientData.type),
    withLatestFrom(this.store$.select(geoTransactionId), this.store$.select(mapTransactionId)),
    map(txIds => txIds.filter(isNotNil)),
    filter(txIds => !isEmpty(txIds)),
    mergeMap((txIds) => txIds.map(txId => this.geoCacheService.removeCache(txId))),
    map(() => fromActions.RemoveGeoCacheComplete({ geoType: null }))
  ), { useEffectsErrorHandler: true });

  errors$ = createEffect(() => this.actions$.pipe(
    ofType(fromActions.CacheGeosFailure, fromActions.RemoveGeoCacheFailure),
    tap(action => this.logger.error.log('There was an error during a geo cache API call.', action))
  ), { dispatch: false });

  constructor(private actions$: Actions,
              private store$: Store<FullAppState>,
              private logger: AppLoggingService,
              private geoCacheService: GeoCacheService) {}
}
