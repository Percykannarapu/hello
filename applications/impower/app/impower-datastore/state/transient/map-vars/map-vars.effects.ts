import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap, take, filter } from 'rxjs/operators';
import { CacheGeosComplete, TransientActionTypes, CacheGeosFailure, CacheGeos, CacheGeofootprintGeos } from './../transient.actions';
import { MapVarActionTypes, MapVarCacheGeos, MapVarCacheGeofootprintGeos, MapVarCacheGeosComplete, MapVarCacheGeosFailure } from './map-vars.actions';
import { Store } from '@ngrx/store';
import { FullAppState } from 'app/state/app.interfaces';
import { AppStateService } from 'app/services/app-state.service';
import { getUuid } from '@val/common';

@Injectable({
  providedIn: 'root'
})
export class MapVarsEffects {

  // Will cache geocodes from the payload to the server
  @Effect()
  mapVarCacheGeos$ = this.actions$.pipe(
    ofType<MapVarCacheGeos>(MapVarActionTypes.MapVarCacheGeos),
    tap(action => console.log('### mapVarCacheGeos - fired')),
    map(action => ({
      geocodes: Array.from(action.payload.geocodes),
      correlationId: getUuid()
    })),
    tap(params => console.log('### mapVarCacheGeos is dispatching transient CacheGeos #geos:', params.geocodes.length, 'as set:', new Set(params.geocodes).size, 'correlationId:', params.correlationId)),
    tap(params => this.store$.dispatch(new CacheGeos({ geocodes: new Set(params.geocodes), correlationId: params.correlationId }))),
    switchMap(action => this.actions$.pipe(
      ofType<CacheGeosComplete|CacheGeosFailure>(TransientActionTypes.CacheGeosComplete, TransientActionTypes.CacheGeosFailure),
      filter(response => response.payload.correlationId === action.correlationId),
      tap(response => console.log('### mapVarCacheGeos is dispatching complete - response:', response)),
      map(response => (response.type == TransientActionTypes.CacheGeosComplete)
                      ? new MapVarCacheGeosComplete({ transactionId: response.payload.transactionId, correlationId: response.payload.correlationId })
                      : new MapVarCacheGeosFailure({ err: response.payload.err, correlationId: response.payload.correlationId })),
      take(1),
      catchError(err => of(new MapVarCacheGeosFailure({ err: err.payload.err, correlationId: err.payload.correlationId })))
    )));

  // Will cache geocodes in the geofootprint to the server
  @Effect()
  mapVarCacheGeofootprintGeos$ = this.actions$.pipe(
    ofType<MapVarCacheGeofootprintGeos>(MapVarActionTypes.MapVarCacheGeofootprintGeos),
    map(action => ({
      geocodes: this.appStateService.uniqueIdentifiedGeocodes$.getValue(),
      correlationId: getUuid()
    })),
    tap(params => this.store$.dispatch(new CacheGeofootprintGeos({ correlationId: params.correlationId }))),
    switchMap(action => this.actions$.pipe(
      ofType<CacheGeosComplete|CacheGeosFailure>(TransientActionTypes.CacheGeosComplete, TransientActionTypes.CacheGeosFailure),
      filter(response => response.payload.correlationId === action.correlationId),
      map(response => (response.type == TransientActionTypes.CacheGeosComplete)
                      ? new MapVarCacheGeosComplete({ transactionId: response.payload.transactionId, correlationId: response.payload.correlationId })
                      : new MapVarCacheGeosFailure({ err: response.payload.err, correlationId: response.payload.correlationId })),
      take(1),
      catchError(err => of(new MapVarCacheGeosFailure({ err: err.payload.err, correlationId: err.payload.correlationId })))
    )));

  constructor(private actions$: Actions,
              private store$: Store<FullAppState>,
              private appStateService: AppStateService) {}
}
