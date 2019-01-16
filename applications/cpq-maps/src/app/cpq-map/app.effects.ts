import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { SharedActionTypes, SetAppReady, SetGroupId, EntitiesLoading, RfpUiEditDetailLoaded, RfpUiEditLoaded, RfpUiReviewLoaded, SetActiveMediaPlanId } from './state/shared/shared.actions';
import { tap, filter, switchMap, map, catchError, delay, withLatestFrom, mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { Store } from '@ngrx/store';
import { LocalState, FullState } from './state';
import { MediaPlanGroupLoaderService } from './services/mediaplanGroup-loader-service';
import { SetSelectedLayer, SetSelectedGeos } from '@val/esri';
import { RfpUiEditDetailLoaderService } from './services/RfpUiEditDetail-loader-service';
import { RfpUiReviewLoaderService } from './services/rfpUiReview-loader-service';
import { AddRfpUiEditDetails } from './state/rfpUiEditDetail/rfp-ui-edit-detail.actions';
import { AddRfpUiReviews } from './state/rfpUiReview/rfp-ui-review.actions';
import { RfpUiEditLoaderService } from './services/rfpUiEdit-loader-service';
import { AddRfpUiEdits } from './state/rfpUiEdit/rfp-ui-edit.actions';
import { RfpUiEditDetailState } from './state/rfpUiEditDetail/rfp-ui-edit-detail.reducer';
import { AddMediaPlanGroup } from './state/mediaPlanGroup/media-plan-group.actions';

@Injectable()
export class AppEffects {

  // After a media plan group ID is populated set the entities loading flag to true
  // Not using this anymore
  /*@Effect()
  groupIdPopulated$ = this.actions$.pipe(
    ofType<SetGroupId>(SharedActionTypes.SetGroupId),
    filter((action) => action.payload != null),
    map((action) => new EntitiesLoading({ entitiesLoading: true }))
  );*/

  @Effect()
  mediaPlanIdSet$ = this.actions$.pipe(
    ofType<SetActiveMediaPlanId>(SharedActionTypes.SetActiveMediaPlanId),
    filter((action) => action.payload != null),
    switchMap((action) => [
      new RfpUiEditLoaded({ rfpUiEditLoaded: false }),
      new RfpUiEditDetailLoaded({ rfpUiEditDetailLoaded: false }),
      new RfpUiReviewLoaded({ rfpUiReviewLoaded: false }),
      new EntitiesLoading({ entitiesLoading: true })
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
    withLatestFrom(this.store$.select(state => state.rfpUiEditDetail)),
    tap(([action, state]) => this.fullStore$.dispatch(new SetSelectedLayer({ layerId: 'c0ee701ee95f4bbdbc15ded2a37ca802' }))),
    delay(5000),
    tap(([action, state]) => this.fullStore$.dispatch(new SetSelectedGeos(this.parseGeocodes(state))))
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

  private parseGeocodes(state: RfpUiEditDetailState) {
    const geocodes: Array<string> = [];
    for (const id of state.ids) {
      geocodes.push(state.entities[id].geocode);
    }
    return geocodes;
  }

  constructor(private actions$: Actions, 
    private store$: Store<LocalState>, 
    private mediaPlanGroupLoader: MediaPlanGroupLoaderService,
    private rfpUiEditDetailLoader: RfpUiEditDetailLoaderService,
    private rfpUiReviewLoader: RfpUiReviewLoaderService,
    private rfpUiEditLoader: RfpUiEditLoaderService,
    private fullStore$: Store<FullState>) { }
}