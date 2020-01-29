import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { formatMilli, getUuid } from '@val/common';
import { EsriService } from '@val/esri';
import { AppConfig } from 'app/app.config';
import { AppStateService } from 'app/services/app-state.service';
import { LoggingService } from 'app/val-modules/common/services/logging.service';
import { RestDataService } from 'app/val-modules/common/services/restdata.service';
import { EMPTY, of } from 'rxjs';
import { catchError, concatMap, filter, map, reduce, switchMap, take, tap, withLatestFrom } from 'rxjs/operators';
import { mapFeaturesToGeocode } from '../../../models/rxjs-utils';
import { FullAppState } from '../../../state/app.interfaces';
import { TransientService } from '../../services/transient.service';
import { ApplyAudiences, AudienceActionTypes, FetchMapVarCompleted } from './audience/audience.actions';
import { RehydrateAttributes } from './geo-attributes/geo-attributes.actions';
import { CacheGeofootprintGeos, CacheGeos, CacheGeosComplete, CacheGeosFailure, GetAllMappedVariables, RehydrateAfterLoad, RemoveGeoCache, TransientActions, TransientActionTypes } from './transient.actions';
import { getAllMappedAudiences } from './transient.reducer';

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
  // @Effect({dispatch: false})
  // cacheGeosComplete$ = this.actions$.pipe(
  //   ofType<CacheGeosComplete>(TransientActionTypes.CacheGeosComplete),
  //   map(action => action.payload),
  //   //tap(payload => console.log('### Transient - CacheGeosComplete - transactionId:', payload.transactionId, ', correlationId:', payload.correlationId))
  // );

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

  @Effect()
  rehydrateAfterLoad$ = this.actions$.pipe(
    ofType<RehydrateAfterLoad>(TransientActionTypes.RehydrateAfterLoad),
    concatMap((action) => [
      new RehydrateAttributes({ ...action.payload }),
      new ApplyAudiences({ analysisLevel: action.payload.analysisLevel }),
      new GetAllMappedVariables({ analysisLevel: action.payload.analysisLevel, correlationId: getUuid() })
    ])
  );

  @Effect()
  getAllMappedAudiences$ = this.actions$.pipe(
    ofType<GetAllMappedVariables>(TransientActionTypes.GetAllMappedVariables),
    switchMap(action => this.esriService.visibleFeatures$.pipe(
      mapFeaturesToGeocode(true),
      tap(() => console.log('In Mapped var effect A')),
      withLatestFrom(this.store$.select(getAllMappedAudiences)),
      tap(() => console.log('In Mapped var effect B')),
      map(([geocodes, audiences]) => ([action, audiences, geocodes] as const))
    )),
    tap(([action, , geocodes]) => this.store$.dispatch(new CacheGeos({ geocodes: new Set(geocodes), correlationId: action.payload.correlationId }))),
    switchMap(([primaryAction, audiences]) => this.actions$.pipe(
      ofType<CacheGeosComplete | CacheGeosFailure>(TransientActionTypes.CacheGeosComplete, TransientActionTypes.CacheGeosFailure),
      filter(cacheAction => cacheAction.payload.correlationId === primaryAction.payload.correlationId),
      take(1),
      filter(cacheAction => cacheAction.type === TransientActionTypes.CacheGeosComplete),
      map((cacheAction: CacheGeosComplete) => [cacheAction, this.transientService.dispatchMappedAudienceRequests(audiences, cacheAction.payload.transactionId, primaryAction.payload.analysisLevel)] as const),
      filter(([, dispatchCount]) => dispatchCount > 0),
      switchMap(([cacheAction, dispatchCount]) => this.actions$.pipe(
        ofType<FetchMapVarCompleted>(AudienceActionTypes.FetchMapVarCompleted),
        filter(completeAction => completeAction.payload.transactionId === cacheAction.payload.transactionId),
        take(dispatchCount),
        reduce(() => null, null), // used to wait until all {dispatchCount} actions have been accounted for
        map(() => new RemoveGeoCache({ transactionId: cacheAction.payload.transactionId }))
      ))
    )),
  );

  // this has to be a factory method instead of a direct observable since the visibleFeatures observable isn't initialized until after app start

  constructor(private actions$: Actions<TransientActions>,
              private store$: Store<FullAppState>,
              private config: AppConfig,
              private restService: RestDataService,
              private appStateService: AppStateService,
              private esriService: EsriService,
              private transientService: TransientService,
              private logger: LoggingService,
              ) { }
}
