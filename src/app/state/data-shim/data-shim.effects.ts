import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import {
  CreateNewProjectComplete,
  DataShimActionTypes,
  ProjectLoad,
  ProjectLoadFailure,
  ProjectLoadSuccess,
  ProjectSaveAndLoad,
  ProjectSaveFailure,
  ProjectSaveSuccess
} from './data-shim.actions';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { of, throwError } from 'rxjs';
import { Store } from '@ngrx/store';
import { AppState } from '../app.interfaces';
import { AppDataShimService } from '../../services/app-data-shim.service';
import { StartBusyIndicator, StopBusyIndicator } from '../../messaging';
import { ClearSelectedGeos } from '../../esri/state/map/esri.renderer.actions';

function isFailureAction(item: any) : item is ProjectLoadFailure | ProjectSaveFailure {
  return item.hasOwnProperty('type') && (item['type'] === DataShimActionTypes.ProjectSaveFailure || item['type'] === DataShimActionTypes.ProjectLoadFailure);
}

@Injectable({ providedIn: 'root' })
export class DataShimEffects {

  @Effect()
  projectSaveAndCreateNew$ = this.actions$.pipe(
    ofType(DataShimActionTypes.ProjectSaveAndNew),
    tap(() => this.startBusy('Saving Project')),
    mergeMap(() => this.appDataShimService.save().pipe(
      tap(projectId => this.store$.dispatch(new ProjectSaveSuccess({ projectId, isSilent: false }))),
      catchError(err => throwError(new ProjectSaveFailure({ err })))
    )),
    tap(() => this.store$.dispatch(new ClearSelectedGeos())),
    tap(() => this.appDataShimService.createNew()),
    map(() => new CreateNewProjectComplete()),
    catchError(err => of(isFailureAction(err) ? err : new ProjectSaveFailure({ err }))),
    tap(() => this.stopBusy(), () => this.stopBusy())
  );

  @Effect()
  projectSaveAndLoad$ = this.actions$.pipe(
    ofType<ProjectSaveAndLoad>(DataShimActionTypes.ProjectSaveAndLoad),
    tap(() => this.startBusy('Saving Project')),
    mergeMap(action => this.appDataShimService.save().pipe(
      tap(projectId => this.store$.dispatch(new ProjectSaveSuccess({ projectId, isSilent: false }))),
      catchError(err => throwError(new ProjectSaveFailure({ err }))),
      map(() => action)
    )),
    tap(() => this.store$.dispatch(new ClearSelectedGeos())),
    tap(action => this.startBusy(`Loading Project ${action.payload.idToLoad}`)),
    mergeMap(action => this.appDataShimService.load(action.payload.idToLoad).pipe(
      map(projectId => new ProjectLoadSuccess({ projectId, isSilent: false })),
      catchError(err => throwError(new ProjectLoadFailure({ err })))
    )),
    catchError(err => of(isFailureAction(err) ? err : new ProjectSaveFailure({ err }))),
    tap(() => this.stopBusy(), () => this.stopBusy())
  );

  @Effect()
  projectSaveAndReload$ = this.actions$.pipe(
    ofType(DataShimActionTypes.ProjectSaveAndReload),
    tap(() => this.startBusy('Saving Project')),
    tap(() => this.store$.dispatch(new ClearSelectedGeos())),
    mergeMap(() => this.appDataShimService.save().pipe(
      catchError(err => throwError(new ProjectSaveFailure({ err })))
    )),
    mergeMap(id => this.appDataShimService.load(id).pipe(
      tap(projectId => this.store$.dispatch(new ProjectLoadSuccess({ projectId, isSilent: true }))),
      catchError(err => throwError(new ProjectLoadFailure({ err })))
    )),
    map(projectId => new ProjectSaveSuccess({ projectId, isSilent: false })),
    catchError(err => of(isFailureAction(err) ? err : new ProjectSaveFailure({ err }))),
    tap(() => this.stopBusy(), () => this.stopBusy())
  );

  @Effect()
  projectLoad$ = this.actions$.pipe(
    ofType<ProjectLoad>(DataShimActionTypes.ProjectLoad),
    tap(action => this.startBusy(`Loading Project ${action.payload.projectId}`)),
    tap(() => this.store$.dispatch(new ClearSelectedGeos())),
    mergeMap(action => this.appDataShimService.load(action.payload.projectId)),
    map(projectId => new ProjectLoadSuccess({ projectId, isSilent: false })),
    catchError(err => of(new ProjectLoadFailure({ err }))),
    tap(() => this.stopBusy(), () => this.stopBusy())
  );

  @Effect()
  createNewProject$ = this.actions$.pipe(
    ofType(DataShimActionTypes.ProjectCreateNew),
    tap(() => this.store$.dispatch(new ClearSelectedGeos())),
    tap(() => this.appDataShimService.createNew()),
    map(() => new CreateNewProjectComplete()),
  );

  private busyKey = 'DataShimBusyIndicator';

  constructor(private actions$: Actions,
              private store$: Store<AppState>,
              private appDataShimService: AppDataShimService) {}

  private startBusy(message: string) {
    this.store$.dispatch(new StartBusyIndicator({ key: this.busyKey, message }));
  }

  private stopBusy() {
    this.store$.dispatch(new StopBusyIndicator({ key: this.busyKey }));
  }
}
