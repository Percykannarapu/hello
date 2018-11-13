import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import {
  CreateNewProject,
  CreateNewProjectComplete,
  DataShimActionTypes, ExportApioNationalData,
  ExportGeofootprint, ExportLocations,
  ProjectLoad,
  ProjectLoadFailure,
  ProjectLoadSuccess,
  ProjectSave, ProjectSaveAndLoad,
  ProjectSaveFailure,
  ProjectSaveSuccess
} from './data-shim.actions';
import { catchError, filter, map, mergeMap, tap } from 'rxjs/operators';
import { AppProjectService } from '../../services/app-project.service';
import { of } from 'rxjs';
import { Store } from '@ngrx/store';
import { AppState } from '../app.interfaces';
import { ImpProject } from '../../val-modules/targeting/models/ImpProject';
import { ErrorNotification } from '../../messaging';
import { AppExportService } from '../../services/app-export.service';
import { toPayload } from '../../val-modules/common/common.rxjs';
import { CreateGaugeMetric } from '../usage/usage.actions';
import { TargetAudienceService } from '../../services/target-audience.service';
import { AppStateService } from '../../services/app-state.service';
import { AppTradeAreaService } from '../../services/app-trade-area.service';

@Injectable({ providedIn: 'root' })
export class DataShimEffects {

  @Effect()
  projectSaveAndLoad$ = this.actions$.pipe(
    ofType<ProjectSaveAndLoad>(DataShimActionTypes.ProjectSaveAndLoad),
    filter(() => this.appProjectService.projectIsValid()),
    mergeMap(action => this.appProjectService.save().pipe(
                              tap(projectId => this.store$.dispatch(new ProjectSaveSuccess({ projectId }))),
                              map(() => action))),
    map(action => new ProjectLoad({ projectId: action.payload.idToLoad, isReload: false })),
    catchError(err => of(new ProjectSaveFailure({ err }))),
  );

  @Effect()
  projectSave$ = this.actions$.pipe(
    ofType<ProjectSave>(DataShimActionTypes.ProjectSave),
    filter(() => this.appProjectService.projectIsValid()),
    mergeMap(action => this.appProjectService.save().pipe(map(id => [action, id]))),
    map(([action, projectId]: [ProjectSave, number]) => {
      if (action.payload.reloadAfter) {
        return new ProjectLoad({ projectId, isReload: true });
      } else {
        return new ProjectSaveSuccess({ projectId });
      }
    }),
    catchError(err => of(new ProjectSaveFailure({ err })))
  );

  @Effect()
  projectLoad$ = this.actions$.pipe(
    ofType<ProjectLoad>(DataShimActionTypes.ProjectLoad),
    tap(() => this.audienceService.clearAll()),
    mergeMap(action => this.appProjectService.load(action.payload.projectId).pipe(map(id => [action, id]))),
    // these are temporary until we get more stuff under ngrx
    tap(() => this.audienceService.applyAudienceSelection()),
    tap(() => this.appStateService.clearUserInterface()),
    tap(() => this.appTradeAreaService.zoomToTradeArea()),
    map(([action, projectId]: [ProjectLoad, number]) =>
      action.payload.isReload ? new ProjectSaveSuccess({projectId}) : new ProjectLoadSuccess({ projectId })),
    catchError(err => of(new ProjectLoadFailure({ err })))
  );

  @Effect()
  projectSaveAndCreateNew$ = this.actions$.pipe(
    ofType(DataShimActionTypes.ProjectSaveAndNew),
    filter(() => this.appProjectService.projectIsValid()),
    mergeMap(() => this.appProjectService.save().pipe(tap(projectId => this.store$.dispatch(new ProjectSaveSuccess({ projectId }))))),
    map(() => new CreateNewProject()),
    catchError(err => of(new ProjectSaveFailure({ err }))),
  );

  @Effect()
  createNewProject$ = this.actions$.pipe(
    ofType(DataShimActionTypes.ProjectCreateNew),
    tap(() => this.audienceService.clearAll()),
    tap(() => this.appProjectService.createNew()),
    tap(() => this.appStateService.clearUserInterface()),
    map(() => new CreateNewProjectComplete())
  );

  @Effect()
  exportGeofootprint$ = this.actions$.pipe(
    ofType<ExportGeofootprint>(DataShimActionTypes.ExportGeofootprint),
    toPayload(),
    filter(p => this.validateProjectForExport(p.currentProject, 'exporting a Geofootprint')),
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
    filter(p => this.validateProjectForExport(p.currentProject, 'sending the custom site list to Valassis Digital')),
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
              private appExportService: AppExportService,
              private appProjectService: AppProjectService,
              private appStateService: AppStateService,
              private appTradeAreaService: AppTradeAreaService,
              private audienceService: TargetAudienceService) {}

  private validateProjectForExport(currentProject: ImpProject, exportDescription: string) : boolean {
    const message = `The project must be saved with a valid Project Tracker ID before ${exportDescription}`;
    if (currentProject.projectId == null || currentProject.projectTrackerId == null) {
      this.store$.dispatch(new ErrorNotification({ message, notificationTitle: 'Export Error' }));
      return false;
    }
    return true;
  }
}
