import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { CreateNewEntities, LoadEntitiesFromServer } from '../../impower-datastore/state/persistent/persistent.actions';
import {
  CreateNewProject,
  CreateNewProjectComplete,
  DataShimActionTypes,
  ProjectLoad,
  ProjectLoadFailure,
  ProjectLoadSuccess,
  ProjectSaveAndLoad,
  ProjectSaveFailure,
  ProjectSaveSuccess
} from './data-shim.actions';
import { catchError, concatMap, map, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { AppDataShimService } from '../../services/app-data-shim.service';
import { ClearSelectedGeos } from '@val/esri';

@Injectable({ providedIn: 'root' })
export class DataShimEffects {

  @Effect()
  projectSaveAndCreateNew$ = this.actions$.pipe(
    ofType(DataShimActionTypes.ProjectSaveAndNew),
    switchMap(() => this.appDataShimService.save().pipe(
      concatMap(projectId => [
        new ProjectSaveSuccess({ projectId }),
        new CreateNewProject()
      ]),
      catchError(err => of(new ProjectSaveFailure({ err })))
    )),
  );

  @Effect()
  projectSaveAndReload$ = this.actions$.pipe(
    ofType(DataShimActionTypes.ProjectSaveAndReload),
    switchMap(() => this.appDataShimService.save().pipe(
      map(projectId => new ProjectLoad({ projectId, isReload: true })),
      catchError(err => of(new ProjectSaveFailure({ err })))
    ))
  );

  @Effect()
  projectSaveAndLoad$ = this.actions$.pipe(
    ofType<ProjectSaveAndLoad>(DataShimActionTypes.ProjectSaveAndLoad),
    switchMap(action => this.appDataShimService.save().pipe(
      concatMap(resultId => [
        new ProjectSaveSuccess({ projectId: resultId }),
        new ProjectLoad({ projectId: action.payload.projectId, isReload: false })
      ]),
      catchError(err => of(new ProjectSaveFailure({ err }))),
    ))
  );

  @Effect()
  projectLoad$ = this.actions$.pipe(
    ofType<ProjectLoad>(DataShimActionTypes.ProjectLoad),
    switchMap(action => this.appDataShimService.load(action.payload.projectId).pipe(
      map(projectId => new ProjectLoadSuccess({ projectId, isReload: action.payload.isReload })),
      catchError(err => of(new ProjectLoadFailure({ err, isReload: action.payload.isReload }))),
    )),
  );

  @Effect()
  createNewProject$ = this.actions$.pipe(
    ofType(DataShimActionTypes.ProjectCreateNew),
    map(() => this.appDataShimService.createNew()),
    map(projectId => new CreateNewProjectComplete({ projectId })),
  );

  @Effect()
  clearGeos$ = this.actions$.pipe(
    ofType(DataShimActionTypes.ProjectLoad, DataShimActionTypes.ProjectCreateNew),
    map(() => new ClearSelectedGeos())
  );

  @Effect({ dispatch: false })
  loadSuccess$ = this.actions$.pipe(
    ofType(DataShimActionTypes.ProjectLoadSuccess),
    tap(() => this.appDataShimService.onLoadSuccess())
  );

  // These are for the NgRx store
  @Effect()
  loadSecondaryStore$ = this.actions$.pipe(
    ofType<ProjectLoad>(DataShimActionTypes.ProjectLoad),
    map(action => new LoadEntitiesFromServer({ projectId: action.payload.projectId }))
  );

  @Effect()
  newSecondaryStore$ = this.actions$.pipe(
    ofType(DataShimActionTypes.ProjectCreateNew),
    map(() => new CreateNewEntities())
  );

  constructor(private actions$: Actions,
              private appDataShimService: AppDataShimService) {}
}
