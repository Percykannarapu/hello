import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { ResetMapState } from '@val/esri';
import { getMapVarEntities } from 'app/impower-datastore/state/transient/map-vars/map-vars.selectors';
import { ClearMetricVars, FetchMetricVarsComplete, MetricVarActionTypes } from 'app/impower-datastore/state/transient/metric-vars/metric-vars.action';
import { getMetricVarEntities, getMetricVars, metricVarSlice } from 'app/impower-datastore/state/transient/metric-vars/metric-vars.selectors';
import { geoTransactionId } from 'app/impower-datastore/state/transient/transactions/transactions.reducer';
import { of } from 'rxjs';
import { catchError, concatMap, map, mergeMap, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { LoggingService } from '../../../../../modules/esri/src/services/logging.service';
import {
  GeoAttributeActionTypes,
  GetLayerAttributesComplete,
  ProcessGeoAttributes
} from '../../impower-datastore/state/transient/geo-attributes/geo-attributes.actions';
import { selectGeoAttributeEntities } from '../../impower-datastore/state/transient/geo-attributes/geo-attributes.selectors';
import { AppDataShimService } from '../../services/app-data-shim.service';
import { AppTradeAreaService } from '../../services/app-trade-area.service';
import { FullAppState } from '../app.interfaces';
import { getBatchMode } from '../batch-map/batch-map.selectors';
import {
  CalculateMetrics,
  CreateNewProject,
  CreateNewProjectComplete,
  DataShimActionTypes,
  FiltersChanged,
  MustCoverRollDownGeos,
  ProcessMetrics,
  ProjectLoad,
  ProjectLoadFailure,
  ProjectLoadFinish,
  ProjectLoadSuccess,
  ProjectSaveAndLoad,
  ProjectSaveFailure,
  ProjectSaveSuccess,
  RollDownGeosComplete,
  TradeAreaRollDownGeos
} from './data-shim.actions';
import { projectIsLoaded } from './data-shim.selectors';

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
  projectSave$ = this.actions$.pipe(
    ofType(DataShimActionTypes.ProjectSave),
    switchMap(() => this.appDataShimService.save().pipe(
      tap(projectId => this.appDataShimService.updateProjectWithId(projectId)),
      concatMap(projectId => [
        new ProjectSaveSuccess({ projectId })
      ]),
      catchError(err => of(new ProjectSaveFailure({ err })))
    ))
  );

  @Effect()
  projectSaveAndLoad$ = this.actions$.pipe(
    ofType<ProjectSaveAndLoad>(DataShimActionTypes.ProjectSaveAndLoad),
    switchMap(action => this.appDataShimService.save().pipe(
      concatMap(resultId => [
        new ProjectSaveSuccess({ projectId: resultId }),
        new ProjectLoad({ projectId: action.payload.projectId })
      ]),
      catchError(err => of(new ProjectSaveFailure({ err }))),
    ))
  );

  @Effect()
  projectLoad$ = this.actions$.pipe(
    ofType<ProjectLoad>(DataShimActionTypes.ProjectLoad),
    switchMap(action => this.appDataShimService.load(action.payload.projectId).pipe(
      map(() => new ProjectLoadSuccess({ projectId: action.payload.projectId })),
      catchError(err => of(new ProjectLoadFailure({ err }))),
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
    map(() => new ResetMapState())
  );

  @Effect()
  requestSuccess$ = this.actions$.pipe(
    ofType<GetLayerAttributesComplete>(GeoAttributeActionTypes.GetLayerAttributesComplete),
    map(() => new ProcessGeoAttributes())
  );

  @Effect()
  processGeoAttributes$ = this.actions$.pipe(
    ofType<ProcessGeoAttributes>(GeoAttributeActionTypes.ProcessGeoAttributes),
    withLatestFrom(this.store$.pipe(select(projectIsLoaded)), this.store$.pipe(select(getMetricVarEntities)), this.appDataShimService.currentGeos$, this.appDataShimService.currentProject$),
    tap(([, isLoaded, attrs, geos, project]) => {
      this.appDataShimService.prepGeoFields(geos, attrs, project);
      if (isLoaded) {
        this.appDataShimService.filterGeos(geos, attrs, project);
      }
    }),
    map(() => new CalculateMetrics())
  );

  @Effect()
  loadSuccess$ = this.actions$.pipe(
    ofType(DataShimActionTypes.ProjectLoadSuccess),
    withLatestFrom(this.store$.select(getBatchMode)),
    tap(([, isBatch]) => this.appDataShimService.onLoadSuccess(isBatch)),
    map(() => new ProjectLoadFinish())
  );

  filterableGeos$ = this.appDataShimService.currentGeos$.pipe(
    withLatestFrom(this.appDataShimService.currentMustCovers$),
    map(([geos, mustCovers]) => geos.filter(g => !mustCovers.has(g.geocode)))
  );

  @Effect()
  filtersChanged$ = this.actions$.pipe(
    ofType<FiltersChanged>(DataShimActionTypes.FiltersChanged),
    withLatestFrom(this.filterableGeos$, this.store$.select(getMetricVarEntities), this.appDataShimService.currentProject$),
    tap(([action, geos, attributes, project]) => {
      if (!action.payload.filterFlag) this.appDataShimService.filterGeos(geos, attributes, project, action.payload.filterChanged);
      }),
    map(() => new CalculateMetrics())
  );

  @Effect({dispatch: false})
  calculateMetrics$ = this.actions$.pipe(
    ofType(DataShimActionTypes.CalculateMetrics),
    withLatestFrom(this.appDataShimService.currentActiveGeocodeSet$, this.appDataShimService.currentProject$),
    switchMap(([, , project]) => this.appDataShimService.getAudience()),
    switchMap(audience => this.appDataShimService.getAudienceVariables(audience)),
    map(metricVars =>  this.appDataShimService.fetchMatricVars(metricVars) ));

  @Effect({dispatch: false})
  processMetrics$ = this.actions$.pipe(
    ofType(DataShimActionTypes.ProcessMetrics),
    withLatestFrom(this.store$.pipe(select(getMetricVarEntities)), this.appDataShimService.currentActiveGeocodeSet$, this.appDataShimService.currentProject$),
    tap(([, metricVars, geocodes, project]) => this.appDataShimService.calcMetrics(Array.from(geocodes), metricVars, project)),
  );

  @Effect()
  metricVarsRequestSuccess$ = this.actions$.pipe(
    ofType<FetchMetricVarsComplete>(MetricVarActionTypes.FetchMetricVarsComplete),
    map(() => new ProcessMetrics())
  );

  @Effect()
  tradeAreaRollDownGeos$ = this.actions$.pipe(
    ofType<TradeAreaRollDownGeos>(DataShimActionTypes.TradeAreaRollDownGeos),
    switchMap(action => this.appTradeService.rollDownService(action.payload.geos, action.payload.fileAnalysisLevel).pipe(
      map(response => this.appTradeService.validateRolldownGeos(response, action.payload.queryResult, action.payload.matchedTradeAreas, action.payload.fileAnalysisLevel)),
      map(result => this.appTradeService.persistRolldownTAGeos(result.payload, result.failedGeos, action.payload.siteType)),
      map(failedGeos => new RollDownGeosComplete({failedGeos : failedGeos, isResubmit: action.payload.isResubmit, rollDownType: 'TRADEAREA'}))
    ))
  );

  @Effect()
  mustCoverRollDownGeos$ = this.actions$.pipe(
    ofType<MustCoverRollDownGeos>(DataShimActionTypes.MustCoverRollDownGeos),
    switchMap(action => this.appTradeService.rollDownService(action.payload.geos, action.payload.fileAnalysisLevel).pipe(
      map(response => this.appTradeService.validateRolldownGeos(response, action.payload.queryResult, action.payload.uploadedGeos, action.payload.fileAnalysisLevel)),
      map(result => this.appDataShimService.persistMustCoverRollDownGeos(result.payload, action.payload.fileName, result.failedGeos)),
      map(failedGeos => new RollDownGeosComplete({failedGeos : failedGeos, isResubmit: action.payload.isResubmit, rollDownType: 'MUSTCOVER'}))
    ))
  );

  @Effect({dispatch: false})
  mustCoverRollDownGeosComplete$ = this.actions$.pipe(
    ofType<RollDownGeosComplete>(DataShimActionTypes.RollDownGeosComplete),
    map(action => this.appDataShimService.rollDownComplete(action.payload.isResubmit, action.payload.failedGeos, action.payload.rollDownType))
  );

  // These are for the NgRx store
  // @Effect()
  // loadSecondaryStore$ = this.actions$.pipe(
  //   ofType<ProjectLoad>(DataShimActionTypes.ProjectLoad),
  //   map(action => new LoadEntitiesFromServer({ projectId: action.payload.projectId }))
  // );
  //
  // @Effect()
  // newSecondaryStore$ = this.actions$.pipe(
  //   ofType(DataShimActionTypes.ProjectCreateNew),
  //   map(() => new CreateNewEntities())
  // );

  constructor(private actions$: Actions,
              private store$: Store<FullAppState>,
              private appDataShimService: AppDataShimService,
              private appTradeService: AppTradeAreaService,
              private logger: LoggingService) {}
}
