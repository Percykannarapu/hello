import { TargetAudienceService } from 'app/services/target-audience.service';
import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { of, EMPTY } from 'rxjs';
import { catchError, map, switchMap, tap, concatMap } from 'rxjs/operators';
import { AppConfig } from 'app/app.config';
import { AppStateService } from 'app/services/app-state.service';
import { RestDataService } from 'app/val-modules/common/services/restdata.service';
import { LoggingService } from 'app/val-modules/common/services/logging.service';
import { formatMilli } from '@val/common';
import { TransientActionTypes, TransientActions, CacheGeos, CacheGeosFailure, CacheGeofootprintGeos, CacheGeosComplete, RemoveGeoCache, ClearAudiencesAndVars, RehydrateAfterLoad } from './transient.actions';
import { RehydrateAttributes } from './geo-attributes/geo-attributes.actions';
import { RehydrateAudiences } from './audience/audience.actions';

@Injectable()
export class TransientEffects {

  // Will cache geocodes from the payload to the server
  @Effect()
  cacheGeos$ = this.actions$.pipe(
    ofType<CacheGeos>(TransientActionTypes.CacheGeos),
    map(action => ({ geocodes: Array.from(action.payload.geocodes), correlationId: action.payload.correlationId})),
    switchMap(params => {
      const chunks = this.config.geoInfoQueryChunks;
      //console.log('### Transient - cacheGeos - caching', params.geocodes.length, 'geos into', chunks, 'chunks, correlationId:', params.correlationId);
      return (params.geocodes.length === 0)
        ? of(new CacheGeosFailure({ err: 'No geos to cache', correlationId: params.correlationId}))
        : this.restService.post('v1/targeting/base/chunkedgeos/populateChunkedGeos', [{chunks, geocodes: params.geocodes}]).pipe(
            map(response => new CacheGeosComplete({ transactionId: response.payload.transactionId, correlationId: params.correlationId })),
            catchError(err => of(new CacheGeosFailure({ err: err, correlationId: params.correlationId })))
      );
    })
  );

  // Will cache geocodes in the geofootprint to the server
  @Effect()
  cacheGeofootprintGeos$ = this.actions$.pipe(
    ofType<CacheGeofootprintGeos>(TransientActionTypes.CacheGeofootprintGeos),
    map(action => ({ geocodes: this.appStateService.uniqueIdentifiedGeocodes$.getValue(), correlationId: action.payload.correlationId })),
    switchMap(params => {
      const chunks = this.config.geoInfoQueryChunks;
      //console.log('### Transient - Caching', params.geocodes.length, 'geofootprint geos into', chunks, 'chunks', ' correlationId:', params.correlationId);
      return (params.geocodes.length === 0)
        ? of(new CacheGeosFailure({ err: 'No geos to cache', correlationId: params.correlationId}))
        : this.restService.post('v1/targeting/base/chunkedgeos/populateChunkedGeos', [{chunks, geocodes: params.geocodes}]).pipe(
            map(response => new CacheGeosComplete({ transactionId: response.payload.transactionId, correlationId: params.correlationId })),
            catchError(err => of(new CacheGeosFailure({ err: err, correlationId: params.correlationId })))
      );
    })
  );

  // An acknowledgment that the geocode caching is complete, result has the transactionId identifying them
  @Effect({dispatch: false})
  cacheGeosComplete$ = this.actions$.pipe(
    ofType<CacheGeosComplete>(TransientActionTypes.CacheGeosComplete),
    map(action => action.payload),
    //tap(payload => console.log('### Transient - CacheGeosComplete - transactionId:', payload.transactionId, ', correlationId:', payload.correlationId))
  );

  // Removes a cache of geocodes from the server by transactionId
  @Effect({ dispatch: false })
  removeGeoCache$ = this.actions$.pipe(
    ofType<RemoveGeoCache>(TransientActionTypes.RemoveGeoCache),
    map(action => action.payload.transactionId),
    switchMap(transactionId => {
      if (transactionId == null)
        return EMPTY;
      else {
        this.logger.info.log('Removing cached geos for transactionId:', transactionId);
        const deleteStartTime = performance.now();
        return this.restService.delete('v1/targeting/base/chunkedgeos/deleteChunks/', transactionId).pipe(
          tap(response => this.logger.info.log('deleteChunks took', formatMilli(performance.now() - deleteStartTime), ', Response:', response)),
          map(() => null) // just to make sure it doesn't try to stuff this into the varService
        );
      }
    })
  );

  // Will clear all audiences, geo vars and map vars
  @Effect({dispatch: false})
  clearAudiencesAndVars$ = this.actions$.pipe(
    ofType<ClearAudiencesAndVars>(TransientActionTypes.ClearAudiencesAndVars),
    tap(() => this.targetAudienceService.clearAll())
  );

  @Effect()
  rehydrateAfterLoad$ = this.actions$.pipe(
    ofType<RehydrateAfterLoad>(TransientActionTypes.RehydrateAfterLoad),
    concatMap((action) => [
      new RehydrateAttributes({ ...action.payload }),
      new RehydrateAudiences()
    ])
  );

  constructor(private actions$: Actions<TransientActions>,
              private config: AppConfig,
              private restService: RestDataService,
              private appStateService: AppStateService,
              private targetAudienceService: TargetAudienceService,
              private logger: LoggingService
              ) { }
}