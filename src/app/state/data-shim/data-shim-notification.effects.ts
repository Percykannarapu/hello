import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { DataShimActionTypes, ProjectLoadFailure, ProjectLoadSuccess, ProjectSaveFailure, ProjectSaveSuccess } from './data-shim.actions';
import { filter, map } from 'rxjs/operators';
import { ErrorNotification, SuccessNotification } from '../../messaging';

@Injectable({ providedIn: 'root' })
export class DataShimNotificationEffects {

  @Effect()
  projectSaveSuccess$ = this.actions$.pipe(
    ofType<ProjectSaveSuccess>(DataShimActionTypes.ProjectSaveSuccess),
    filter(action => !action.payload.isSilent),
    map(action => new SuccessNotification({ message: `Project ${action.payload.projectId} was saved successfully`, notificationTitle: 'Save Project'}))
  );

  @Effect()
  projectSaveFailure$ = this.actions$.pipe(
    ofType<ProjectSaveFailure>(DataShimActionTypes.ProjectSaveFailure),
    map(action => new ErrorNotification({ message: 'There was an error saving the Project', notificationTitle: 'Save Project', additionalErrorInfo: action.payload.err }))
  );

  @Effect()
  projectLoadSuccess$ = this.actions$.pipe(
    ofType<ProjectLoadSuccess>(DataShimActionTypes.ProjectLoadSuccess),
    filter(action => !action.payload.isSilent),
    map(action => new SuccessNotification({ message: `Project ${action.payload.projectId} loaded`, notificationTitle: 'Load Project'}))
  );

  @Effect()
  projectLoadFailure$ = this.actions$.pipe(
    ofType<ProjectLoadFailure>(DataShimActionTypes.ProjectLoadFailure),
    map(action => new ErrorNotification({ message: 'There was an error loading the Project', notificationTitle: 'Load Project', additionalErrorInfo: action.payload.err }))
  );

  constructor(private actions$: Actions) {}
}
