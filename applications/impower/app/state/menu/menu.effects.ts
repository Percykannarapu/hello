import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { concatMap, filter, map, withLatestFrom } from 'rxjs/operators';
import { ImpClientLocationTypeCodes } from '../../../worker-shared/data-model/impower.data-model.enums';
import { AppDataShimService } from '../../services/app-data-shim.service';
import * as fromDataShims from '../data-shim/data-shim.actions';
import { CreateProjectUsageMetric } from '../usage/targeting-usage.actions';
import {
  DiscardThenLoadProject,
  ExportGeofootprint,
  ExportLocations,
  MenuActionTypes,
  SaveThenLoadProject
} from './menu.actions';

@Injectable({
  providedIn: 'root'
})
export class MenuEffects {

  @Effect()
  saveAndCreateNew$ = this.actions$.pipe(
    ofType(MenuActionTypes.SaveAndCreateNew),
    withLatestFrom(this.dataShimService.currentProject$),
    filter(([, project]) => this.dataShimService.validateProject(project)),
    concatMap(() => [
      new CreateProjectUsageMetric('project', 'new', 'SaveExisting=Yes'),
      new fromDataShims.ProjectSaveAndNew(),
    ]),
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
  saveAndReload$ = this.actions$.pipe(
    ofType(MenuActionTypes.SaveAndReloadProject),
    withLatestFrom(this.dataShimService.currentProject$),
    filter(([, project]) => this.dataShimService.validateProject(project)),
    map(() => new fromDataShims.ProjectSave())
  );

  @Effect()
  saveThenLoad$ = this.actions$.pipe(
    ofType<SaveThenLoadProject>(MenuActionTypes.SaveThenLoadProject),
    withLatestFrom(this.dataShimService.currentProject$),
    filter(([, project]) => this.dataShimService.validateProject(project)),
    map((([action]) => new fromDataShims.ProjectSaveAndLoad({ projectId: action.payload.projectToLoad })))
  );

  @Effect()
  discardThenLoad$ = this.actions$.pipe(
    ofType<DiscardThenLoadProject>(MenuActionTypes.DiscardThenLoadProject),
    concatMap(action => [
      new fromDataShims.ProjectLoad({ projectId: action.payload.projectToLoad }),
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
              private dataShimService: AppDataShimService,
              ) {}
}
