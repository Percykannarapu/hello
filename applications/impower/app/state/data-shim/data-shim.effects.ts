import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { ResetMapState } from '@val/esri';
import { of } from 'rxjs';
import { catchError, concatMap, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { GeoAttributeActionTypes, RehydrateAttributes, RehydrateAttributesComplete } from '../../impower-datastore/state/geo-attributes/geo-attributes.actions';
import { selectGeoAttributeEntities } from '../../impower-datastore/state/impower-datastore.selectors';
import { AppDataShimService } from '../../services/app-data-shim.service';
import { ImpGeofootprintGeo } from '../../val-modules/targeting/models/ImpGeofootprintGeo';
import { TradeAreaTypeCodes } from '../../val-modules/targeting/targeting.enums';
import { FullAppState } from '../app.interfaces';
import {
  CalculateMetrics,
  CreateNewProject,
  CreateNewProjectComplete,
  DataShimActionTypes,
  FiltersChanged,
  ProjectLoad,
  ProjectLoadFailure,
  ProjectLoadSuccess,
  ProjectSaveAndLoad,
  ProjectSaveFailure,
  ProjectSaveSuccess
} from './data-shim.actions';

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
      withLatestFrom(this.appDataShimService.currentGeocodeSet$),
      map(([projectId, geocodes]) => new RehydrateAttributes({ ...action.payload, geocodes })),
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
    ofType(GeoAttributeActionTypes.RequestAttributesComplete),
    withLatestFrom(this.store$.pipe(select(selectGeoAttributeEntities)), this.appDataShimService.currentGeos$, this.appDataShimService.currentProject$),
    tap(([a, attrs, geos, project]) => this.appDataShimService.prepGeoFields(geos, attrs, project)),
    map(() => new FiltersChanged({ filterChanged: null }))
  );

  @Effect()
  rehydrateSuccess$ = this.actions$.pipe(
    ofType<RehydrateAttributesComplete>(GeoAttributeActionTypes.RehydrateAttributesComplete),
    withLatestFrom(this.store$.pipe(select(selectGeoAttributeEntities)), this.appDataShimService.currentGeos$, this.appDataShimService.currentProject$),
    tap(([a, attrs, geos, project]) => this.appDataShimService.prepGeoFields(geos, attrs, project)),
    concatMap(([action]) => [new CalculateMetrics(), new ProjectLoadSuccess(action.payload)])
  );

  @Effect({ dispatch: false })
  loadSuccess$ = this.actions$.pipe(
    ofType(DataShimActionTypes.ProjectLoadSuccess),
    tap(() => this.appDataShimService.onLoadSuccess())
  );

  tradeAreasToFilter: Set<TradeAreaTypeCodes> = new Set([ TradeAreaTypeCodes.Radius, TradeAreaTypeCodes.Audience ]);

  @Effect()
  filtersChanged$ = this.actions$.pipe(
    ofType<FiltersChanged>(DataShimActionTypes.FiltersChanged),
    withLatestFrom(this.appDataShimService.currentGeos$, this.appDataShimService.currentHomeGeocodes$, this.appDataShimService.currentMustCovers$),
    map(([a, geos, homeGeos, mustCovers]) => [a, geos.filter(g => this.tradeAreasToFilter.has(TradeAreaTypeCodes.parse(g.impGeofootprintTradeArea.taType)) && !homeGeos.has(g.geocode) && !mustCovers.has(g.geocode))] as [ FiltersChanged, ImpGeofootprintGeo[]]),
    withLatestFrom(this.store$.pipe(select(selectGeoAttributeEntities)), this.appDataShimService.currentProject$),
    tap(([[action, geos], attributes, project]) => this.appDataShimService.filterGeos(geos, attributes, project, action.payload.filterChanged)),
    map(() => new CalculateMetrics())
  );

  @Effect({ dispatch: false })
  calculateMetrics$ = this.actions$.pipe(
    ofType(DataShimActionTypes.CalculateMetrics),
    withLatestFrom(this.appDataShimService.currentActiveGeocodeSet$, this.store$.pipe(select(selectGeoAttributeEntities)), this.appDataShimService.currentProject$),
    tap(([a, geocodes, attrs, project]) => this.appDataShimService.calcMetrics(Array.from(geocodes), attrs, project))
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
              private appDataShimService: AppDataShimService) {}
}
