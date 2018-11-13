import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { DataShimActionTypes, ProjectLoad, ProjectLoadFailure, ProjectLoadSuccess, ProjectSaveFailure, ProjectSaveSuccess } from './data-shim.actions';
import { filter, map } from 'rxjs/operators';
import { ErrorNotification, StartBusyIndicator, StopBusyIndicator, SuccessNotification } from '../../messaging';

@Injectable({ providedIn: 'root' })
export class DataShimNotificationEffects {
  private readonly key = 'DataShimBusy';

  @Effect()
  saveBusy$ = this.actions$.pipe(
    ofType(DataShimActionTypes.ProjectSave, DataShimActionTypes.ProjectSaveAndLoad, DataShimActionTypes.ProjectSaveAndNew),
    map(() => new StartBusyIndicator({ key: this.key, message: 'Saving Project' }))
  );

  @Effect()
  loadBusy$ = this.actions$.pipe(
    ofType<ProjectLoad>(DataShimActionTypes.ProjectLoad),
    filter(action => !action.payload.isReload),
    map(action => new StartBusyIndicator({ key: this.key, message: `Loading Project ${action.payload.projectId}` }))
  );

  @Effect()
  stopBusy$ = this.actions$.pipe(
    ofType(DataShimActionTypes.ProjectSaveSuccess, DataShimActionTypes.ProjectSaveFailure, DataShimActionTypes.ProjectLoadSuccess, DataShimActionTypes.ProjectLoadFailure),
    map(() => new StopBusyIndicator({ key: this.key }))
  );

  @Effect()
  projectSaveSuccess$ = this.actions$.pipe(
    ofType<ProjectSaveSuccess>(DataShimActionTypes.ProjectSaveSuccess),
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
    map(action => new SuccessNotification({ message: `Project ${action.payload.projectId} loaded`, notificationTitle: 'Load Project'}))
  );

  @Effect()
  projectLoadFailure$ = this.actions$.pipe(
    ofType<ProjectLoadFailure>(DataShimActionTypes.ProjectLoadFailure),
    map(action => new ErrorNotification({ message: 'There was an error loading the Project', notificationTitle: 'Load Project', additionalErrorInfo: action.payload.err }))
  );

  constructor(private actions$: Actions) {}
}
