import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { of } from 'rxjs';
import { catchError, concatMap, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { AppConfig } from '../../app.config';
import { AppLayerService } from '../services/app-layer-service';
import { AppMapService } from '../services/app-map.service';
import { AppMessagingService } from '../services/app-messaging.service';
import { AppNavigationService } from '../services/app-navigation.service';
import { AppPrintingService } from '../services/app-printing-service';
import { ConfigService } from '../services/config.service';
import { EntityHelper } from '../services/entity-helper-service';
import { RfpUiEditWrapService } from '../services/rfpEditWrap-service';
import { ShadingService } from '../services/shading.service';
import { localSelectors } from './app.selectors';
import { FullState, LocalState } from './index';
import { MapUIActionTypes, RenderShading } from './map-ui/map-ui.actions';
import { RfpUiEditDetailActions, RfpUiEditDetailActionTypes } from './rfpUiEditDetail/rfp-ui-edit-detail.actions';
import { RfpUiEditWrapActions, RfpUiEditWrapActionTypes } from './rfpUiEditWrap/rfp-ui-edit-wrap.actions';
import { GeneratePdf, GeneratePdfSucceeded, GeneratePfdFailed, NavigateToReviewPage, SaveFailed, SaveSucceeded, SharedActions, SharedActionTypes } from './shared/shared.actions';

@Injectable()
export class AppEffects {

  constructor(private actions$: Actions<SharedActions | RfpUiEditDetailActions | RfpUiEditWrapActions>,
              private store$: Store<LocalState>,
              private shadingService: ShadingService,
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
  shadeAfterEdit$ = this.actions$.pipe(
    ofType(RfpUiEditDetailActionTypes.UpdateRfpUiEditDetail,
           RfpUiEditDetailActionTypes.UpdateRfpUiEditDetails),
    map(() => new RenderShading({ recreateLayer: false }))
  );

  @Effect()
  shadeAfterAdd$ = this.actions$.pipe(
    ofType(RfpUiEditDetailActionTypes.UpsertRfpUiEditDetail,
           RfpUiEditDetailActionTypes.UpsertRfpUiEditDetails),
    map(() => new RenderShading({ recreateLayer: true }))
  );

  // If the isDistrQtyEnabled flag is changed we need to enable
  // or disable the labels on the map
  @Effect({ dispatch: false })
  isDistryQtyEnabled$ = this.actions$.pipe(
    ofType(MapUIActionTypes.SetIsDistributionVisible),
    withLatestFrom(this.fullStore$),
    tap(([, state]) => this.appLayerService.updateLabels(state))
  );

  // If RfpUiEditWraps are changed we have to change the underlying zips as well
  @Effect({ dispatch: false })
  rfpUiEditWrapUpserted$ = this.actions$.pipe(
    ofType(RfpUiEditWrapActionTypes.UpsertRfpUiEditWraps),
    withLatestFrom(this.fullStore$),
    tap(([action, state]) => this.rfpUiEditWrapService.toggleWrapZoneGeos(action.payload.rfpUiEditWraps, state))
  );

  @Effect({ dispatch: false })
  navigate$ = this.actions$.pipe(
    ofType(SharedActionTypes.NavigateToReviewPage),
    map(action => this.navigateService.getReviewPageUrl(action.payload.rfpId, action.payload.mediaPlanGroupNumber)),
    tap(url => this.navigateService.navigateTo(url))
  );

  @Effect()
  saveMediaPlans$ = this.actions$.pipe(
    ofType(SharedActionTypes.SaveMediaPlan),
    tap(() => this.store$.dispatch(new StartBusyIndicator({ key: this.appConfig.ApplicationBusyKey, message: 'Saving Media Plan...' }))),
    withLatestFrom(this.store$),
    switchMap(([, state]) => this.entityHelper.saveMediaPlan(state).pipe(
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
  generatePdf$ = this.actions$.pipe(
    ofType<GeneratePdf>(SharedActionTypes.GeneratePdf),
    tap(() => this.store$.dispatch(new StartBusyIndicator({ key: this.appConfig.ApplicationBusyKey, message: 'Generating map book' }))),
    withLatestFrom(this.store$.pipe(select(localSelectors.getPrintParams)), this.store$.pipe(select(localSelectors.getSharedState)), this.store$.pipe(select(localSelectors.getAvailabilityParams))),
    switchMap(([, printParams, shared, dates]) => this.appPrintingService.setPrintParams(shared, printParams, dates.fromDate).pipe(
      map(results => new GeneratePdfSucceeded({ response: results })),
      catchError(err => of(new GeneratePfdFailed({ err })))
      )
    )
  );

  @Effect()
  generatePdfComplete$ = this.actions$.pipe(
    ofType(SharedActionTypes.GeneratePdfSucceeded, SharedActionTypes.GeneratePfdFailed),
    map(() => new StopBusyIndicator({ key: this.appConfig.ApplicationBusyKey }))
  );

  @Effect({ dispatch: false })
  generatePdfFailure$ = this.actions$.pipe(
    ofType(SharedActionTypes.GeneratePfdFailed),
    tap(() => this.messagingService.showErrorNotification('There was an error generating map book')),
  );

  @Effect({ dispatch: false })
  generatePdfSuccess$ = this.actions$.pipe(
    ofType(SharedActionTypes.GeneratePdfSucceeded),
    tap(action => this.appPrintingService.openPDF(action.payload.response.value)),
    tap(() => this.messagingService.showSuccessNotification('The Map PDF was generated successfully in a new tab')),
  );
}
