import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { EsriApiActionTypes, InitializeApiFailure, InitializeApiSuccess } from './esri.api.actions';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { EsriApi } from '../../core/esri-api.service';
import { from, of } from 'rxjs';
import { Authenticate } from '../auth/esri.auth.actions';

@Injectable()
export class EsriApiEffects {

  @Effect()
  initApi$ = this.actions$.pipe(
    ofType(EsriApiActionTypes.InitializeApi),
    switchMap(() => from(this.esriApi.initialize())),
    map(() => new InitializeApiSuccess()),
    catchError(err => of(new InitializeApiFailure({ errorResponse: err })))
  );

  @Effect({ dispatch: false })
  initFailure$ = this.actions$.pipe(
    ofType<InitializeApiFailure>(EsriApiActionTypes.InitializeApiFailure),
    tap(action => console.error('There was an error Initializing the Esri API', action.payload.errorResponse))
  );

  @Effect()
  authAfterInit$ = this.actions$.pipe(
    ofType(EsriApiActionTypes.InitializeApiSuccess),
    map(() => new Authenticate())
  );

  constructor(private actions$: Actions, public esriApi: EsriApi) {}
}
