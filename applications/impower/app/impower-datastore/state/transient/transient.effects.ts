import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { arrayToSet, formatMilli } from '@val/common';
import { EsriService } from '@val/esri';
import { AppConfig } from 'app/app.config';
import { AppStateService } from 'app/services/app-state.service';
import { LoggingService } from 'app/val-modules/common/services/logging.service';
import { RestDataService } from 'app/val-modules/common/services/restdata.service';
import { of } from 'rxjs';
import { catchError, concatMap, filter, map, mergeMap, skip, switchMap, take, tap, withLatestFrom } from 'rxjs/operators';
import { mapFeaturesToGeocode } from '../../../common/rxjs-utils';
import { FullAppState } from '../../../state/app.interfaces';
import { ProjectLoadSuccess } from '../../../state/data-shim/data-shim.actions';
import { TransientService } from '../../services/transient.service';
import { ApplyAudiences, AudienceActionTypes, FetchMapVarCompleted } from './audience/audience.actions';
import { RehydrateAttributes } from './geo-attributes/geo-attributes.actions';
import {
  CacheGeofootprintGeos,
  CacheGeos,
  CacheGeosComplete,
  CacheGeosFailure,
  GetAllMappedVariables,
  RehydrateAfterLoad,
  RemoveGeoCache,
  TransientActions,
  TransientActionTypes
} from './transient.actions';
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
      return (params.geocodes.length === 0)
        ? of(new CacheGeosFailure({ err: 'No geos to cache', correlationId: params.correlationId}))
        : this.restService.post('v1/targeting/base/chunkedgeos/populateChunkedGeos', [{chunks, geocodes: params.geocodes}]).pipe(
            map(response => new CacheGeosComplete({ transactionId: response.payload.transactionId, correlationId: params.correlationId })),
            catchError(err => of(new CacheGeosFailure({ err: err, correlationId: params.correlationId })))
      );
    })
  );

  // Removes a cache of geocodes from the server by transactionId
  @Effect({ dispatch: false })
  removeGeoCache$ = this.actions$.pipe(
    ofType<RemoveGeoCache>(TransientActionTypes.RemoveGeoCache),
    filter(action => action.payload.transactionId != null),
    tap(action => this.logger.info.log('Removing cached geos for transactionId:', action.payload.transactionId)),
    map(action => [action.payload.transactionId, performance.now()] as const),
    mergeMap(([transactionId, deleteStartTime]) => this.restService.delete('v1/targeting/base/chunkedgeos/deleteChunks/', transactionId).pipe(
        tap(response => this.logger.info.log('deleteChunks took', formatMilli(performance.now() - deleteStartTime), ', Response:', response)),
    ))
  );

  @Effect()
  rehydrateAfterLoad$ = this.actions$.pipe(
    ofType<RehydrateAfterLoad>(TransientActionTypes.RehydrateAfterLoad),
    concatMap((action) => {
      if (action.payload.isBatchMode) {
        return [
          new GetAllMappedVariables({ analysisLevel: action.payload.analysisLevel, additionalGeos: Array.from(action.payload.geocodes) }),
          new ProjectLoadSuccess({ projectId: action.payload.projectId })
        ];
      } else {
        return [
          new RehydrateAttributes({ ...action.payload }),
          new ApplyAudiences({ analysisLevel: action.payload.analysisLevel }),
          new GetAllMappedVariables({ analysisLevel: action.payload.analysisLevel, additionalGeos: Array.from(action.payload.geocodes) })
        ];
      }
    })
  );

  @Effect()
  getServerBasedMappedAudiences$ = this.actions$.pipe(
    ofType<GetAllMappedVariables>(TransientActionTypes.GetAllMappedVariables),
    switchMap(action => this.esriService.visibleFeatures$.pipe(
      mapFeaturesToGeocode(true),
      withLatestFrom(this.store$.select(getAllMappedAudiences)),
      map(([geocodes, audiences]) => ([action, audiences, geocodes] as const))
    )),
    filter(([, audiences]) => audiences.filter(a => a.audienceSourceType !== 'Custom').length > 0),
    tap(() => this.logger.debug.log('Getting server-based audience data...')),
    map(([action, audiences, geocodes]) => ([action, audiences, arrayToSet([...geocodes, ...(action.payload.additionalGeos || []) ])] as const)),
    tap(([action, , geocodes]) => this.store$.dispatch(new CacheGeos({ geocodes, correlationId: action.payload.correlationId }))),
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
        skip(dispatchCount - 1),
        take(1),
        map(() => new RemoveGeoCache({ transactionId: cacheAction.payload.transactionId }))
      ))
    )),
  );

  @Effect({ dispatch: false })
  getLocalMappedAudiences$ = this.actions$.pipe(
    ofType<GetAllMappedVariables>(TransientActionTypes.GetAllMappedVariables),
    withLatestFrom(this.store$.select(getAllMappedAudiences)),
    filter(([, audiences]) => audiences.filter(a => a.audienceSourceType === 'Custom').length > 0),
    tap(() => this.logger.debug.log('Getting pref-based audience data...')),
    tap(([action, audiences]) => this.transientService.dispatchMappedAudienceRequests(audiences, -1, action.payload.analysisLevel)),
  );

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
