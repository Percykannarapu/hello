import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { ResetMapState } from '@val/esri';
import { of } from 'rxjs';
import { catchError, concatMap, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { GeoAttributeActionTypes, RehydrateAttributesComplete, RequestAttributesComplete } from '../../impower-datastore/state/transient/geo-attributes/geo-attributes.actions';
import { selectGeoAttributeEntities } from 'app/impower-datastore/state/transient/geo-attributes/geo-attributes.selectors';
import { AppDataShimService } from '../../services/app-data-shim.service';
import { FullAppState } from '../app.interfaces';
import { getBatchMode } from '../batch-map/batch-map.selectors';
import { CalculateMetrics, CreateNewProject, CreateNewProjectComplete, DataShimActionTypes, FiltersChanged,
  ProjectLoad, ProjectLoadFailure, ProjectLoadSuccess, ProjectSaveAndLoad, ProjectSaveFailure, ProjectSaveSuccess, ProjectLoadFinish, IsProjectReload, TradeAreaRollDownGeos } from './data-shim.actions';
import { RehydrateAfterLoad } from 'app/impower-datastore/state/transient/transient.actions';
import { AppTradeAreaService } from 'app/services/app-trade-area.service';

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
      catchError(err => of(new ProjectSaveFailure({ err, isReload: false })))
    )),
  );

  @Effect()
  projectSaveAndReload$ = this.actions$.pipe(
    ofType(DataShimActionTypes.ProjectSaveAndReload),
    switchMap(() => this.appDataShimService.save().pipe(
      map(projectId => new ProjectLoad({ projectId, isReload: true })),
      catchError(err => of(new ProjectSaveFailure({ err, isReload: true })))
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
      catchError(err => of(new ProjectSaveFailure({ err, isReload: false }))),
    ))
  );

  @Effect()
  projectLoad$ = this.actions$.pipe(
    ofType<ProjectLoad>(DataShimActionTypes.ProjectLoad),
    switchMap(action => this.appDataShimService.load(action.payload.projectId).pipe(
      withLatestFrom(this.appDataShimService.currentGeocodeSet$, this.store$.select(getBatchMode)),
      map(([, geocodes, isBatch]) => isBatch
        ? new ProjectLoadSuccess(action.payload)
        : new RehydrateAfterLoad({ ...action.payload, geocodes })),
      catchError(err => of(new ProjectLoadFailure({ err, isReload: false }))),
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
    ofType<RequestAttributesComplete>(GeoAttributeActionTypes.RequestAttributesComplete),
    withLatestFrom(this.store$.pipe(select(selectGeoAttributeEntities)), this.appDataShimService.currentGeos$, this.appDataShimService.currentProject$),
    tap(([a, attrs, geos, project]) => this.appDataShimService.prepGeoFields(geos, attrs, project)),
    map(([action]) => new FiltersChanged({ filterChanged: null, filterFlag: action.payload.flag }))
  );

  @Effect()
  rehydrateSuccess$ = this.actions$.pipe(
    ofType<RehydrateAttributesComplete>(GeoAttributeActionTypes.RehydrateAttributesComplete),
    withLatestFrom(this.store$.pipe(select(selectGeoAttributeEntities)), this.appDataShimService.currentGeos$, this.appDataShimService.currentProject$),
    tap(([a, attrs, geos, project]) => this.appDataShimService.prepGeoFields(geos, attrs, project)),
    concatMap(([action]) => [new CalculateMetrics(), new ProjectLoadSuccess(action.payload)])
  );

  @Effect()
  loadSuccess$ = this.actions$.pipe(
    ofType(DataShimActionTypes.ProjectLoadSuccess),
    withLatestFrom(this.store$.select(getBatchMode)),
    tap(([, isBatch]) => this.appDataShimService.onLoadSuccess(isBatch)),
    map(() => new ProjectLoadFinish())
  );

  @Effect({ dispatch: false })
  ProjectLoadFinish$ = this.actions$.pipe(
    ofType(DataShimActionTypes.ProjectLoadFinish),
    tap(() => this.appDataShimService.onLoadFinished())
  );

  filterableGeos$ = this.appDataShimService.currentGeos$.pipe(
    withLatestFrom(this.appDataShimService.currentMustCovers$),
    map(([geos, mustCovers]) => geos.filter(g => !mustCovers.has(g.geocode)))
  );

  @Effect()
  filtersChanged$ = this.actions$.pipe(
    ofType<FiltersChanged>(DataShimActionTypes.FiltersChanged),
    withLatestFrom(this.filterableGeos$, this.store$.pipe(select(selectGeoAttributeEntities)), this.appDataShimService.currentProject$),
    tap(([action, geos, attributes, project]) => {
      if (!action.payload.filterFlag) this.appDataShimService.filterGeos(geos, attributes, project, action.payload.filterChanged);
      }),
    map(() => new CalculateMetrics())
  );

  @Effect({ dispatch: false })
  calculateMetrics$ = this.actions$.pipe(
    ofType(DataShimActionTypes.CalculateMetrics),
    withLatestFrom(this.appDataShimService.currentActiveGeocodeSet$, this.store$.pipe(select(selectGeoAttributeEntities)), this.appDataShimService.currentProject$),
    tap(([a, geocodes, attrs, project]) => this.appDataShimService.calcMetrics(Array.from(geocodes), attrs, project))
  );

  @Effect({dispatch: false})
  isProjectReload$ = this.actions$.pipe(
    ofType<IsProjectReload>(DataShimActionTypes.IsProjectReload),
    map(action => this.appDataShimService.isProjectReload(action.payload.isReload))
  );

  @Effect({dispatch: false})
  tradeAreaRollDownGeos$ = this.actions$.pipe(
    ofType<TradeAreaRollDownGeos>(DataShimActionTypes.TradeAreaRollDownGeos),
    switchMap(action => this.appTradeService.rollDownService(action.payload.geos, action.payload.fileAnalysisLevel).pipe(
      map(response => this.appTradeService.validateRolldownGeos(response, action.payload.queryResult, action.payload.matchedTradeAreas, action.payload.fileAnalysisLevel)),
      map(result => this.appTradeService.persistRolldownTAGeos(result.payload, result.failedGeos))
    ))
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
              private appTradeService: AppTradeAreaService) {}
}
