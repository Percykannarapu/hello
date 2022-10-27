import { Inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType, OnInitEffects } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { EsriConfigOptions, EsriLoaderToken } from '../../configuration';
import { displayInitializationError, setupEsriConfig } from '../../core/esri-initialize';
import { EsriAuthService } from '../../services/esri-auth.service';
import { LoggingService } from '../../services/logging.service';
import { AppState } from '../esri.reducers';
import { internalSelectors } from '../esri.selectors';
import * as fromInitActions from './esri.init.actions';

@Injectable()
export class EsriInitEffects implements OnInitEffects {

  initialize$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(fromInitActions.initialize),
      tap(() => setupEsriConfig(this.loadConfig)),
      map(() => fromInitActions.initializeComplete())
    );
  });

  authenticate$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(fromInitActions.authenticate),
      switchMap(() => this.authService.generateToken().pipe(
        map(token => fromInitActions.authenticateSuccess({ tokenResponse: token })),
        catchError(err => of(fromInitActions.authenticateFailure({ errorResponse: err })))
      )),
    );
  });

  refresh$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(fromInitActions.tokenRefresh),
      switchMap(() => this.authService.generateToken().pipe(
        map(token => fromInitActions.refreshSuccess({ tokenResponse: token })),
        catchError(err => of(fromInitActions.refreshFailure({ errorResponse: err })))
      )),
    );
  });

  register$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(fromInitActions.authenticateSuccess, fromInitActions.refreshSuccess),
      tap(action => this.authService.registerToken(action.tokenResponse)),
    );
  }, { dispatch: false });

  authFailure$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(fromInitActions.authenticateFailure, fromInitActions.refreshFailure),
      tap(action => this.logger.error.log('There was an error authenticating or refreshing the Esri Api token', action.errorResponse.details?.raw + " " +action.errorResponse.details?.url)),
      tap(action => displayInitializationError(JSON.stringify(action.errorResponse)))
    );
  }, { dispatch: false });

  networkStatusChange$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(fromInitActions.changeNetworkStatus),
      withLatestFrom(this.store$.select(internalSelectors.getEsriToken)),
      tap(([{ isOnline }, token]) => this.authService.suspendOrRestoreRefresh(isOnline, token))
    );
  }, { dispatch: false });

  constructor(private actions$: Actions,
              private store$: Store<AppState>,
              private logger: LoggingService,
              private authService: EsriAuthService,
              @Inject(EsriLoaderToken) private loadConfig: EsriConfigOptions) {}

  ngrxOnInitEffects() : Action {
    return fromInitActions.initialize();
  }
}
