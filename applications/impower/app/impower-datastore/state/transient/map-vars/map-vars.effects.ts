import { Injectable } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { AppStateService } from 'app/services/app-state.service';
import { FullAppState } from 'app/state/app.interfaces';

@Injectable()
export class MapVarsEffects {

  // Will cache geocodes from the payload to the server
  // @Effect()
  // mapVarCacheGeos$ = this.actions$.pipe(
  //   ofType<MapVarCacheGeos>(MapVarActionTypes.MapVarCacheGeos),
  //   map(action => ({
  //     geocodes: Array.from(action.payload.geocodes),
  //     correlationId: getUuid()
  //   })),
  //   tap(params => this.store$.dispatch(new CacheGeos({ geocodes: new Set(params.geocodes), correlationId: params.correlationId }))),
  //   switchMap(action => this.actions$.pipe(
  //     ofType<CacheGeosComplete|CacheGeosFailure>(TransientActionTypes.CacheGeosComplete, TransientActionTypes.CacheGeosFailure),
  //     filter(response => response.payload.correlationId === action.correlationId),
  //     map(response => (response.type == TransientActionTypes.CacheGeosComplete)
  //                     ? new MapVarCacheGeosComplete({ transactionId: response.payload.transactionId, correlationId: response.payload.correlationId })
  //                     : new MapVarCacheGeosFailure({ err: response.payload.err, correlationId: response.payload.correlationId })),
  //     take(1),
  //     catchError(err => of(new MapVarCacheGeosFailure({ err: err.payload.err, correlationId: err.payload.correlationId })))
  //   )));

  constructor(private actions$: Actions,
              private store$: Store<FullAppState>,
              private appStateService: AppStateService) {}
}
