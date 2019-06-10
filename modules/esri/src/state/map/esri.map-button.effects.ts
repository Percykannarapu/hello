import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { concatMap, map, mergeMap, takeUntil, tap, withLatestFrom, switchMap } from 'rxjs/operators';
import { MonoTypeOperatorFunction, Observable } from 'rxjs';
import { EsriMapInteractionService } from '../../services/esri-map-interaction.service';
import { ClearSketchView, EsriMapToolbarButtonActionTypes, SelectMultiPolySelected, UnselectMultiPolySelected } from './esri.map-button.actions';
import { EsriGraphicTypeCodes } from '../../core/esri.enums';
import { Action, select, Store } from '@ngrx/store';
import { AppState, internalSelectors } from '../esri.selectors';
import { EsriMapService } from '../../services/esri-map.service';
import { FeaturesSelected, SetPopupVisibility } from './esri.map.actions';

const allButtonTypes = [
  EsriMapToolbarButtonActionTypes.PopupButtonSelected,
  EsriMapToolbarButtonActionTypes.SelectSinglePolySelected,
  EsriMapToolbarButtonActionTypes.SelectMultiPolySelected,
  EsriMapToolbarButtonActionTypes.UnselectMultiPolySelected,
  EsriMapToolbarButtonActionTypes.MeasureDistanceSelected,
];

@Injectable()
export class EsriMapButtonEffects {

  @Effect()
  handlePopupButton$ = this.actions$.pipe(
    ofType(EsriMapToolbarButtonActionTypes.PopupButtonSelected),
    this.resetSketchViewGraphics(),
    mergeMap(() => [new ClearSketchView(), new SetPopupVisibility({ isVisible: true })]),
    tap(() => this.esriMapService.setWidget('default'))
  );

  @Effect()
  handleXYButton$ = this.actions$.pipe(
    ofType(EsriMapToolbarButtonActionTypes.XYButtonSelected),    
    this.resetSketchViewGraphics(),
    switchMap(() => [new ClearSketchView(), new SetPopupVisibility({ isVisible: false })]),
    tap(() => this.esriMapService.setWidget('default'))
  );

  @Effect()
  handleSelectSinglePolyButton$ = this.actions$.pipe(
    ofType(EsriMapToolbarButtonActionTypes.SelectSinglePolySelected),
    this.resetSketchViewGraphics(),
    mergeMap(() => [new ClearSketchView(), new SetPopupVisibility({ isVisible: false })]),
    tap(() => this.esriMapService.setWidget('copy'))
  );

  // the takeUntil bits are there if the user picks a different button after starting the sketch view
  // without the takeUntil operator, that observable will be a hanging reference that will never close
  @Effect({ dispatch: false })
  handleMeasureDistanceButton$ = this.actions$.pipe(
    ofType(EsriMapToolbarButtonActionTypes.MeasureDistanceSelected),
    // tap(() => this.store$.dispatch(new SetPopupVisibility({ isVisible: false }))),
    this.resetSketchViewGraphics(),
    mergeMap(() => [new ClearSketchView()]),
    tap(() => {
      this.esriMapService.setWidget(null);
      this.esriMapService.setWidget('measure');
    })
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

  @Effect()
  handleUnselectMultiPolyButton$ = this.actions$.pipe(
    ofType(EsriMapToolbarButtonActionTypes.UnselectMultiPolySelected),
    tap(() => this.store$.dispatch(new SetPopupVisibility({ isVisible: false }))),
    this.resetSketchViewGraphics(),
    mergeMap(() => this.mapInteractionService.startSketchModel(EsriGraphicTypeCodes.Rectangle).pipe(
                          takeUntil(this.actions$.pipe(ofType(...allButtonTypes))))),
    mergeMap(geometry => this.mapInteractionService.selectFeatures(geometry)),
    concatMap(features => [new FeaturesSelected({ features }), new UnselectMultiPolySelected()])
  ); 

  constructor(private actions$: Actions,
              private store$: Store<AppState>,
              private mapInteractionService: EsriMapInteractionService,
              private esriMapService: EsriMapService) {}

  resetSketchViewGraphics<T extends Action>() : MonoTypeOperatorFunction<T> {
    return (source$: Observable<T>) : Observable<T> => {
      return source$.pipe(
        withLatestFrom(this.store$.pipe(select(internalSelectors.getEsriSketchViewModel))),
        tap(([action, model]) => this.mapInteractionService.abortSketchModel(model)),
        map(([action]) => action)
      );
    };
  }

  handleMultiPolySelection<T extends Action>() : (source$: Observable<T>) => Observable<__esri.Graphic[]> {
    return (source$: Observable<T>) : Observable<__esri.Graphic[]> => {
      return source$.pipe(
        tap(() => this.store$.dispatch(new SetPopupVisibility({ isVisible: false }))),
        this.resetSketchViewGraphics(),
        mergeMap(() => this.mapInteractionService.startSketchModel(EsriGraphicTypeCodes.Rectangle).pipe(
          takeUntil(this.actions$.pipe(ofType(...allButtonTypes))))),
        mergeMap(geometry => this.mapInteractionService.selectFeatures(geometry))
      );
    };
  }
}
