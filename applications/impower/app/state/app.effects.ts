import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EsriService } from '@val/esri';
import { ErrorNotification } from '@val/messaging';
import { EMPTY, of } from 'rxjs';
import { catchError, filter, switchMap, tap } from 'rxjs/operators';
import { EsriConfigService } from '../../../../modules/esri/src/services/esri-config.service';
import { AnalysisLevel } from '../common/models/ui-enums';
import { clearTransientData } from '../impower-datastore/state/transient/transient.actions';
import { AppStateService } from '../services/app-state.service';
import { AppActionTypes, ChangeAnalysisLevel } from './app.actions';
import { FullAppState } from './app.interfaces';

@Injectable({ providedIn: 'root' })
export class AppEffects {

  @Effect({ dispatch: false })
  clearUI$ = this.actions$.pipe(
    ofType(AppActionTypes.ClearUI),
    tap(() => this.appStateService.clearUserInterface())
  );

  @Effect({ dispatch: false })
  selectLayer$ = this.actions$.pipe(
    ofType<ChangeAnalysisLevel>(AppActionTypes.ChangeAnalysisLevel),
    tap(() => this.store$.dispatch(clearTransientData({ fullEntityWipe: false }))),
    filter(action => action.payload.analysisLevel != null),
    switchMap(action => of(this.config.getAnalysisBoundaryUrl(AnalysisLevel.parse(action.payload.analysisLevel), false)).pipe(
      tap(layerId => this.esri.setSelectedLayer(layerId)),
      catchError(err => {
        this.store$.dispatch(ErrorNotification({ message: 'Could not set Layer Id based on Analysis Level', additionalErrorInfo: err }));
        return EMPTY;
      })
    ))
  );

  constructor(private actions$: Actions,
              private store$: Store<FullAppState>,
              private esri: EsriService,
              private appStateService: AppStateService,
              private config: EsriConfigService) { }

}
