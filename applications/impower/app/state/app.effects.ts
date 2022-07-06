import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { isNotNil } from '@val/common';
import { EsriConfigService, EsriService } from '@val/esri';
import { ErrorNotification } from '@val/messaging';
import { EMPTY, of } from 'rxjs';
import { catchError, filter, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { clearTransientData } from '../impower-datastore/state/transient/transient.actions';
import { ChangeAnalysisLevel } from './app.actions';
import { FullAppState } from './app.interfaces';
import * as fromBatchMap from './batch-map/batch-map.selectors';

@Injectable({ providedIn: 'root' })
export class AppEffects {

  selectLayer$ = createEffect(() => this.actions$.pipe(
    ofType(ChangeAnalysisLevel),
    tap(() => this.store$.dispatch(clearTransientData({ fullEntityWipe: false }))),
    filter(action => isNotNil(action.analysisLevel)),
    withLatestFrom(this.store$.select(fromBatchMap.getBatchMode)),
    switchMap(([action, isBatchMode]) => of(this.config.getAnalysisBoundaryUrl(action.analysisLevel, isBatchMode)).pipe(
      tap(layerId => this.esri.setSelectedLayer(layerId)),
      catchError(err => {
        this.store$.dispatch(ErrorNotification({ message: 'Could not set Layer Id based on Analysis Level', additionalErrorInfo: err }));
        return EMPTY;
      })
    ))
  ), { dispatch: false });

  constructor(private actions$: Actions,
              private store$: Store<FullAppState>,
              private esri: EsriService,
              private config: EsriConfigService) { }

}
