import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { SetSelectedLayer } from '@val/esri';
import { of } from 'rxjs';
import { AppConfig } from '../app.config';
import { ErrorNotification } from '../messaging';
import { AppActionTypes, ChangeAnalysisLevel } from './app.actions';
import { AppStateService } from '../services/app-state.service';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';

@Injectable()
export class AppEffects {

  @Effect({ dispatch: false })
  clearUI$ = this.actions$.pipe(
    ofType(AppActionTypes.ClearUI),
    tap(() => this.appStateService.clearUserInterface())
  );

  @Effect()
  selectLayer$ = this.actions$.pipe(
    ofType<ChangeAnalysisLevel>(AppActionTypes.ChangeAnalysisLevel),
    filter(action => action.payload.analysisLevel != null),
    switchMap(action => of(this.config.getLayerIdForAnalysisLevel(action.payload.analysisLevel)).pipe(
      map(layerId => new SetSelectedLayer({ layerId })),
      catchError(err => of(new ErrorNotification({ message: 'Could not set Layer Id based on Analysis Level', additionalErrorInfo: err })))
    ))
  );

  constructor(private actions$: Actions,
              private appStateService: AppStateService,
              private config: AppConfig) { }

}
