import { Inject, Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import IdentityManager from 'esri/identity/IdentityManager';
import { from, Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { EsriAuthenticationParams, EsriAuthenticationToken, EsriConfigOptions, EsriLoaderToken } from '../../configuration';
import { setupEsriConfig } from '../../core/esri-initialize';
import { TokenResponse } from '../../core/esri-utils';
import { LoggingService } from '../../services/logging.service';
import { AuthenticateFailure, AuthenticateSuccess, EsriInitActionTypes, InitializeComplete } from './esri.init.actions';

@Injectable()
export class EsriInitEffects {

  @Effect()
  initialize$ = this.actions$.pipe(
    ofType(EsriInitActionTypes.Initialize),
    tap(() => setupEsriConfig(this.loadConfig)),
    map(() => new InitializeComplete())
  );

  @Effect()
  authenticate$ = this.actions$.pipe(
    ofType(EsriInitActionTypes.Authenticate),
    switchMap(() => this.generateToken().pipe(
      tap(token => IdentityManager.registerToken(token)),
      map(token => new AuthenticateSuccess({ tokenResponse: token })),
      catchError(err => of(new AuthenticateFailure({ errorResponse: err })))
    )),
  );

  @Effect({ dispatch: false })
  authFailure$ = this.actions$.pipe(
    ofType<AuthenticateFailure>(EsriInitActionTypes.AuthenticateFailure),
    tap(action => this.logger.error.log('There was an error authenticating the Esri Api', action.payload.errorResponse)),
    tap(action => this.displayError(JSON.stringify(action.payload.errorResponse)))
  );

  constructor(private actions$: Actions,
              private logger: LoggingService,
              @Inject(EsriAuthenticationToken) private authConfig: EsriAuthenticationParams,
              @Inject(EsriLoaderToken) private loadConfig: EsriConfigOptions) {}

  private generateToken() : Observable<TokenResponse> {
    const serverInfo = { tokenServiceUrl: this.authConfig.tokenGenerator } as __esri.ServerInfo;
    const userInfo = { username: this.authConfig.userName, password: this.authConfig.password };
    return from(IdentityManager.generateToken(serverInfo, userInfo)).pipe(
      map(response => ({ ...response, server: this.authConfig.tokenServer }))
    );
  }

  private displayError(err: any) : void {
    const errorMsgElement = document.querySelector('#errorMsgElement');
    let message = 'Application initialization failed';
    if (err) {
      if (err.message) {
        message = message + ': ' + err.message;
      } else {
        message = message + ': ' + err;
      }
    }
    errorMsgElement.textContent = message;
  }
}
