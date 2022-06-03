import { Inject, Injectable } from '@angular/core';
import { Actions, Effect, ofType, OnInitEffects } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { EsriConfigOptions, EsriLoaderToken } from '../../configuration';
import { displayInitializationError, setupEsriConfig } from '../../core/esri-initialize';
import { EsriAuthService } from '../../services/esri-auth.service';
import { LoggingService } from '../../services/logging.service';
import {
  AuthenticateFailure,
  AuthenticateSuccess,
  EsriInitActionTypes,
  Initialize,
  InitializeComplete,
  RefreshFailure,
  RefreshSuccess,
} from './esri.init.actions';

@Injectable()
export class EsriInitEffects implements OnInitEffects {

  @Effect()
  initialize$ = this.actions$.pipe(
    ofType(EsriInitActionTypes.Initialize),
    tap(() => setupEsriConfig(this.loadConfig)),
    map(() => new InitializeComplete())
  );

  @Effect()
  authenticate$ = this.actions$.pipe(
    ofType(EsriInitActionTypes.Authenticate),
    switchMap(() => this.authService.generateToken().pipe(
      map(token => new AuthenticateSuccess({ tokenResponse: token })),
      catchError(err => of(new AuthenticateFailure({ errorResponse: err })))
    )),
  );

  @Effect()
  refresh$ = this.actions$.pipe(
    ofType(EsriInitActionTypes.TokenRefresh),
    switchMap(() => this.authService.generateToken().pipe(
      map(token => new RefreshSuccess({ tokenResponse: token })),
      catchError(err => of(new RefreshFailure({ errorResponse: err })))
    )),
  );

  @Effect({ dispatch: false })
  register$ = this.actions$.pipe(
    ofType<AuthenticateSuccess | RefreshSuccess>(EsriInitActionTypes.AuthenticateSuccess, EsriInitActionTypes.RefreshSuccess),
    tap(action => this.authService.registerToken(action.payload.tokenResponse)),
  );

  @Effect({ dispatch: false })
  authFailure$ = this.actions$.pipe(
    ofType<AuthenticateFailure | RefreshFailure>(EsriInitActionTypes.AuthenticateFailure, EsriInitActionTypes.RefreshFailure),
    tap(action => this.logger.error.log('There was an error authenticating or refreshing the Esri Api token', action.payload.errorResponse)),
    tap(action => displayInitializationError(JSON.stringify(action.payload.errorResponse)))
  );

  constructor(private actions$: Actions,
              private logger: LoggingService,
              private authService: EsriAuthService,
              @Inject(EsriLoaderToken) private loadConfig: EsriConfigOptions) {}

  ngrxOnInitEffects() : Action {
    return new Initialize();
  }
}
