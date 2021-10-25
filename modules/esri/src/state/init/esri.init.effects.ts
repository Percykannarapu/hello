import { Inject, Injectable } from '@angular/core';
import IdentityManager from '@arcgis/core/identity/IdentityManager';
import { Actions, Effect, ofType, OnInitEffects } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { EsriAuthenticationParams, EsriAuthenticationToken, EsriConfigOptions, EsriLoaderToken } from '../../configuration';
import { displayInitializationError, generateToken, setupEsriConfig } from '../../core/esri-initialize';
import { LoggingService } from '../../services/logging.service';
import { AuthenticateFailure, AuthenticateSuccess, EsriInitActionTypes, Initialize, InitializeComplete } from './esri.init.actions';

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
    switchMap(() => generateToken(this.authConfig).pipe(
      tap(token => IdentityManager.registerToken(token)),
      map(token => new AuthenticateSuccess({ tokenResponse: token })),
      catchError(err => of(new AuthenticateFailure({ errorResponse: err })))
    )),
  );

  @Effect({ dispatch: false })
  authFailure$ = this.actions$.pipe(
    ofType<AuthenticateFailure>(EsriInitActionTypes.AuthenticateFailure),
    tap(action => this.logger.error.log('There was an error authenticating the Esri Api', action.payload.errorResponse)),
    tap(action => displayInitializationError(JSON.stringify(action.payload.errorResponse)))
  );

  constructor(private actions$: Actions,
              private logger: LoggingService,
              @Inject(EsriAuthenticationToken) private authConfig: EsriAuthenticationParams,
              @Inject(EsriLoaderToken) private loadConfig: EsriConfigOptions) {}

  ngrxOnInitEffects() : Action {
    return new Initialize();
  }
}
