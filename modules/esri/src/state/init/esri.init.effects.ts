import { Inject, Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { EsriConfigOptions, EsriLoaderToken } from '../../configuration';
import { setupEsriConfig } from '../../core/esri-initialize';
import { EsriIdentityService } from '../../services/esri-identity.service';
import { Authenticate, AuthenticateFailure, AuthenticateSuccess, EsriInitActionTypes } from './esri.init.actions';

@Injectable()
export class EsriInitEffects {

  @Effect()
  initialize$ = this.actions$.pipe(
    ofType(EsriInitActionTypes.Initialize),
    tap(() => setupEsriConfig(this.config)),
    map(() => new Authenticate())
  );

  @Effect()
  authenticate$ = this.actions$.pipe(
    ofType(EsriInitActionTypes.Authenticate),
    switchMap(() => this.identityService.authenticate().pipe(
      map(token => new AuthenticateSuccess({ tokenResponse: token})),
      catchError(err => of(new AuthenticateFailure({ errorResponse: err })))
    )),
  );

  @Effect({ dispatch: false })
  authFailure$ = this.actions$.pipe(
    ofType<AuthenticateFailure>(EsriInitActionTypes.AuthenticateFailure),
    tap(action => console.error('There was an error authenticating the Esri Api', action.payload.errorResponse))
  );

  constructor(private actions$: Actions,
              private identityService: EsriIdentityService,
              @Inject(EsriLoaderToken) private config: EsriConfigOptions) {}
}
