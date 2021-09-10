import { Injectable } from '@angular/core';
import Measurement from '@arcgis/core/widgets/Measurement';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { MonoTypeOperatorFunction, Observable } from 'rxjs';
import { concatMap, finalize, map, mergeMap, switchMap, takeUntil, tap, withLatestFrom } from 'rxjs/operators';
import { EsriGraphicTypeCodes } from '../../core/esri.enums';
import { EsriMapInteractionService } from '../../services/esri-map-interaction.service';
import { EsriMapService } from '../../services/esri-map.service';
import { AppState } from '../esri.reducers';
import { internalSelectors, selectors } from '../esri.selectors';
import { ClearSketchView, EsriMapToolbarButtonActionTypes, SelectMultiPolySelected, UnselectMultiPolySelected } from './esri.map-button.actions';
import { FeaturesSelected, SetPopupVisibility } from './esri.map.actions';

const allButtonTypes = [
  EsriMapToolbarButtonActionTypes.PopupButtonSelected,
  EsriMapToolbarButtonActionTypes.SelectSinglePolySelected,
  EsriMapToolbarButtonActionTypes.SelectMultiPolySelected,
  EsriMapToolbarButtonActionTypes.UnselectMultiPolySelected,
  EsriMapToolbarButtonActionTypes.MeasureDistanceSelected,
  EsriMapToolbarButtonActionTypes.XYButtonSelected
];

@Injectable()
export class EsriMapButtonEffects {

  handlePopupButton$ = createEffect(() => this.actions$.pipe(
    ofType(EsriMapToolbarButtonActionTypes.PopupButtonSelected),
    this.resetSketchViewGraphics(),
    mergeMap(() => [new ClearSketchView(), new SetPopupVisibility({ isVisible: true })]),
  ));

  handleXYButton$ = createEffect(() => this.actions$.pipe(
    ofType(EsriMapToolbarButtonActionTypes.XYButtonSelected),
    this.resetSketchViewGraphics(),
    switchMap(() => [new ClearSketchView(), new SetPopupVisibility({ isVisible: false })]),
  ));

  handleSelectSinglePolyButton$ = createEffect(() => this.actions$.pipe(
    ofType(EsriMapToolbarButtonActionTypes.SelectSinglePolySelected),
    this.resetSketchViewGraphics(),
    mergeMap(() => [new ClearSketchView(), new SetPopupVisibility({ isVisible: false })]),
  ));

  handleMeasureDistanceButton$ = createEffect(() => this.actions$.pipe(
    ofType(EsriMapToolbarButtonActionTypes.MeasureDistanceSelected),
    this.resetSketchViewGraphics(),
    map(() => this.esriMapService.getWidgetInstance<__esri.Measurement>('esri.widgets.Measurement')),
    tap(instance => {
      if (instance) {
        instance.startMeasurement();
      } else {
        this.esriMapService.createBasicWidget(Measurement, {activeTool: 'distance', linearUnit: 'miles'}, 'bottom-right');
      }
    })
  ), { dispatch: false });

  cleanUpMeasurementTool$ = createEffect(() => this.actions$.pipe(
    ofType(EsriMapToolbarButtonActionTypes.PopupButtonSelected,
      EsriMapToolbarButtonActionTypes.SelectSinglePolySelected,
      EsriMapToolbarButtonActionTypes.SelectMultiPolySelected,
      EsriMapToolbarButtonActionTypes.UnselectMultiPolySelected,
      EsriMapToolbarButtonActionTypes.XYButtonSelected),
    map(() => this.esriMapService.getWidgetInstance<__esri.Measurement>('esri.widgets.Measurement')),
    tap(instance => {
      if (instance) {
        instance.clear();
        this.esriMapService.removeWidget(instance);
      }
    })
  ), { dispatch: false });

  // the takeUntil bits are there if the user picks a different button after starting the sketch view
  // without the takeUntil operator, that observable will be a hanging reference that will never close
  handleSelectMultiPolyButton$ = createEffect(() => this.actions$.pipe(
    ofType(EsriMapToolbarButtonActionTypes.SelectMultiPolySelected),
    tap(() => this.store$.dispatch(new SetPopupVisibility({ isVisible: false }))),
    this.resetSketchViewGraphics(),
    mergeMap(() => this.mapInteractionService.startSketchModel(EsriGraphicTypeCodes.Rectangle).pipe(
                          takeUntil(this.actions$.pipe(ofType(...allButtonTypes))))),
    withLatestFrom(this.store$.select(selectors.getEsriSelectedLayer)),
    mergeMap(([geometry, portalId]) => this.mapInteractionService.selectFeatures(geometry, portalId).pipe(
      finalize(() => this.esriMapService.mapView.graphics.removeAll()) // clean up the UI
    )),
    concatMap(features => [new FeaturesSelected({ features, shouldToggle: false, shouldSelect: true }), new SelectMultiPolySelected()])
  ));

  handleUnselectMultiPolyButton$ = createEffect(() => this.actions$.pipe(
    ofType(EsriMapToolbarButtonActionTypes.UnselectMultiPolySelected),
    tap(() => this.store$.dispatch(new SetPopupVisibility({ isVisible: false }))),
    this.resetSketchViewGraphics(),
    mergeMap(() => this.mapInteractionService.startSketchModel(EsriGraphicTypeCodes.Rectangle).pipe(
                          takeUntil(this.actions$.pipe(ofType(...allButtonTypes))))),
    withLatestFrom(this.store$.select(selectors.getEsriSelectedLayer)),
    mergeMap(([geometry, portalId]) => this.mapInteractionService.selectFeatures(geometry, portalId).pipe(
      finalize(() => this.esriMapService.mapView.graphics.removeAll()) // clean up the UI
    )),
    concatMap(features => [new FeaturesSelected({ features, shouldToggle: false, shouldSelect: false }), new UnselectMultiPolySelected()])
  ));

  constructor(private actions$: Actions,
              private store$: Store<AppState>,
              private mapInteractionService: EsriMapInteractionService,
              private esriMapService: EsriMapService) {}

  resetSketchViewGraphics<T extends Action>() : MonoTypeOperatorFunction<T> {
    return (source$: Observable<T>) : Observable<T> => {
      return source$.pipe(
        withLatestFrom(this.store$.select(internalSelectors.getEsriSketchViewModel)),
        tap(([, model]) => this.mapInteractionService.abortSketchModel(model)),
        map(([action]) => action)
      );
    };
  }
}
