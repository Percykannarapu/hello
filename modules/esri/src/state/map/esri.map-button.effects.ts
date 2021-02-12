import { Injectable } from '@angular/core';
import Measurement from '@arcgis/core/widgets/Measurement';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { MonoTypeOperatorFunction, Observable } from 'rxjs';
import { concatMap, map, mergeMap, switchMap, takeUntil, tap, withLatestFrom } from 'rxjs/operators';
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

  @Effect()
  handlePopupButton$ = this.actions$.pipe(
    ofType(EsriMapToolbarButtonActionTypes.PopupButtonSelected),
    this.resetSketchViewGraphics(),
    mergeMap(() => [new ClearSketchView(), new SetPopupVisibility({ isVisible: true })]),
  );

  @Effect()
  handleXYButton$ = this.actions$.pipe(
    ofType(EsriMapToolbarButtonActionTypes.XYButtonSelected),
    this.resetSketchViewGraphics(),
    switchMap(() => [new ClearSketchView(), new SetPopupVisibility({ isVisible: false })]),
  );

  @Effect()
  handleSelectSinglePolyButton$ = this.actions$.pipe(
    ofType(EsriMapToolbarButtonActionTypes.SelectSinglePolySelected),
    this.resetSketchViewGraphics(),
    mergeMap(() => [new ClearSketchView(), new SetPopupVisibility({ isVisible: false })]),
  );

  @Effect({ dispatch: false })
  handleMeasureDistanceButton$ = this.actions$.pipe(
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
  );

  @Effect({ dispatch: false })
  cleanUpMeasurementTool$ = this.actions$.pipe(
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
  );

  // the takeUntil bits are there if the user picks a different button after starting the sketch view
  // without the takeUntil operator, that observable will be a hanging reference that will never close
  @Effect()
  handleSelectMultiPolyButton$ = this.actions$.pipe(
    ofType(EsriMapToolbarButtonActionTypes.SelectMultiPolySelected),
    tap(() => this.store$.dispatch(new SetPopupVisibility({ isVisible: false }))),
    this.resetSketchViewGraphics(),
    mergeMap(() => this.mapInteractionService.startSketchModel(EsriGraphicTypeCodes.Rectangle).pipe(
                          takeUntil(this.actions$.pipe(ofType(...allButtonTypes))))),
    withLatestFrom(this.store$.select(selectors.getEsriSelectedLayer)),
    mergeMap(([geometry, portalId]) => this.mapInteractionService.selectFeatures(geometry, portalId)),
    concatMap(features => [new FeaturesSelected({ features }), new SelectMultiPolySelected()])
  );

  @Effect()
  handleUnselectMultiPolyButton$ = this.actions$.pipe(
    ofType(EsriMapToolbarButtonActionTypes.UnselectMultiPolySelected),
    tap(() => this.store$.dispatch(new SetPopupVisibility({ isVisible: false }))),
    this.resetSketchViewGraphics(),
    mergeMap(() => this.mapInteractionService.startSketchModel(EsriGraphicTypeCodes.Rectangle).pipe(
                          takeUntil(this.actions$.pipe(ofType(...allButtonTypes))))),
    withLatestFrom(this.store$.select(selectors.getEsriSelectedLayer)),
    mergeMap(([geometry, portalId]) => this.mapInteractionService.selectFeatures(geometry, portalId)),
    concatMap(features => [new FeaturesSelected({ features }), new UnselectMultiPolySelected()])
  );

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
