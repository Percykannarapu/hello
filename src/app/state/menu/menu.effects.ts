import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { CloseExistingProjectDialog, DiscardThenLoadProject, ExportGeofootprint, ExportLocations, MenuActionTypes, SaveThenLoadProject } from './menu.actions';
import { concatMap, map, mergeMap, withLatestFrom } from 'rxjs/operators';
import * as fromDataShims from '../data-shim/data-shim.actions';
import { AppStateService } from '../../services/app-state.service';
import { ImpClientLocationTypeCodes } from '../../val-modules/targeting/targeting.enums';
import { CreateProjectUsageMetric } from '../usage/targeting-usage.actions';

@Injectable({
  providedIn: 'root'
})
export class MenuEffects {

  @Effect()
  saveAndReload$ = this.actions$.pipe(
    ofType(MenuActionTypes.SaveAndReloadProject),
    map(() => new fromDataShims.ProjectSaveAndReload())
  );

  @Effect()
  saveAndCreateNew$ = this.actions$.pipe(
    ofType(MenuActionTypes.SaveAndCreateNew),
    concatMap(() => [
      new CreateProjectUsageMetric('project', 'new', 'SaveExisting=Yes'),
      new fromDataShims.ProjectSaveAndNew(),
    ])
  );

  @Effect()
  discardAndCreateNew$ = this.actions$.pipe(
    ofType(MenuActionTypes.DiscardAndCreateNew),
    concatMap(() => [
      new CreateProjectUsageMetric('project', 'new', 'SaveExisting=No'),
      new fromDataShims.CreateNewProject(),
    ])
  );

  @Effect()
  saveThenLoad$ = this.actions$.pipe(
    ofType<SaveThenLoadProject>(MenuActionTypes.SaveThenLoadProject),
    mergeMap(action => [
      new fromDataShims.ProjectSaveAndLoad({ idToLoad: action.payload.projectToLoad }),
      new CloseExistingProjectDialog()
    ])
  );

  @Effect()
  discardThenLoad$ = this.actions$.pipe(
    ofType<DiscardThenLoadProject>(MenuActionTypes.DiscardThenLoadProject),
    mergeMap(action => [
      new fromDataShims.ProjectLoad({ projectId: action.payload.projectToLoad }),
      new CloseExistingProjectDialog()
    ])
  );

  @Effect()
  exportGeofootprint$ = this.actions$.pipe(
    ofType<ExportGeofootprint>(MenuActionTypes.ExportGeofootprint),
    withLatestFrom(this.appStateService.currentProject$),
    map(([action, currentProject]) => new fromDataShims.ExportGeofootprint({ selectedOnly: action.payload.selectedOnly, currentProject }))
  );

  @Effect()
  exportLocations$ = this.actions$.pipe(
    ofType<ExportLocations>(MenuActionTypes.ExportLocations),
    withLatestFrom(this.appStateService.currentProject$),
    map(([action, currentProject]) => new fromDataShims.ExportLocations({ locationType: action.payload.locationType, currentProject, isDigitalExport: false }))
  );

  @Effect()
  exportDigital$ = this.actions$.pipe(
    ofType(MenuActionTypes.ExportToValassisDigital),
    withLatestFrom(this.appStateService.currentProject$),
    map(([action, currentProject]) => new fromDataShims.ExportLocations({ locationType: ImpClientLocationTypeCodes.Site, currentProject, isDigitalExport: true }))
  );

  @Effect()
  exportNational$ = this.actions$.pipe(
    ofType(MenuActionTypes.ExportApioNationalData),
    withLatestFrom(this.appStateService.currentProject$),
    map(([action, currentProject]) => new fromDataShims.ExportApioNationalData({ currentProject }))
  );

  constructor(private actions$: Actions,
              private appStateService: AppStateService) {}
}
