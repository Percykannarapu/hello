import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import {
  CreateNewProjectComplete,
  DataShimActionTypes, ExportApioNationalData,
  ExportGeofootprint, ExportLocations,
  ProjectLoad,
  ProjectLoadFailure,
  ProjectLoadSuccess,
  ProjectSaveAndLoad,
  ProjectSaveFailure,
  ProjectSaveSuccess
} from './data-shim.actions';
import { catchError, filter, map, mergeMap, tap } from 'rxjs/operators';
import { of, throwError } from 'rxjs';
import { Store } from '@ngrx/store';
import { AppState } from '../app.interfaces';
import { ErrorNotification } from '../../messaging';
import { AppExportService } from '../../services/app-export.service';
import { toPayload } from '../../val-modules/common/common.rxjs';
import { CreateGaugeMetric } from '../usage/usage.actions';
import { AppDataShimService } from '../../services/app-data-shim.service';

function isFailureAction(item: any) : item is ProjectLoadFailure | ProjectSaveFailure {
  return item.hasOwnProperty('type') && (item['type'] === DataShimActionTypes.ProjectSaveFailure || item['type'] === DataShimActionTypes.ProjectLoadFailure);
}

@Injectable({ providedIn: 'root' })
export class DataShimEffects {

  @Effect()
  projectSaveAndCreateNew$ = this.actions$.pipe(
    ofType(DataShimActionTypes.ProjectSaveAndNew),
    mergeMap(() => this.appDataShimService.save().pipe(
      tap(projectId => this.store$.dispatch(new ProjectSaveSuccess({ projectId, isSilent: false }))),
      catchError(err => throwError(new ProjectSaveFailure({ err })))
    )),
    tap(() => this.appDataShimService.createNew()),
    map(() => new CreateNewProjectComplete()),
    catchError(err => of(isFailureAction(err) ? err : new ProjectSaveFailure({ err })))
  );

  @Effect()
  projectSaveAndLoad$ = this.actions$.pipe(
    ofType<ProjectSaveAndLoad>(DataShimActionTypes.ProjectSaveAndLoad),
    mergeMap(action => this.appDataShimService.save().pipe(
      tap(projectId => this.store$.dispatch(new ProjectSaveSuccess({ projectId, isSilent: false }))),
      catchError(err => throwError(new ProjectSaveFailure({ err }))),
      map(() => action)
    )),
    mergeMap(action => this.appDataShimService.load(action.payload.idToLoad).pipe(
      tap(projectId => this.store$.dispatch(new ProjectLoadSuccess({ projectId, isSilent: false }))),
      catchError(err => throwError(new ProjectLoadFailure({ err })))
    )),
    catchError(err => of(isFailureAction(err) ? err : new ProjectSaveFailure({ err })))
  );

  @Effect()
  projectSaveAndReload$ = this.actions$.pipe(
    ofType(DataShimActionTypes.ProjectSaveAndReload),
    mergeMap(() => this.appDataShimService.save().pipe(
      tap(projectId => this.store$.dispatch(new ProjectSaveSuccess({ projectId, isSilent: true }))),
      catchError(err => throwError(new ProjectSaveFailure({ err })))
    )),
    mergeMap(id => this.appDataShimService.load(id).pipe(
      tap(projectId => this.store$.dispatch(new ProjectLoadSuccess({ projectId, isSilent: true }))),
      catchError(err => throwError(new ProjectLoadFailure({ err })))
    )),
    map(projectId => new ProjectSaveSuccess({ projectId, isSilent: false })),
    catchError(err => of(isFailureAction(err) ? err : new ProjectSaveFailure({ err })))
  );

  @Effect()
  projectLoad$ = this.actions$.pipe(
    ofType<ProjectLoad>(DataShimActionTypes.ProjectLoad),
    mergeMap(action => this.appDataShimService.load(action.payload.projectId)),
    map(projectId => new ProjectLoadSuccess({ projectId, isSilent: false })),
    catchError(err => of(new ProjectLoadFailure({ err })))
  );

  @Effect()
  createNewProject$ = this.actions$.pipe(
    ofType(DataShimActionTypes.ProjectCreateNew),
    tap(() => this.appDataShimService.createNew()),
    map(() => new CreateNewProjectComplete())
  );

  @Effect()
  exportGeofootprint$ = this.actions$.pipe(
    ofType<ExportGeofootprint>(DataShimActionTypes.ExportGeofootprint),
    toPayload(),
    map(p => this.appExportService.exportGeofootprint(p.selectedOnly, p.currentProject)),
    mergeMap(metric => [
      metric,
      new CreateGaugeMetric({ gaugeAction: 'location-geofootprint-export' })
    ]),
    catchError(err => of(new ErrorNotification({ message: 'There was an error exporting the Geofootprint', additionalErrorInfo: err }))),
  );

  @Effect()
  exportDigital$ = this.actions$.pipe(
    ofType<ExportLocations>(DataShimActionTypes.ExportLocations),
    toPayload(),
    filter(p => p.isDigitalExport),
    map(p => this.appExportService.exportValassisDigital(p.currentProject)),
    catchError(err => of(new ErrorNotification({ message: 'There was an error exporting to Valassis Digital', additionalErrorInfo: err }))),
  );

  @Effect()
  exportLocations$ = this.actions$.pipe(
    ofType<ExportLocations>(DataShimActionTypes.ExportLocations),
    toPayload(),
    filter(p => !p.isDigitalExport),
    map(p => this.appExportService.exportLocations(p.locationType, p.currentProject)),
    catchError(err => of(new ErrorNotification({ message: 'There was an error exporting the site list', additionalErrorInfo: err }))),
  );

  @Effect({ dispatch: false })
  exportNationalExtract$ = this.actions$.pipe(
    ofType<ExportApioNationalData>(DataShimActionTypes.ExportApioNationalData),
    tap(action => this.appExportService.exportNationalExtract(action.payload.currentProject))
  );

  constructor(private actions$: Actions,
              private store$: Store<AppState>,
              private appDataShimService: AppDataShimService,
              private appExportService: AppExportService) {}
}
