import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { getUuid } from '@val/common';
import { AppConfig } from 'app/app.config';
import * as fromGeoVarSelectors from 'app/impower-datastore/state/transient/geo-vars/geo-vars.selectors';
import { AppStateService } from 'app/services/app-state.service';
import { LoggingService } from 'app/val-modules/common/services/logging.service';
import { of } from 'rxjs';
import { catchError, filter, map, switchMap, take, tap, withLatestFrom } from 'rxjs/operators';
import { FullAppState } from '../../../../state/app.interfaces';
import { CacheGeofootprintGeos } from '../transient.actions';
import { CacheGeos, CacheGeosComplete, CacheGeosFailure, TransientActionTypes } from './../transient.actions';
import { DeleteGeoVars, GeoVarActions, GeoVarActionTypes, GeoVarCacheGeofootprintGeos, GeoVarCacheGeos, GeoVarCacheGeosComplete, GeoVarCacheGeosFailure, RemoveVar, RemoveVars, UpsertGeoVars } from './geo-vars.actions';

@Injectable()
export class GeoVarsEffects {

  // Will cache geocodes from the payload to the server.
  // The correlationId is used to distinguish between geoVar and mapVar completions.
  @Effect()
  geoVarCacheGeos$ = this.actions$.pipe(
    ofType<GeoVarCacheGeos>(GeoVarActionTypes.GeoVarCacheGeos),
    map(action => ({
      geocodes: Array.from(action.payload.geocodes),
      correlationId: getUuid()
    })),
    //tap(params => console.log('### geoVarCacheGeos - correlationId:', params.correlationId)),
    tap(params => this.store$.dispatch(new CacheGeos({ geocodes: new Set(params.geocodes), correlationId: params.correlationId }))),
    switchMap(action => this.actions$.pipe(
      ofType<CacheGeosComplete|CacheGeosFailure>(TransientActionTypes.CacheGeosComplete, TransientActionTypes.CacheGeosFailure),
      filter(response => response.payload.correlationId === action.correlationId),
      map(response => (response.type == TransientActionTypes.CacheGeosComplete)
                      ? new GeoVarCacheGeosComplete({ transactionId: response.payload.transactionId, correlationId: response.payload.correlationId })
                      : new GeoVarCacheGeosFailure({ err: response.payload.err, correlationId: response.payload.correlationId })),
      take(1),
      catchError(err => of(new GeoVarCacheGeosFailure({ err: err, correlationId: err.correlationId })))
    )));

  // Will cache geocodes in the geofootprint to the server
  @Effect()
  geoVarCacheGeofootprintGeos$ = this.actions$.pipe(
    ofType<GeoVarCacheGeofootprintGeos>(GeoVarActionTypes.GeoVarCacheGeofootprintGeos),
    map(action => ({
      geocodes: this.appStateService.uniqueIdentifiedGeocodes$.getValue(),
      correlationId: getUuid()
    })),
    //tap(params => console.log('### geoVarCacheGeofootprintGeos - caching:', params.geocodes.length, 'geos - correlationId:', params.correlationId)),
    tap(params => this.store$.dispatch(new CacheGeofootprintGeos({ correlationId: params.correlationId }))),
    switchMap(action => this.actions$.pipe(
      ofType<CacheGeosComplete|CacheGeosFailure>(TransientActionTypes.CacheGeosComplete, TransientActionTypes.CacheGeosFailure),
      filter(response => response.payload.correlationId === action.correlationId),
      map(response => (response.type == TransientActionTypes.CacheGeosComplete)
                      ? new GeoVarCacheGeosComplete({ transactionId: response.payload.transactionId, correlationId: response.payload.correlationId })
                      : new GeoVarCacheGeosFailure({ err: response.payload.err, correlationId: response.payload.correlationId })),
      take(1),
      catchError(err => of(new GeoVarCacheGeosFailure({ err: err, correlationId: err.correlationId })))
    )));

  // An acknowledgment that the geocode caching is complete, result has the transactionId identifying them
  @Effect({dispatch: false})
  cacheGeosComplete$ = this.actions$.pipe(
    ofType<CacheGeosComplete>(GeoVarActionTypes.GeoVarCacheGeosComplete),
    map(action => action.payload),
    // tap(payload => console.log('### GeoVar CacheGeosComplete - transactionId:', payload.transactionId, ', correlationId:', payload.correlationId))
  );

  /*
      Removes a single variable, by varPk off a GeoVar entity.  If all variables are removed,
      then the GeoVar itself will get removed.

      GeoVar Entity Before:
        { 31768: 100.99, 31934: 103.25, geocode: "48152" }

      this.store$.dispatch(new RemoveVar({ varPk: "31768" }));

      GeoVar Entity After:
        { 31934: 103.25, geocode: "48152" }
  */
  @Effect({dispatch: false})
  removeVar$ = this.actions$.pipe(
    ofType<RemoveVar>(GeoVarActionTypes.RemoveVar),
    withLatestFrom(this.store$.pipe(select(fromGeoVarSelectors.getGeoVars))),
    map(([action, geoVars]) => {
      const emptyGeos: string[] = [];

      // Transform each entity to remove the varPk
      for (let i = 0; i < geoVars.length; i++) {
        if (geoVars[i].hasOwnProperty(action.payload.varPk)) {
          delete geoVars[i][action.payload.varPk];
          if (Object.keys(geoVars[i]).length === 1)
             emptyGeos.push(geoVars[i].geocode);
        }
      }

      // Upsert them back or Remove them if the last var was removed
      this.store$.dispatch(new UpsertGeoVars({ geoVars: geoVars} ));

      // Remove all geo vars that no longer have any variables
      if (emptyGeos.length > 0)
         this.store$.dispatch(new DeleteGeoVars({ ids: emptyGeos }));
    })
  );

  /*
      Removes a multiple variables, by varPk off a GeoVar entity.  If all variables are removed,
      then the GeoVar itself will get removed.

      GeoVar Entity Before:
        { 1016: 0.08, 31768: 100.99, 31934: 103.25, geocode: "48152" }

      this.store$.dispatch(new RemoveVars({ varPks: ["1016", "31934"] }));

      GeoVar Entity After:
        { 31768: 100.99, geocode: "48152" }
  */
  @Effect({dispatch: false})
  removeVars$ = this.actions$.pipe(
    ofType<RemoveVars>(GeoVarActionTypes.RemoveVars),
    withLatestFrom(this.store$.pipe(select(fromGeoVarSelectors.getGeoVars))),
    map(([action, geoVars]) => {
      const emptyGeos: string[] = [];

      // Transform each entity to remove the varPk
      for (let i = 0; i < geoVars.length; i++) {
        action.payload.varPks.forEach(varPk => {
          if (geoVars[i].hasOwnProperty(varPk)) {
            delete geoVars[i][varPk];
            if (Object.keys(geoVars[i]).length === 1)
              emptyGeos.push(geoVars[i].geocode);
          }
        });
      }

      // Upsert them back or Remove them if the last var was removed
      this.store$.dispatch(new UpsertGeoVars({ geoVars: geoVars} ));

      // Remove all geo vars that no longer have any variables
      if (emptyGeos.length > 0)
         this.store$.dispatch(new DeleteGeoVars({ ids: emptyGeos }));
    })
  );

  constructor(private actions$: Actions<GeoVarActions>,
              private store$: Store<FullAppState>,
              private config: AppConfig,
              private logger: LoggingService,
              private appStateService: AppStateService
              ) { }
}
