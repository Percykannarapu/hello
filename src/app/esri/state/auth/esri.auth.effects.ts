import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { EsriIdentityService } from '../../services/esri-identity.service';
import { AuthenticateFailure, AuthenticateSuccess, EsriAuthActionTypes } from './esri.auth.actions';

@Injectable()
export class EsriAuthEffects {

  @Effect()
  authenticate$ = this.actions$.pipe(
    ofType(EsriAuthActionTypes.Authenticate),
    switchMap(() => this.identityService.authenticate()),
    map(token => new AuthenticateSuccess({ tokenResponse: token})),
    catchError(err => of(new AuthenticateFailure({ errorResponse: err })))
  );

  @Effect({ dispatch: false })
  authFailure$ = this.actions$.pipe(
    ofType<AuthenticateFailure>(EsriAuthActionTypes.AuthenticateFailure),
    tap(action => console.error('There was an error authenticating the Esri Api', action.payload.errorResponse))
  );

  constructor(private actions$: Actions,
              private identityService: EsriIdentityService) {}
}
