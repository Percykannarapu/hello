import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { SharedActionTypes, SetAppReady, SetGroupId, EntitiesLoading, RfpUiEditDetailLoaded, RfpUiEditLoaded, RfpUiReviewLoaded, SetActiveMediaPlanId, RfpUiEditWrapLoaded, SetIsDistrQtyEnabled } from './state/shared/shared.actions';
import { tap, filter, switchMap, map, catchError, withLatestFrom } from 'rxjs/operators';
import { of } from 'rxjs';
import { Store } from '@ngrx/store';
import { LocalState, FullState } from './state';
import { MediaPlanGroupLoaderService } from './services/mediaplanGroup-loader-service';
import { ClearSelectedGeos } from '@val/esri';
import { ClearRfpUiEditDetails } from './state/rfpUiEditDetail/rfp-ui-edit-detail.actions';
import { ClearRfpUiReviews } from './state/rfpUiReview/rfp-ui-review.actions';
import { ClearRfpUiEdits } from './state/rfpUiEdit/rfp-ui-edit.actions';
import { AddMediaPlanGroup, MediaPlanGroupActionTypes, ClearMediaPlanGroups } from './state/mediaPlanGroup/media-plan-group.actions';
import { AppLayerService } from './services/app-layer-service';
import { UniversalCoordinates } from '@val/common';
import { RfpUiEditState } from './state/rfpUiEdit/rfp-ui-edit.reducer';
import { EntityHelper } from './services/entity-helper-service';

@Injectable()
export class AppEffects {

  constructor(private actions$: Actions, 
    private store$: Store<LocalState>, 
    private mediaPlanGroupLoader: MediaPlanGroupLoaderService,
    private appLayerService: AppLayerService,
    private fullStore$: Store<FullState>,
    private entityHelper: EntityHelper) { }

  // When a new active media plan is selected we need to clear the data stores
  // of previous data, we also clear the locations layer on the map to get rid
  // of any locations that may not be the same between media plans
  // we will also unhighlight any geos that might currently be highlighted
  @Effect()
  mediaPlanIdSet$ = this.actions$.pipe(
    ofType<SetActiveMediaPlanId>(SharedActionTypes.SetActiveMediaPlanId),
    filter((action) => action.payload != null),
    tap((action) => this.appLayerService.removeLayer('Sites', 'Project Sites')),
    tap((action) => this.appLayerService.removeLayer('Sites', 'Trade Areas')),
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
    tap((action) => this.appLayerService.removeLayer('Sites', 'Project Sites')),
    tap((action) => this.appLayerService.removeLayer('Sites', 'Trade Areas')),
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

  // After the entities loading flag is set to true load the entities
  @Effect({ dispatch: false })
  loadEntities$ = this.actions$.pipe(
    ofType<EntitiesLoading>(SharedActionTypes.EntitiesLoading),
    withLatestFrom(this.store$.select(state => state)),
    filter(([action, state]) => action.payload.entitiesLoading === true),
    tap(([action, state]) => this.entityHelper.loadEntities(state))
  );

  // This effect uses the ESRI state, so I had to dispatch actions manually using the store
  // this is because the store associated with the action coming into this pipe contains
  // only the local application state and doesn't know anything about the ESRI state
  @Effect({ dispatch: false })
  setSelectedGeos$ = this.actions$.pipe(
    ofType<SetAppReady>(SharedActionTypes.SetAppReady),
    withLatestFrom(this.fullStore$.select(state => state)),
    tap(([action, state]) => this.appLayerService.updateLabels(state)),
    tap(([action, state]) => this.appLayerService.shadeBySite(state)),
    tap(([action, state]) => this.appLayerService.addLocationsLayer('Sites', 'Project Sites', this.parseLocations(state.rfpUiEdit))),
    tap(([action, state]) => this.appLayerService.addTradeAreaRings(this.parseLocations(state.rfpUiEdit), state.shared.radius)),
    tap(([action, state]) => this.appLayerService.zoomToTradeArea(this.parseLocations(state.rfpUiEdit))),
    tap(([action, state]) => this.appLayerService.setPopupData(state))
  );

  // As the entities are loaded we need to check the loading status across
  // the 4 different types, if everything is loaded up we say the app is ready
  @Effect({ dispatch: false })
  entitiesLoaded$ = this.actions$.pipe(
    ofType<RfpUiReviewLoaded | RfpUiEditLoaded | RfpUiEditDetailLoaded | RfpUiEditWrapLoaded>(SharedActionTypes.RfpUiReviewLoaded, SharedActionTypes.RfpUiEditLoaded, SharedActionTypes.RfpUiEditDetailLoaded, SharedActionTypes.RfpUiEditWrapLoaded),
    withLatestFrom(this.store$.select(state => state)),
    tap(([action, state]) => this.entityHelper.checkLoadingStatus(state))
  );

  // If the isDistrQtyEnabled flag is changed we need to enable
  // or disable the labels on the map
  @Effect({ dispatch: false })
  isDistryQtyEnabled$ = this.actions$.pipe(
    ofType<SetIsDistrQtyEnabled>(SharedActionTypes.SetIsDistrQtyEnabled),
    withLatestFrom(this.fullStore$.select(state => state)),
    tap(([action, state]) => this.appLayerService.updateLabels(state))
  );

  private parseLocations(state: RfpUiEditState) : UniversalCoordinates[] {
    const coordinates: Array<UniversalCoordinates> = [];
    for (const id of state.ids) {
      coordinates.push({ x: state.entities[id].siteLong, y: state.entities[id].siteLat });
    }
    return coordinates;
  }
}