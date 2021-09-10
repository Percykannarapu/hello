import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, filter, map, mergeMap, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { SelectedButtonTypeCodes } from '../../core/esri.enums';
import { EsriLayerService } from '../../services/esri-layer.service';
import { EsriMapInteractionService } from '../../services/esri-map-interaction.service';
import { EsriMapService } from '../../services/esri-map.service';
import { AppState } from '../esri.reducers';
import { internalSelectors, selectors } from '../esri.selectors';
import {
  CopyCoordinatesToClipboard,
  EsriMapActionTypes,
  FeaturesSelected,
  InitializeMap,
  InitializeMapFailure,
  InitializeMapSuccess,
  MapClicked,
  SetPopupVisibility,
} from './esri.map.actions';

@Injectable()
export class EsriMapEffects {

  InitializeMap$ = createEffect(() => this.actions$.pipe(
    ofType<InitializeMap>(EsriMapActionTypes.InitializeMap),
    switchMap(action => this.mapService.initializeMap(action.payload.domContainer, action.payload.baseMap).pipe(
      map(() => new InitializeMapSuccess()),
      catchError(err => of(new InitializeMapFailure({ errorResponse: err })))
    )),
  ));

  handleMapClick$ = createEffect(() => this.actions$.pipe(
    ofType<MapClicked>(EsriMapActionTypes.MapClicked),
    withLatestFrom(this.store$.pipe(select(internalSelectors.getEsriMapButtonState)), this.store$.select(selectors.getEsriSelectedLayer)),
    filter(([, state]) => state === SelectedButtonTypeCodes.SelectSinglePoly),
    mergeMap(([action, , layerId]) => this.mapInteractionService.processClick(action.payload.event, layerId)),
    map(features => new FeaturesSelected({ features, shouldToggle: true }))
  ));

  handleMapClickHandler$ = createEffect(() => this.actions$.pipe(
    ofType<MapClicked>(EsriMapActionTypes.MapClicked),
    withLatestFrom(this.store$.pipe(select(internalSelectors.getEsriMapButtonState))),
    filter(([, state]) => state === SelectedButtonTypeCodes.XY),
    map( ([action]) => new CopyCoordinatesToClipboard({ event: action.payload.event }))
  ));

  handleCopyCoordinatesToClipboard$ = createEffect(() => this.actions$.pipe(
    ofType<CopyCoordinatesToClipboard>(EsriMapActionTypes.CopyCoordinatesToClipboard),
    tap(action => this.layerService.enableLatLongTool(action))
  ), { dispatch: false });

  handlePopupVisibilityChange$ = createEffect(() => this.actions$.pipe(
    ofType<SetPopupVisibility>(EsriMapActionTypes.SetPopupVisibility),
    tap(action => this.layerService.setAllPopupStates(action.payload.isVisible))
  ), { dispatch: false });

  handleLabels$ = createEffect(() => this.actions$.pipe(
    ofType(EsriMapActionTypes.SetLabelConfiguration, EsriMapActionTypes.SetLayerLabelExpressions, EsriMapActionTypes.HideLabels, EsriMapActionTypes.ShowLabels),
    withLatestFrom(this.store$.pipe(select(selectors.getEsriLabelConfiguration)), this.store$.pipe(select(internalSelectors.getEsriLayerLabelExpressions))),
    tap(([, labelConfig, layerConfig]) => this.layerService.setLabels(labelConfig, layerConfig))
  ), { dispatch: false });

  constructor(private actions$: Actions,
              private store$: Store<AppState>,
              private mapService: EsriMapService,
              private layerService: EsriLayerService,
              private mapInteractionService: EsriMapInteractionService) {}
}
