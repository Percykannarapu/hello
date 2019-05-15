import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { AppConfig } from '../../app.config';
import { AppMapService } from '../services/app-map.service';
import { AppNavigationService } from '../services/app-navigation.service';
import { localSelectors } from './app.selectors';
import { ExportMaps, GetMapDataFailed, LoadEntityGraph, NavigateToReviewPage, SaveFailed, SaveSucceeded, SetAppReady, SharedActions, SharedActionTypes } from './shared/shared.actions';
import { catchError, concatMap, filter, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { of } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { FullState, LocalState } from './index';
import { SetSelectedLayer } from '@val/esri';
import { RfpUiEditDetailActions, RfpUiEditDetailActionTypes } from './rfpUiEditDetail/rfp-ui-edit-detail.actions';
import { AppLayerService, SiteInformation } from '../services/app-layer-service';
import { EntityHelper } from '../services/entity-helper-service';
import { ConfigService } from '../services/config.service';
import { RfpUiEditWrapActions, RfpUiEditWrapActionTypes } from './rfpUiEditWrap/rfp-ui-edit-wrap.actions';
import { RfpUiEditWrapService } from '../services/rfpEditWrap-service';
import { AppMessagingService } from '../services/app-messaging.service';
import { AppPrintingService } from '../services/app-printing-service';

@Injectable()
export class AppEffects {

  constructor(private actions$: Actions<SharedActions | RfpUiEditDetailActions | RfpUiEditWrapActions>,
    private store$: Store<LocalState>,
    private appConfig: AppConfig,
    private configService: ConfigService,
    private appLayerService: AppLayerService,
    private appMapService: AppMapService,
    private fullStore$: Store<FullState>,
    private entityHelper: EntityHelper,
    private rfpUiEditWrapService: RfpUiEditWrapService,
    private messagingService: AppMessagingService,
    private navigateService: AppNavigationService,
    private appPrintingService: AppPrintingService) { }

  // After the page and map loads, we go get data for the current Media Plan
  @Effect()
  loadEntities$ = this.actions$.pipe(
    ofType(SharedActionTypes.GetMapData),
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
    ofType(SharedActionTypes.SetAppReady),
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
    ofType(SharedActionTypes.SetLegendHTML),
    tap(() => this.appLayerService.setupLegend())
  );

  @Effect({ dispatch: false })
  setMapShading = this.actions$.pipe(
    ofType(SharedActionTypes.SetShadingType),
    withLatestFrom(this.fullStore$.pipe(select(state => state))),
    tap(([, state]) => this.appLayerService.shadeMap(state)),
  );

  @Effect()
  handleWrapZoneLayer$ = this.actions$.pipe(
    ofType(SharedActionTypes.SetIsWrap),
    filter(action => action.payload.isWrap),
    map(() => new SetSelectedLayer({ layerId: this.configService.layers['zip'].boundaries.id }))
  );

  // If the isDistrQtyEnabled flag is changed we need to enable
  // or disable the labels on the map
  @Effect({ dispatch: false })
  isDistryQtyEnabled$ = this.actions$.pipe(
    ofType(SharedActionTypes.SetIsDistrQtyEnabled),
    withLatestFrom(this.fullStore$.pipe(select(state => state))),
    tap(([, state]) => this.appLayerService.updateLabels(state))
  );

  // If RfpUiEditDetails are changed we have to reshade the map
  @Effect({ dispatch: false })
  rfpUiEditDetailUpserted$ = this.actions$.pipe(
    ofType(RfpUiEditDetailActionTypes.UpsertRfpUiEditDetail),
    withLatestFrom(this.fullStore$.pipe(select(state => state))),
    tap(([action, state]) => this.appLayerService.toggleGeoShading([action.payload.rfpUiEditDetail], state))
  );

  // If RfpUiEditDetails are changed we have to reshade the map
  @Effect({ dispatch: false })
  rfpUiEditDetailsUpserted$ = this.actions$.pipe(
    ofType(RfpUiEditDetailActionTypes.UpsertRfpUiEditDetails),
    withLatestFrom(this.fullStore$.pipe(select(state => state))),
    tap(([action, state]) => this.appLayerService.toggleGeoShading(action.payload.rfpUiEditDetails, state))
  );

  // If RfpUiEditWraps are changed we have to reshade the map
  @Effect({ dispatch: false })
  rfpUiEditWrapUpserted$ = this.actions$.pipe(
    ofType(RfpUiEditWrapActionTypes.UpsertRfpUiEditWraps),
    withLatestFrom(this.fullStore$.pipe(select(state => state))),
    tap(([action, state]) => this.rfpUiEditWrapService.toggleWrapZoneGeos(action.payload.rfpUiEditWraps, state))
  );

  // Handle the map popup button to toggle geos on and off
  @Effect({dispatch: false})
  popupGeoToggle$ = this.actions$.pipe(
    ofType(SharedActionTypes.PopupGeoToggle),
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
    ofType(SharedActionTypes.NavigateToReviewPage),
    map(action => this.navigateService.getreviewPageUrl(action.payload.rfpId, action.payload.mediaPlanGroupNumber)),
    tap(url => this.navigateService.navigateTo(url))
  );

  @Effect()
  saveMediaPlans$ = this.actions$.pipe(
    ofType(SharedActionTypes.SaveMediaPlan),
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
    ofType(SharedActionTypes.SaveFailed),
    tap(action => console.log('Error Saving Media Plan', action.payload.err)),
    tap(() => this.messagingService.showErrorNotification('There was an error saving the Media Plan')),
    map(() => new StopBusyIndicator({ key: this.appConfig.ApplicationBusyKey }))
  );

  @Effect()
  exportMaps$ = this.actions$.pipe(
    ofType<ExportMaps>(SharedActionTypes.ExportMaps),
    withLatestFrom(this.store$.pipe(select(localSelectors.getPrintParams)), this.store$.pipe(select(localSelectors.getSharedState))),
    switchMap(([action, printParams, shared]) => {
      if (shared.isWrap){
        printParams.layerSource = this.configService.layers['wrap'].serviceUrl;
        printParams.zipsLabelingExpression = this.configService.layers['zip'].boundaries.labelExpression;
        printParams.layerSourceLabelingExpression = this.configService.layers['wrap'].boundaries.labelExpression;
      }
      else{
       if (this.appLayerService.analysisLevel === 'zip') {
          printParams.layerSource = this.configService.layers['zip'].serviceUrl;
          printParams.zipsLabelingExpression = this.configService.layers['zip'].boundaries.labelExpression;
          printParams.layerSourceLabelingExpression = this.configService.layers['zip'].boundaries.labelExpression;
       } else{
          printParams.layerSource = this.configService.layers['atz'].serviceUrl;
          printParams.zipsLabelingExpression = this.configService.layers['zip'].boundaries.labelExpression;
          printParams.layerSourceLabelingExpression = this.configService.layers['atz'].boundaries.labelExpression;
       }
      }
    return this.appPrintingService.createFeatureSet(printParams);
    }
  ));
  
  private parseLocations(state: FullState) : SiteInformation[] {
    const coordinates: Array<SiteInformation> = [];
    for (const id of state.rfpUiEdit.ids) {
      const currentIHD = new Date (state.rfpUiEditDetail.entities[id].ihDate).toLocaleDateString();
      const ihdList = state.rfpUiEditDetail.entities[id];
      // console.log('ihdList::', ihdList);
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

