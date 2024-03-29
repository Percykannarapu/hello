import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { EsriService } from '@val/esri';
import { StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { of, zip } from 'rxjs';
import { catchError, concatMap, filter, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { MediaPlanPref } from '../../../val-modules/mediaexpress/models/MediaPlanPref';
import { AppLayerService } from '../../services/app-layer-service';
import { AppMapService } from '../../services/app-map.service';
import { AppMessagingService } from '../../services/app-messaging.service';
import { AppPopupService } from '../../services/app-popup.service';
import { AppSiteService } from '../../services/app-site.service';
import { ConfigService } from '../../services/config.service';
import { EntityHelper } from '../../services/entity-helper-service';
import { localSelectors } from '../app.selectors';
import { FullState } from '../index';
import { InitializeMapUI } from '../map-ui/map-ui.actions';
import { SetMapPreferences } from '../shared/shared.actions';
import { GetMediaPlanData, GetMediaPlanDataFailed, GetMediaPlanDataSucceeded, InitActions, InitActionTypes, MapSetupFailed, MapSetupSucceeded } from './init.actions';

@Injectable()
export class InitEffects {

  @Effect()
  applicationStartup$ = this.actions$.pipe(
    ofType(InitActionTypes.ApplicationStartup),
    switchMap(action => this.appMapService.setupApplication(action.payload.analysisLevel).pipe(
      map(() => new MapSetupSucceeded({ groupId: action.payload.groupId, mediaPlanId: action.payload.mediaPlanId })),
      catchError(err => of(new MapSetupFailed({ err })))
    ))
  );

  @Effect()
  mapSetupSuccess$ = this.actions$.pipe(
    ofType(InitActionTypes.MapSetupSucceeded),
    tap(() => this.appMapService.updateLabelExpressions(false)),
    concatMap(action => [
      new StartBusyIndicator({ key: 'Media Plan Load Key', message: 'Loading Media Plan...' }),
      new GetMediaPlanData({ ...action.payload })
    ])
  );

  @Effect({ dispatch: false })
  mapSetupFailure$ = this.actions$.pipe(
    ofType(InitActionTypes.MapSetupFailed),
    tap(() => this.messagingService.showErrorNotification('There was an error initializing the map.')),
  );

  @Effect()
  getMediaPlanData$ = this.actions$.pipe(
    ofType(InitActionTypes.GetMediaPlanData),
    switchMap(action => this.entityHelper.loadEntities(action.payload.groupId, action.payload.mediaPlanId).pipe(
      map(result => new GetMediaPlanDataSucceeded({ normalizedEntities: result })),
      catchError(err => of(new GetMediaPlanDataFailed({ err })))
    ))
  );

  @Effect()
  getDataComplete$ = this.actions$.pipe(
    ofType(InitActionTypes.GetMediaPlanDataSucceeded, InitActionTypes.GetMediaPlanDataFailed),
    map(() => new StopBusyIndicator({ key: 'Media Plan Load Key' }))
  );

  @Effect({ dispatch: false })
  getDataFailure$ = this.actions$.pipe(
    ofType(InitActionTypes.GetMediaPlanDataFailed),
    tap(() => this.messagingService.showErrorNotification('There was an error retrieving the Media Plan data.')),
  );

  getDataSuccess$ = this.actions$.pipe(ofType(InitActionTypes.GetMediaPlanDataSucceeded));

  loadPreferences$ = this.getDataSuccess$.pipe(
    map(action => action.payload.normalizedEntities.mapPreferences),
    map(prefs => [
      prefs.filter(p => p.pref === 'MAP UI SLICE')[0] || {} as MediaPlanPref,
    ]),
    map(([mapUI]) => new SetMapPreferences({ mapUISlice: JSON.parse(mapUI.val || null) || {} }))
  );

  finalizeAppLoad$ = this.getDataSuccess$.pipe(
    withLatestFrom(this.store$.pipe(select(localSelectors.getSelectedAnalysisLevel))),
    tap(() => this.appMapService.setMapWatches()),
    map(([, analysisLevel]) => analysisLevel),
  );

  @Effect()
  loadComplete$ = zip(this.loadPreferences$, this.finalizeAppLoad$).pipe(
    tap(([, analysisLevel]) => this.esri.setSelectedLayer(this.config.layers[analysisLevel].boundaries.id)),
    concatMap(([prefs]) => [
      prefs,
      new InitializeMapUI()
    ])
  );

  @Effect({ dispatch: false })
  initPopup$ = this.getDataSuccess$.pipe(
    withLatestFrom(this.store$.pipe(select(localSelectors.getSelectedAnalysisLevel))),
    tap(([, analysisLevel]) => this.appPopupService.initializePopups(analysisLevel))
  );

  @Effect({ dispatch: false })
  initSites$ = this.getDataSuccess$.pipe(
    withLatestFrom(this.store$.pipe(select(localSelectors.getRfpUiEditEntities)),
                   this.store$.pipe(select(localSelectors.getRfpUiEditDetailEntities)),
                   this.store$.pipe(select(localSelectors.getSharedState))),
    tap(([, edits, details, shared]) => this.appSiteService.createSiteFeatureLayer(edits, details, shared.radius, 'Sites', 'Project Sites'))
  );

  @Effect({ dispatch: false })
  initRadii$ = this.getDataSuccess$.pipe(
    withLatestFrom(this.store$.pipe(select(localSelectors.getRfpUiEditEntities)),
                   this.store$.pipe(select(localSelectors.getSharedState))),
    map(([, edits, shared]) => this.appSiteService.createSiteRadii(edits, shared.radius)),
    tap(graphics => this.appLayerService.initializeGraphicGroup(graphics, 'Sites', 'Trade Areas')),
  );

  @Effect({ dispatch: false })
  initWrap$ = this.getDataSuccess$.pipe(
    withLatestFrom(this.store$.pipe(select(localSelectors.getSharedState))),
    filter(([, shared]) => shared.isWrap),
    tap(() => this.appLayerService.turnOnWrapLayer()),
  );

  constructor(private actions$: Actions<InitActions>,
              private store$: Store<FullState>,
              private config: ConfigService,
              private esri: EsriService,
              private entityHelper: EntityHelper,
              private appSiteService: AppSiteService,
              private appMapService: AppMapService,
              private appLayerService: AppLayerService,
              private appPopupService: AppPopupService,
              private messagingService: AppMessagingService) {}
}
