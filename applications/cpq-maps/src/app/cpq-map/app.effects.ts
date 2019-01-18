import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { SharedActionTypes, SetAppReady, SetGroupId, EntitiesLoading, RfpUiEditDetailLoaded, RfpUiEditLoaded, RfpUiReviewLoaded, SetActiveMediaPlanId } from './state/shared/shared.actions';
import { tap, filter, switchMap, map, catchError, delay, withLatestFrom, mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { Store } from '@ngrx/store';
import { LocalState, FullState } from './state';
import { MediaPlanGroupLoaderService } from './services/mediaplanGroup-loader-service';
import { ClearSelectedGeos, SetSelectedGeos } from '@val/esri';
import { RfpUiEditDetailLoaderService } from './services/RfpUiEditDetail-loader-service';
import { RfpUiReviewLoaderService } from './services/rfpUiReview-loader-service';
import { AddRfpUiEditDetails, ClearRfpUiEditDetails } from './state/rfpUiEditDetail/rfp-ui-edit-detail.actions';
import { AddRfpUiReviews, ClearRfpUiReviews } from './state/rfpUiReview/rfp-ui-review.actions';
import { RfpUiEditLoaderService } from './services/rfpUiEdit-loader-service';
import { AddRfpUiEdits, ClearRfpUiEdits } from './state/rfpUiEdit/rfp-ui-edit.actions';
import { RfpUiEditDetailState } from './state/rfpUiEditDetail/rfp-ui-edit-detail.reducer';
import { AddMediaPlanGroup, MediaPlanGroupActionTypes, ClearMediaPlanGroups } from './state/mediaPlanGroup/media-plan-group.actions';
import { AppLayerService } from './services/app-layer-service';
import { UniversalCoordinates } from '@val/common';
import { RfpUiEditState } from './state/rfpUiEdit/rfp-ui-edit.reducer';

@Injectable()
export class AppEffects {

  constructor(private actions$: Actions, 
    private store$: Store<LocalState>, 
    private mediaPlanGroupLoader: MediaPlanGroupLoaderService,
    private rfpUiEditDetailLoader: RfpUiEditDetailLoaderService,
    private rfpUiReviewLoader: RfpUiReviewLoaderService,
    private rfpUiEditLoader: RfpUiEditLoaderService,
    private appLayerService: AppLayerService,
    private fullStore$: Store<FullState>) { }

  // When a new active media plan is selected we need to clear the data stores
  // of previous data, we also clear the locations layer on the map to get rid
  // of any locations that may not be the same between media plans
  // we will also unhighlight any geos that might currently be highlighted
  @Effect()
  mediaPlanIdSet$ = this.actions$.pipe(
    ofType<SetActiveMediaPlanId>(SharedActionTypes.SetActiveMediaPlanId),
    filter((action) => action.payload != null),
    tap((action) => this.appLayerService.removeLocationsLayer('Sites', 'Project Sites')),
    tap((action) => this.fullStore$.dispatch(new ClearSelectedGeos())), 
    switchMap((action) => [
      new RfpUiEditLoaded({ rfpUiEditLoaded: false }),
      new RfpUiEditDetailLoaded({ rfpUiEditDetailLoaded: false }),
      new RfpUiReviewLoaded({ rfpUiReviewLoaded: false }),
      new EntitiesLoading({ entitiesLoading: true }),
      new ClearRfpUiEdits(),
      new ClearRfpUiEditDetails,
      new ClearRfpUiReviews
    ])
  );

  // If the media plan group data store is cleared we need to clear out all
  // of the other entity stores and clear the map, just like we do when
  // we change the currently selected media plan
  @Effect()
  mediaPlanGroupCleared = this.actions$.pipe(
    ofType<ClearMediaPlanGroups>(MediaPlanGroupActionTypes.ClearMediaPlanGroups),
    tap((action) => this.appLayerService.removeLocationsLayer('Sites', 'Project Sites')),
    tap((action) => this.fullStore$.dispatch(new ClearSelectedGeos())),
    switchMap((action) => [
      new RfpUiEditLoaded({ rfpUiEditLoaded: false }),
      new RfpUiEditDetailLoaded({ rfpUiEditDetailLoaded: false }),
      new RfpUiReviewLoaded({ rfpUiReviewLoaded: false }),
      new ClearRfpUiEdits(),
      new ClearRfpUiEditDetails,
      new ClearRfpUiReviews
    ])
  );

  // After a media plan group ID is populated use the Fuse service to load the entities
  // then normalize the entities into the store model and return the action to
  // load all of the entities into the data stores
  // We won't be using this anymore, but leaving in case we want it in the future
  /*@Effect()
  loadMediaPlanGroup$ = this.actions$.pipe(
    ofType<SetGroupId>(SharedActionTypes.SetGroupId),
    switchMap(action => this.mediaPlanGroupLoader.loadMediaPlanGroup(action.payload).pipe(
      map(fuseResult => this.mediaPlanGroupLoader.normalize(fuseResult)),
      map(normalizedEntities => new LoadEntityGraph({ normalizedEntities: normalizedEntities })),
      catchError(err => of(console.error(err)))
    ))
  );*/

  // After a media plan group ID is populated load the media plan group entity
  @Effect()
  loadMediaPlanGroup$ = this.actions$.pipe(
    ofType<SetGroupId>(SharedActionTypes.SetGroupId),
    switchMap(action => this.mediaPlanGroupLoader.loadMediaPlanGroup(action.payload).pipe(
      map(fuseResult => this.mediaPlanGroupLoader.normalize(fuseResult)),
      map(normalizedEntities => new AddMediaPlanGroup({ mediaPlanGroup: normalizedEntities.mediaPlanGroup })),
      catchError(err => of(console.error(err)))
    ))
  );

  // After the entities loading flag is set to true load the RfpUiEdit entity
  @Effect()
  loadRfpUiEdit$ = this.actions$.pipe(
    ofType<EntitiesLoading>(SharedActionTypes.EntitiesLoading),
    withLatestFrom(this.store$.select(state => state.shared)),
    filter(([action, state]) => action.payload.entitiesLoading === true),
    switchMap(([action, state]) => this.rfpUiEditLoader.loadRfpUiEdit(state.activeMediaPlanId).pipe(
      map(fuseResult => this.rfpUiEditLoader.normalize(fuseResult)),
      mergeMap(normalizedEntities => [
        new AddRfpUiEdits({ rfpUiEdits: normalizedEntities.rfpUiEdits }),
        new RfpUiEditLoaded({ rfpUiEditLoaded: true })
      ]),
      catchError(err => of(console.error(err)))
    ))
  );

  // After the entities loading flag is set to true load the RfpUiEditDetails entity
  @Effect()
  loadRfpUiEditDetail$ = this.actions$.pipe(
    ofType<EntitiesLoading>(SharedActionTypes.EntitiesLoading),
    withLatestFrom(this.store$.select(state => state.shared)),
    filter(([action, state]) => action.payload.entitiesLoading === true),
    switchMap(([action, state]) => this.rfpUiEditDetailLoader.loadRfpUiEditDetail(state.activeMediaPlanId).pipe(
      map(fuseResult => this.rfpUiEditDetailLoader.normalize(fuseResult)),
      mergeMap(normalizedEntities => [
        new AddRfpUiEditDetails({ rfpUiEditDetails: normalizedEntities.rfpUiEditDetails }),
        new RfpUiEditDetailLoaded({ rfpUiEditDetailLoaded: true })
      ]),
      catchError(err => of(console.error(err)))
    ))
  );

  // After the entities loading flag is set to true load the RfpUiReview entity
  @Effect()
  loadRfpUiReview$ = this.actions$.pipe(
    ofType<EntitiesLoading>(SharedActionTypes.EntitiesLoading),
    withLatestFrom(this.store$.select(state => state.shared)),
    filter(([action, state]) => action.payload.entitiesLoading === true),
    switchMap(([action, state]) => this.rfpUiReviewLoader.loadRfpUiReview(state.activeMediaPlanId).pipe(
      map(fuseResult => this.rfpUiReviewLoader.normalize(fuseResult)),
      mergeMap(normalizedEntities => [
        new AddRfpUiReviews({ rfpUiReviews: normalizedEntities.rfpUiReviews }),
        new RfpUiReviewLoaded({ rfpUiReviewLoaded: true })
      ]),
      catchError(err => of(console.error(err)))
    ))
  );

  // This effect uses the ESRI state, so I had to dispatch actions manually using the store
  // this is because the store associated with the action coming into this pipe contains
  // only the local application state and doesn't know anything about the ESRI state
  @Effect({ dispatch: false })
  setSelectedGeos$ = this.actions$.pipe(
    ofType<SetAppReady>(SharedActionTypes.SetAppReady),
    withLatestFrom(this.store$.select(state => state)),
    tap(([action, state]) => this.fullStore$.dispatch(new SetSelectedGeos(this.parseGeocodes(state.rfpUiEditDetail)))),
    tap(([action, state]) => this.appLayerService.addLocationsLayer('Sites', 'Project Sites', this.parseLocations(state.rfpUiEdit)))
  );

  // After RfpUiReview is loaded check to see if the other entities have finished loading
  // if they have finished we can set the AppReady flag to true
  @Effect()
  rfpUiReviewLoaded$ = this.actions$.pipe(
    ofType<RfpUiReviewLoaded>(SharedActionTypes.RfpUiReviewLoaded),
    withLatestFrom(this.store$.select(state => state.shared)),
    filter(([action, state]) => state.rfpUiEditLoaded === true && state.rfpUiEditDetailLoaded === true && state.rfpUiReviewLoaded === true),
    switchMap(([action, state]) => [
      new EntitiesLoading({ entitiesLoading: false }),
      new SetAppReady(true)
    ]),
    catchError(err => of(console.error(err)))
  );

  // After RfpUiEdit is loaded check to see if the other entities have finished loading
  // if they have finished we can set the AppReady flag to true
  @Effect()
  rfpUiEditLoaded$ = this.actions$.pipe(
    ofType<RfpUiEditLoaded>(SharedActionTypes.RfpUiEditLoaded),
    withLatestFrom(this.store$.select(state => state.shared)),
    filter(([action, state]) => state.rfpUiEditLoaded === true && state.rfpUiEditDetailLoaded === true && state.rfpUiReviewLoaded === true),
    switchMap(([action, state]) => [
      new EntitiesLoading({ entitiesLoading: false }),
      new SetAppReady(true)
    ]),
    catchError(err => of(console.error(err)))
  );

  // After RfpUiEditDetail is loaded check to see if the other entities have finished loading
  // if they have finished we can set the AppReady flag to true
  @Effect()
  rfpUiEditDetailLoaded$ = this.actions$.pipe(
    ofType<RfpUiEditDetailLoaded>(SharedActionTypes.RfpUiEditDetailLoaded),
    withLatestFrom(this.store$.select(state => state.shared)),
    filter(([action, state]) => state.rfpUiEditLoaded === true && state.rfpUiEditDetailLoaded === true && state.rfpUiReviewLoaded === true),
    switchMap(([action, state]) => [
      new EntitiesLoading({ entitiesLoading: false }),
      new SetAppReady(true)
    ]),
    catchError(err => of(console.error(err)))
  );

  private parseLocations(state: RfpUiEditState) : UniversalCoordinates[] {
    const coordinates: Array<UniversalCoordinates> = [];
    for (const id of state.ids) {
      coordinates.push({ x: state.entities[id].siteLong, y: state.entities[id].siteLat });
    }
    return coordinates;
  }

  private parseGeocodes(state: RfpUiEditDetailState) {
    const geocodes: Array<string> = [];
    for (const id of state.ids) {
      geocodes.push(state.entities[id].geocode);
    }
    return geocodes;
  }
}