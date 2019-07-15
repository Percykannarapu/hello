import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { CloseExistingProjectDialog, DiscardThenLoadProject, ExportGeofootprint, ExportLocations, MenuActionTypes, SaveThenLoadProject } from './menu.actions';
import { concatMap, filter, map, withLatestFrom } from 'rxjs/operators';
import * as fromDataShims from '../data-shim/data-shim.actions';
import { ImpClientLocationTypeCodes } from '../../val-modules/targeting/targeting.enums';
import { CreateProjectUsageMetric } from '../usage/targeting-usage.actions';
import { ClearAllNotifications } from '@val/messaging';
import { AppDataShimService } from '../../services/app-data-shim.service';

@Injectable({
  providedIn: 'root'
})
export class MenuEffects {

  @Effect()
  saveAndCreateNew$ = this.actions$.pipe(
    ofType(MenuActionTypes.SaveAndCreateNew),
    withLatestFrom(this.dataShimService.currentProject$),
    filter(([action, project]) => this.dataShimService.validateProject(project)),
    concatMap(() => [
      new ClearAllNotifications(),
      new CreateProjectUsageMetric('project', 'new', 'SaveExisting=Yes'),
      new fromDataShims.ProjectSaveAndNew(),
      new fromDataShims.IsProjectReload({isReload: false})
    ]),
  );

  @Effect()
  discardAndCreateNew$ = this.actions$.pipe(
    ofType(MenuActionTypes.DiscardAndCreateNew),
    concatMap(() => [
      new ClearAllNotifications(),
      new CreateProjectUsageMetric('project', 'new', 'SaveExisting=No'),
      new fromDataShims.CreateNewProject(),
      new fromDataShims.IsProjectReload({isReload: false})
    ])
  );

  @Effect()
  saveAndReload$ = this.actions$.pipe(
    ofType(MenuActionTypes.SaveAndReloadProject),
    withLatestFrom(this.dataShimService.currentProject$),
    filter(([action, project]) => this.dataShimService.validateProject(project)),
    concatMap(() => [
      new ClearAllNotifications(),
      new fromDataShims.ProjectSaveAndReload(),
      new fromDataShims.IsProjectReload({isReload: true})
    ])
  );

  @Effect()
  saveThenLoad$ = this.actions$.pipe(
    ofType<SaveThenLoadProject>(MenuActionTypes.SaveThenLoadProject),
    withLatestFrom(this.dataShimService.currentProject$),
    filter(([action, project]) => this.dataShimService.validateProject(project)),
    concatMap(([action]) => [
      new ClearAllNotifications(),
      new fromDataShims.ProjectSaveAndLoad({ projectId: action.payload.projectToLoad }),
      new CloseExistingProjectDialog(),
      new fromDataShims.IsProjectReload({isReload: false})
    ]),
);

  @Effect()
  discardThenLoad$ = this.actions$.pipe(
    ofType<DiscardThenLoadProject>(MenuActionTypes.DiscardThenLoadProject),
    concatMap(action => [
      new ClearAllNotifications(),
      new fromDataShims.ProjectLoad({ projectId: action.payload.projectToLoad, isReload: false }),
      new CloseExistingProjectDialog(),
      new fromDataShims.IsProjectReload({isReload: false})
    ])
  );

  @Effect()
  exportGeofootprint$ = this.actions$.pipe(
    ofType<ExportGeofootprint>(MenuActionTypes.ExportGeofootprint),
    map(action => new fromDataShims.ExportGeofootprint({ selectedOnly: action.payload.selectedOnly }))
  );

  @Effect()
  exportLocations$ = this.actions$.pipe(
    ofType<ExportLocations>(MenuActionTypes.ExportLocations),
    map(action => new fromDataShims.ExportLocations({ locationType: action.payload.locationType, isDigitalExport: false }))
  );

  @Effect()
  exportDigital$ = this.actions$.pipe(
    ofType(MenuActionTypes.ExportToValassisDigital),
    map(() => new fromDataShims.ExportLocations({ locationType: ImpClientLocationTypeCodes.Site, isDigitalExport: true }))
  );

  @Effect()
  exportNational$ = this.actions$.pipe(
    ofType(MenuActionTypes.ExportApioNationalData),
    map(() => new fromDataShims.ExportApioNationalData())
  );

  constructor(private actions$: Actions,
              private dataShimService: AppDataShimService) {}
}
