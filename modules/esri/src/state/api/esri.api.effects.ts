import { Inject, Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { EsriApiActionTypes, InitializeApi, InitializeApiFailure, InitializeApiSuccess } from './esri.api.actions';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { from, of } from 'rxjs';
import { Authenticate } from '..';
import { EsriApi } from '../../core';
import { EsriConfigOptions, EsriLoaderToken } from '../../configuration';

@Injectable()
export class EsriApiEffects {

  @Effect()
  initApi$ = this.actions$.pipe(
    ofType(EsriApiActionTypes.InitializeApi),
    switchMap(() => from(EsriApi.initialize(this.config)).pipe(
      map(() => new InitializeApiSuccess()),
      catchError(err => of(new InitializeApiFailure({ errorResponse: err })))
    ))
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

  constructor(private actions$: Actions, @Inject(EsriLoaderToken) private config: EsriConfigOptions) {}
}
