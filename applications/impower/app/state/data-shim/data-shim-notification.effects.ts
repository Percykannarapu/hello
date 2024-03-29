import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { CopyCoordinatesToClipboard, EsriMapActionTypes } from '@val/esri';
import { ErrorNotification, InfoNotification, isErrorNotification, SuccessNotification } from '@val/messaging';
import { filter, map } from 'rxjs/operators';
import { DataShimActionTypes, ProjectLoadFailure, ProjectLoadSuccess, ProjectSaveFailure, ProjectSaveSuccess } from './data-shim.actions';

@Injectable({ providedIn: 'root' })
export class DataShimNotificationEffects {

  @Effect()
  projectSaveSuccess$ = this.actions$.pipe(
    ofType<ProjectSaveSuccess>(DataShimActionTypes.ProjectSaveSuccess),
    map(action => SuccessNotification({ message: `Project ${action.payload.projectId} was saved successfully`, notificationTitle: 'Save Project'}))
  );

  @Effect()
  projectLoadSuccess$ = this.actions$.pipe(
    ofType<ProjectLoadSuccess>(DataShimActionTypes.ProjectLoadSuccess),
    map(action => SuccessNotification({ message: `Project ${action.payload.projectId} loaded`, notificationTitle: 'Load Project'}))
  );

  @Effect()
  projectSaveFailure$ = this.actions$.pipe(
    ofType<ProjectSaveFailure>(DataShimActionTypes.ProjectSaveFailure),
    map(action => this.processError(action.payload.err, 'Save'))
  );

  @Effect()
  projectLoadFailure$ = this.actions$.pipe(
    ofType<ProjectLoadFailure>(DataShimActionTypes.ProjectLoadFailure),
    map(action => this.processError(action.payload.err, 'Load'))
  );

  @Effect()
  coordinatesCopyInfo$ = this.actions$.pipe(
    ofType<CopyCoordinatesToClipboard>(EsriMapActionTypes.CopyCoordinatesToClipboard),
    filter(action => action.type === EsriMapActionTypes.CopyCoordinatesToClipboard ),
    map(() => InfoNotification({ notificationTitle: 'X/Y Copied', message: 'The selected point\'s X/Y values have been copied to the clipboard', sticky: false, life: 5000 }))
  );

  constructor(private actions$: Actions) {}

  private processError(err: any, actionFailure: 'Load' | 'Save') : ReturnType<typeof ErrorNotification> {
    const verbMap = {
      'Load': 'loading',
      'Save': 'saving'
    };
    const notificationTitle = `${actionFailure} Project Error`;
    if (isErrorNotification(err)) {
      return err;
    } else if (typeof err === 'string') {
      return ErrorNotification({ message: err, notificationTitle });
    } else {
      return ErrorNotification({ message: `There was an error ${verbMap[actionFailure]} the Project`, notificationTitle, additionalErrorInfo: err});
    }
  }
}
