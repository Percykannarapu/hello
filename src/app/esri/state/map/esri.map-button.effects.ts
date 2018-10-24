import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { concatMap, map, mergeMap, takeUntil, tap, withLatestFrom } from 'rxjs/operators';
import { MonoTypeOperatorFunction, Observable } from 'rxjs';
import { EsriMapService } from '../../services/esri-map.service';
import { EsriLayerService } from '../../services/esri-layer.service';
import { EsriMapInteractionService } from '../../services/esri-map-interaction.service';
import { ClearSketchView, EsriMapToolbarButtonActionTypes, SelectMultiPolySelected } from './esri.map-button.actions';
import { EsriGraphicTypeCodes } from '../../core/esri.enums';
import { Action, select, Store } from '@ngrx/store';
import { AppState, getEsriSketchViewModel } from '../esri.selectors';
import { FeaturesSelected, SetPopupVisibility } from './esri.map.actions';

const allButtonTypes = [
  EsriMapToolbarButtonActionTypes.PopupButtonSelected,
  EsriMapToolbarButtonActionTypes.SelectSinglePolySelected,
  EsriMapToolbarButtonActionTypes.SelectMultiPolySelected,
  EsriMapToolbarButtonActionTypes.MeasureDistanceSelected,
];

@Injectable()
export class EsriMapButtonEffects {

  @Effect()
  handlePopupButton$ = this.actions$.pipe(
    ofType(EsriMapToolbarButtonActionTypes.PopupButtonSelected),
    this.resetSketchViewGraphics(),
    mergeMap(() => [new ClearSketchView(), new SetPopupVisibility({ isVisible: true })])
  );

  @Effect()
  handleSelectSinglePolyButton$ = this.actions$.pipe(
    ofType(EsriMapToolbarButtonActionTypes.SelectSinglePolySelected),
    this.resetSketchViewGraphics(),
    mergeMap(() => [new ClearSketchView(), new SetPopupVisibility({ isVisible: false })])
  );

  // the takeUntil bits are there if the user picks a different button after starting the sketch view
  // without the takeUntil operator, that observable will be a hanging reference that will never close
  @Effect({ dispatch: false })
  handleMeasureDistanceButton$ = this.actions$.pipe(
    ofType(EsriMapToolbarButtonActionTypes.MeasureDistanceSelected),
    tap(() => this.store$.dispatch(new SetPopupVisibility({ isVisible: false }))),
    this.resetSketchViewGraphics(),
    mergeMap(() => this.mapInteractionService.startSketchModel(EsriGraphicTypeCodes.Polyline).pipe(
                          takeUntil(this.actions$.pipe(ofType(...allButtonTypes))))),
    tap(geometry => this.mapInteractionService.measurePolyLine(geometry))
  );

  @Effect()
  handleSelectMultiPolyButton$ = this.actions$.pipe(
    ofType(EsriMapToolbarButtonActionTypes.SelectMultiPolySelected),
    tap(() => this.store$.dispatch(new SetPopupVisibility({ isVisible: false }))),
    this.resetSketchViewGraphics(),
    mergeMap(() => this.mapInteractionService.startSketchModel(EsriGraphicTypeCodes.Rectangle).pipe(
                          takeUntil(this.actions$.pipe(ofType(...allButtonTypes))))),
    mergeMap(geometry => this.mapInteractionService.selectFeatures(geometry)),
    concatMap(features => [new FeaturesSelected({ features }), new SelectMultiPolySelected()])
  );

  constructor(private actions$: Actions,
              private store$: Store<AppState>,
              private mapService: EsriMapService,
              private layerService: EsriLayerService,
              private mapInteractionService: EsriMapInteractionService) {}

  resetSketchViewGraphics<T extends Action>() : MonoTypeOperatorFunction<T> {
    return (source$: Observable<T>) : Observable<T> => {
      return source$.pipe(
        withLatestFrom(this.store$.pipe(select(getEsriSketchViewModel))),
        tap(([action, model]) => this.mapInteractionService.abortSketchModel(model)),
        map(([action]) => action)
      );
    };
  }
}
