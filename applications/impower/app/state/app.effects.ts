import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EsriService } from '@val/esri';
import { EMPTY, of } from 'rxjs';
import { AppConfig } from '../app.config';
import { ErrorNotification } from '@val/messaging';
import { AppActionTypes, ChangeAnalysisLevel } from './app.actions';
import { AppStateService } from '../services/app-state.service';
import { catchError, filter, switchMap, tap } from 'rxjs/operators';
import { FullAppState } from './app.interfaces';

@Injectable()
export class AppEffects {

  @Effect({ dispatch: false })
  clearUI$ = this.actions$.pipe(
    ofType(AppActionTypes.ClearUI),
    tap(() => this.appStateService.clearUserInterface())
  );

  @Effect({ dispatch: false })
  selectLayer$ = this.actions$.pipe(
    ofType<ChangeAnalysisLevel>(AppActionTypes.ChangeAnalysisLevel),
    filter(action => action.payload.analysisLevel != null),
    switchMap(action => of(this.config.getLayerIdForAnalysisLevel(action.payload.analysisLevel)).pipe(
      tap(layerId => this.esri.setSelectedLayer(layerId)),
      catchError(err => {
        this.store$.dispatch(new ErrorNotification({ message: 'Could not set Layer Id based on Analysis Level', additionalErrorInfo: err }));
        return EMPTY;
      })
    ))
  );

  constructor(private actions$: Actions,
              private store$: Store<FullAppState>,
              private esri: EsriService,
              private appStateService: AppStateService,
              private config: AppConfig) { }

}
