import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { AppState, ClearAllNotifications } from '@val/messaging';
import { AppConfig } from 'app/app.config';
import { AppExportService } from 'app/services/app-export.service';
import { AppStateService } from 'app/services/app-state.service';
import { concatMap, filter, map, withLatestFrom } from 'rxjs/operators';
import { ImpClientLocationTypeCodes } from '../../../worker-shared/data-model/impower.data-model.enums';
import { AppDataShimService } from '../../services/app-data-shim.service';
import * as fromDataShims from '../data-shim/data-shim.actions';
import { CreateProjectUsageMetric } from '../usage/targeting-usage.actions';
import {
  CloseExistingProjectDialog,
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
    filter(([action, project]) => this.dataShimService.validateProject(project)),
    concatMap(() => [
      new ClearAllNotifications(),
      new CreateProjectUsageMetric('project', 'new', 'SaveExisting=Yes'),
      new fromDataShims.ProjectSaveAndNew(),
    ]),
  );

  @Effect()
  discardAndCreateNew$ = this.actions$.pipe(
    ofType(MenuActionTypes.DiscardAndCreateNew),
    concatMap(() => [
      new ClearAllNotifications(),
      new CreateProjectUsageMetric('project', 'new', 'SaveExisting=No'),
      new fromDataShims.CreateNewProject(),
    ])
  );

  @Effect()
  saveAndReload$ = this.actions$.pipe(
    ofType(MenuActionTypes.SaveAndReloadProject),
    withLatestFrom(this.dataShimService.currentProject$),
    filter(([action, project]) => this.dataShimService.validateProject(project)),
    concatMap(() => [
      new ClearAllNotifications(),
      new fromDataShims.ProjectSave(),
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
    ]),
);

  @Effect()
  discardThenLoad$ = this.actions$.pipe(
    ofType<DiscardThenLoadProject>(MenuActionTypes.DiscardThenLoadProject),
    concatMap(action => [
      new ClearAllNotifications(),
      new fromDataShims.ProjectLoad({ projectId: action.payload.projectToLoad }),
      new CloseExistingProjectDialog(),
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


  // @Effect({dispatch: false})
  // showBusySpinner$ = this.actions$.pipe(
  //   ofType<PrintMap>(EsriMapActionTypes.PrintMap),
  //   tap(() => this.store$.dispatch(new StartBusyIndicator({ key: 'Map Book', message: 'Generating map book' }))),
  // );
  //
  // @Effect({dispatch: false})
  // handlePrintSuccess$ = this.actions$.pipe(
  //    ofType<PrintMapSuccess>(PrintActionTypes.PrintMapSuccess),
  //     tap(action =>  this.exportService.downloadPDF(action.payload.url)),
  //     tap(() => this.store$.dispatch(new SuccessNotification({message: 'The Current View PDF was generated successfully in a new tab' })))
  //  );
  //
  // @Effect()
  // handlePrintError$ = this.actions$.pipe(
  //    ofType<PrintMapFailure>(EsriMapActionTypes.PrintMapFailure),
  //    withLatestFrom(this.stateService.analysisLevel$),
  //    filter((analysisLevel) => (analysisLevel != null && analysisLevel.length > 0)),
  //    concatMap(([action, analysisLevel]) => [
  //     new StopBusyIndicator({ key: 'Map Book'}),
  //     new ClosePrintViewDialog(),
  //     new ErrorNotification({message: 'There was an error generating current view map book' })
  //    ])
  // );
  //
  //  @Effect({dispatch: false})
  //  handlePrintComplete$ = this.actions$.pipe(
  //    ofType<PrintJobComplete>(EsriMapActionTypes.PrintJobComplete),
  //    withLatestFrom(this.stateService.analysisLevel$),
  //    tap(([action, analysisLevel]) => {
  //      this.store$.dispatch(new StopBusyIndicator({ key: 'Map Book'}));
  //      this.store$.dispatch(new ClosePrintViewDialog());
  //      this.store$.dispatch(new PrintMapSuccess({url: action.payload.result}));
  //    })
  // );

  constructor(private actions$: Actions,
              private dataShimService: AppDataShimService,
              private stateService: AppStateService,
              private exportService: AppExportService,
              private config: AppConfig,
              private store$: Store<AppState>,
              ) {}
}
