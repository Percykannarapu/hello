import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { DataShimActionTypes, ProjectLoadFailure, ProjectLoadSuccess, ProjectSaveFailure, ProjectSaveSuccess } from './data-shim.actions';
import { filter, map } from 'rxjs/operators';
import { ErrorNotification, MessagingActionTypes, SuccessNotification, InfoNotification } from '@val/messaging';
import { CopyCoordinatesToClipboard, EsriMapActionTypes } from '@val/esri';

@Injectable({ providedIn: 'root' })
export class DataShimNotificationEffects {

  @Effect()
  projectSaveSuccess$ = this.actions$.pipe(
    ofType<ProjectSaveSuccess | ProjectLoadSuccess>(DataShimActionTypes.ProjectSaveSuccess, DataShimActionTypes.ProjectLoadSuccess),
    filter(action => action.type === DataShimActionTypes.ProjectSaveSuccess || action.payload.isReload),
    map(action => new SuccessNotification({ message: `Project ${action.payload.projectId} was saved successfully`, notificationTitle: 'Save Project'}))
  );

  @Effect()
  projectLoadSuccess$ = this.actions$.pipe(
    ofType<ProjectLoadSuccess>(DataShimActionTypes.ProjectLoadSuccess),
    filter(action => !action.payload.isReload),
    map(action => new SuccessNotification({ message: `Project ${action.payload.projectId} loaded`, notificationTitle: 'Load Project'}))
  );

  @Effect()
  projectSaveFailure$ = this.actions$.pipe(
    ofType<ProjectSaveFailure | ProjectLoadFailure>(DataShimActionTypes.ProjectSaveFailure, DataShimActionTypes.ProjectLoadFailure),
    filter(action => action.type === DataShimActionTypes.ProjectSaveFailure || action.payload.isReload),
    map(action => this.processError(action.payload.err, 'Save'))
  );

  @Effect()
  projectLoadFailure$ = this.actions$.pipe(
    ofType<ProjectLoadFailure>(DataShimActionTypes.ProjectLoadFailure),
    filter(action => !action.payload.isReload),
    map(action => this.processError(action.payload.err, 'Load'))
  );

  @Effect()
  coordinatesCopyInfo$ = this.actions$.pipe(
    ofType<CopyCoordinatesToClipboard>(EsriMapActionTypes.CopyCoordinatesToClipboard),
    filter(action => action.type === EsriMapActionTypes.CopyCoordinatesToClipboard ),
    map(() => new InfoNotification({ notificationTitle: 'Copy to Clipboard', message: 'You can copy the LatLong to clipboard by clicking on the map', sticky: false, life: 5000 }))
  );

  constructor(private actions$: Actions) {}

  private processError(err: any, actionFailure: 'Load' | 'Save') : ErrorNotification {
    const verbMap = {
      'Load': 'loading',
      'Save': 'saving'
    };
    const notificationTitle = `${actionFailure} Project Error`;
    if (err.hasOwnProperty('type') && err['type'] === MessagingActionTypes.ErrorNotification) {
      return err;
    } else if (typeof err === 'string') {
      return new ErrorNotification({ message: err, notificationTitle });
    } else {
      return new ErrorNotification({ message: `There was an error ${verbMap[actionFailure]} the Project`, notificationTitle, additionalErrorInfo: err});
    }
  }
}
