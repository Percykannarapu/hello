import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { AppConfig } from '../../app.config';
import { AppMapService } from '../services/app-map.service';
import { AppNavigationService } from '../services/app-navigation.service';
import { localSelectors } from './app.selectors';
import {
  SharedActionTypes,
  SetAppReady,
  SetIsDistrQtyEnabled,
  GetMapData,
  LoadEntityGraph, GetMapDataFailed, SetIsWrap, PopupGeoToggle, SaveMediaPlan, SaveSucceeded, SaveFailed, NavigateToReviewPage, SetShadingType, SetLegendHTML
} from './shared/shared.actions';
import { tap, filter, switchMap, map, catchError, withLatestFrom, concatMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { Store, select } from '@ngrx/store';
import { LocalState, FullState } from './index';
import { SetSelectedLayer } from '@val/esri';
import { UpsertRfpUiEditDetail, RfpUiEditDetailActionTypes, UpsertRfpUiEditDetails } from './rfpUiEditDetail/rfp-ui-edit-detail.actions';
import { AppLayerService, SiteInformation } from '../services/app-layer-service';
import { EntityHelper } from '../services/entity-helper-service';
import { ConfigService } from '../services/config.service';
import { RfpUiEditWrapActionTypes, UpsertRfpUiEditWraps } from './rfpUiEditWrap/rfp-ui-edit-wrap.actions';
import { RfpUiEditWrapService } from '../services/rfpEditWrap-service';
import { AppMessagingService } from '../services/app-messaging.service';

@Injectable()
export class AppEffects {

  constructor(private actions$: Actions, 
    private store$: Store<LocalState>,
    private appConfig: AppConfig,
    private configService: ConfigService,
    private appLayerService: AppLayerService,
    private appMapService: AppMapService,
    private fullStore$: Store<FullState>,
    private entityHelper: EntityHelper,
    private rfpUiEditWrapService: RfpUiEditWrapService,
    private messagingService: AppMessagingService,
    private navigateService: AppNavigationService) { }

  // After the page and map loads, we go get data for the current Media Plan
  @Effect()
  loadEntities$ = this.actions$.pipe(
    ofType<GetMapData>(SharedActionTypes.GetMapData),
    switchMap(action => this.entityHelper.loadEntities(action.payload.groupId, action.payload.mediaPlanId).pipe(
      map(result => new LoadEntityGraph({ normalizedEntities: result })),
      catchError(err => of(new GetMapDataFailed({ err })))
    ))
  );

  @Effect()
  loadComplete$ = this.actions$.pipe(
    ofType(SharedActionTypes.LoadEntityGraph),
    concatMap(() => [
      new StopBusyIndicator({ key: this.appConfig.ApplicationBusyKey }),
      new SetAppReady(true)
    ])
  );

  // This effect uses the ESRI state, so I had to dispatch actions manually using the store
  // this is because the store associated with the action coming into this pipe contains
  // only the local application state and doesn't know anything about the ESRI state
  @Effect({ dispatch: false })
  setSelectedGeos$ = this.actions$.pipe(
    ofType<SetAppReady>(SharedActionTypes.SetAppReady),
    withLatestFrom(this.fullStore$.pipe(select(state => state))),
    tap(([, state]) => this.appLayerService.updateLabels(state)),
    tap(([, state]) => this.appLayerService.shadeMap(state)),
    tap(([, state]) => this.appLayerService.addLocationsLayer('Sites', 'Project Sites', this.parseLocations(state), state.shared.analysisLevel)),
    tap(([, state]) => this.appLayerService.addTradeAreaRings(this.parseLocations(state), state.shared.radius)),
    tap(([, state]) => this.appLayerService.zoomToTradeArea(this.parseLocations(state))),
    tap(([, state]) => this.appLayerService.setPopupData(state)),
    tap(() => this.appMapService.setMapWatches())
  );

  @Effect({ dispatch: false })
  setLegendHTML$ = this.actions$.pipe(
    ofType<SetLegendHTML>(SharedActionTypes.SetLegendHTML),
    tap(() => this.appLayerService.setupLegend())
  );

  @Effect({ dispatch: false })
  setMapShading = this.actions$.pipe(
    ofType<SetShadingType>(SharedActionTypes.SetShadingType),
    withLatestFrom(this.fullStore$.pipe(select(state => state))),
    tap(([, state]) => this.appLayerService.shadeMap(state)),
  );

  @Effect()
  handleWrapZoneLayer$ = this.actions$.pipe(
    ofType<SetIsWrap>(SharedActionTypes.SetIsWrap),
    filter(action => action.payload.isWrap),
    map(() => new SetSelectedLayer({ layerId: this.configService.layers['zip'].boundaries.id }))
  );

  // If the isDistrQtyEnabled flag is changed we need to enable
  // or disable the labels on the map
  @Effect({ dispatch: false })
  isDistryQtyEnabled$ = this.actions$.pipe(
    ofType<SetIsDistrQtyEnabled>(SharedActionTypes.SetIsDistrQtyEnabled),
    withLatestFrom(this.fullStore$.pipe(select(state => state))),
    tap(([, state]) => this.appLayerService.updateLabels(state))
  );

  // If RfpUiEditDetails are changed we have to reshade the map
  @Effect({ dispatch: false })
  rfpUiEditDetailUpserted$ = this.actions$.pipe(
    ofType<UpsertRfpUiEditDetail>(RfpUiEditDetailActionTypes.UpsertRfpUiEditDetail),
    withLatestFrom(this.fullStore$.pipe(select(state => state))),
    tap(([action, state]) => this.appLayerService.toggleGeoShading([action.payload.rfpUiEditDetail], state))
  );

  // If RfpUiEditDetails are changed we have to reshade the map
  @Effect({ dispatch: false })
  rfpUiEditDetailsUpserted$ = this.actions$.pipe(
    ofType<UpsertRfpUiEditDetails>(RfpUiEditDetailActionTypes.UpsertRfpUiEditDetails),
    withLatestFrom(this.fullStore$.pipe(select(state => state))),
    tap(([action, state]) => this.appLayerService.toggleGeoShading(action.payload.rfpUiEditDetails, state))
  );

  // If RfpUiEditWraps are changed we have to reshade the map
  @Effect({ dispatch: false })
  rfpUiEditWrapUpserted$ = this.actions$.pipe(
    ofType<UpsertRfpUiEditWraps>(RfpUiEditWrapActionTypes.UpsertRfpUiEditWraps),
    withLatestFrom(this.fullStore$.pipe(select(state => state))),
    tap(([action, state]) => this.rfpUiEditWrapService.toggleWrapZoneGeos(action.payload.rfpUiEditWraps, state))
  );

  // Handle the map popup button to toggle geos on and off
  @Effect({dispatch: false})
  popupGeoToggle$ = this.actions$.pipe(
    ofType<PopupGeoToggle>(SharedActionTypes.PopupGeoToggle),
    withLatestFrom(this.fullStore$.pipe(select(state => state))),
    tap(([action, state]) => this.appLayerService.onPopupToggleAction(action.payload.eventName, state))
  );

  @Effect()
  dataRetrievalFailure$ = this.actions$.pipe(
    ofType(SharedActionTypes.GetMapDataFailed),
    tap(() => this.messagingService.showErrorNotification('There was an error retrieving the Media Plan data.')),
    map(() => new StopBusyIndicator({ key: this.appConfig.ApplicationBusyKey }))
  );

  @Effect()
  mapInitFailure$ = this.actions$.pipe(
    ofType(SharedActionTypes.MapSetupFailed),
    tap(() => this.messagingService.showErrorNotification('There was an error initializing the map.')),
    map(() => new StopBusyIndicator({ key: this.appConfig.ApplicationBusyKey }))
  );

  @Effect({ dispatch: false })
  navigate$ = this.actions$.pipe(
    ofType<NavigateToReviewPage>(SharedActionTypes.NavigateToReviewPage),
    map(action => this.navigateService.getreviewPageUrl(action.payload.rfpId, action.payload.mediaPlanGroupNumber)),
    tap(url => this.navigateService.navigateTo(url))
  );

  @Effect()
  saveMediaPlans$ = this.actions$.pipe(
    ofType<SaveMediaPlan>(SharedActionTypes.SaveMediaPlan),
    tap(() => this.store$.dispatch(new StartBusyIndicator({ key: this.appConfig.ApplicationBusyKey, message: 'Saving Media Plan...' }))),
    withLatestFrom(this.store$.pipe(select(localSelectors.getRfpUiEditDetailEntity))),
    map(([action, entity]) => [action.payload.updateIds.map(u => entity[u]), action.payload.addIds.map(a => entity[a])]),
    switchMap(([updates, adds]) => this.entityHelper.saveMediaPlan(updates, adds).pipe(
      map(() => new SaveSucceeded()),
      catchError(err => of(new SaveFailed({ err })))
    ))
  );

  @Effect()
  saveSucceeded$ = this.actions$.pipe(
    ofType(SharedActionTypes.SaveSucceeded),
    withLatestFrom(this.store$.pipe(select(localSelectors.getHeaderInfo))),
    concatMap(([, headerInfo]) => [
      new StopBusyIndicator({ key: this.appConfig.ApplicationBusyKey }),
      new NavigateToReviewPage({ rfpId: headerInfo.rfpId, mediaPlanGroupNumber: headerInfo.mediaPlanGroup })
    ])
  );

  @Effect()
  saveFailed$ = this.actions$.pipe(
    ofType<SaveFailed>(SharedActionTypes.SaveFailed),
    tap(action => console.log('Error Saving Media Plan', action.payload.err)),
    tap(() => this.messagingService.showErrorNotification('There was an error saving the Media Plan')),
    map(() => new StopBusyIndicator({ key: this.appConfig.ApplicationBusyKey }))
  );

  private parseLocations(state: FullState) : SiteInformation[] {
    const coordinates: Array<SiteInformation> = [];
    for (const id of state.rfpUiEdit.ids) {
      let currentIHD = new Date (state.rfpUiEditDetail.entities[id].ihDate).toLocaleDateString();
      coordinates.push({
        coordinates: { x: state.rfpUiEdit.entities[id].siteLong, y: state.rfpUiEdit.entities[id].siteLat },
        name: state.rfpUiEdit.entities[id].siteName,
        radius: state.shared.radius,
        siteId: state.rfpUiEdit.entities[id].siteId,
        inHomeDate: currentIHD,
      });
    }
    return coordinates;
  }
}

