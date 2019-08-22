import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { CloseExistingProjectDialog, DiscardThenLoadProject, ExportGeofootprint, ExportLocations, MenuActionTypes, SaveThenLoadProject, PrintActionTypes, PrintMapSuccess, ClosePrintViewDialog} from './menu.actions';
import { concatMap, filter, map, withLatestFrom, tap, switchMap, catchError } from 'rxjs/operators';
import * as fromDataShims from '../data-shim/data-shim.actions';
import { ImpClientLocationTypeCodes } from '../../val-modules/targeting/targeting.enums';
import { CreateProjectUsageMetric } from '../usage/targeting-usage.actions';
import { ClearAllNotifications, AppState, ErrorNotification, SuccessNotification, StopBusyIndicator, StartBusyIndicator } from '@val/messaging';
import { AppDataShimService } from '../../services/app-data-shim.service';
import { SetPrintRenderer, PrintMap, EsriMapActionTypes, PrintJobComplete, DeletePrintRenderer, PrintMapFailure } from '@val/esri';
import { AppStateService } from 'app/services/app-state.service';
import { AppConfig } from 'app/app.config';
import { Store } from '@ngrx/store';
import { AppExportService } from 'app/services/app-export.service';
import { of } from 'rxjs';


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

  @Effect()
  exportMap$ = this.actions$.pipe(
    ofType(MenuActionTypes.OpenPrintViewDialog),
    withLatestFrom(this.stateService.analysisLevel$, this.stateService.uniqueSelectedGeocodes$),
    filter(([, analysisLevel, geos]) => (analysisLevel != null && analysisLevel.length > 0) || (geos != null && geos.length > 0)),
    map(([, analysisLevel, geos]) => {
      const portalId = this.config.getLayerIdForAnalysisLevel(analysisLevel, true);
     return new SetPrintRenderer({geos, portalId, minScale: undefined});
    }),
    );
  
  @Effect({dispatch: false})
  showBusySpinner$ = this.actions$.pipe(
    ofType<PrintMap>(EsriMapActionTypes.PrintMap),
    tap(() => this.store$.dispatch(new StartBusyIndicator({ key: 'Map Book', message: 'Generating map book' }))),
  );

  @Effect({dispatch: false})
  handlePrintSuccess$ = this.actions$.pipe(
     ofType<PrintMapSuccess>(PrintActionTypes.PrintMapSuccess),
      tap(action =>  this.exportService.downloadPDF(action.payload.url)),
      tap(() => this.store$.dispatch(new SuccessNotification({message: 'The Current View PDF was generated successfully in a new tab' })))
   );

  @Effect()
  handlePrintError$ = this.actions$.pipe(
     ofType<PrintMapFailure>(EsriMapActionTypes.PrintMapFailure),
     concatMap((action) => [
      new DeletePrintRenderer({layerName: 'Selected Geos'}),
      new StopBusyIndicator({ key: 'Map Book'}),
      new ClosePrintViewDialog(),
      new ErrorNotification({message: 'There was an error generating current view map book' })
     ])
  );

   @Effect({dispatch: false})
   handlePrintComplete$ = this.actions$.pipe(
     ofType<PrintJobComplete>(EsriMapActionTypes.PrintJobComplete),
     tap((action) => {
       this.store$.dispatch(new StopBusyIndicator({ key: 'Map Book'}));
       this.store$.dispatch(new ClosePrintViewDialog());
       this.store$.dispatch(new PrintMapSuccess({url: action.payload.result}));
     })
  );

  constructor(private actions$: Actions,
              private dataShimService: AppDataShimService,
              private stateService: AppStateService,
              private exportService: AppExportService,
              private config: AppConfig,
              private store$: Store<AppState>,
              ) {}
}
