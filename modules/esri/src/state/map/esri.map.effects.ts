import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { EsriMapActionTypes, FeaturesSelected, InitializeMap, InitializeMapFailure, InitializeMapSuccess, MapClicked, SetPopupVisibility } from './esri.map.actions';
import { catchError, filter, map, mergeMap, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { of } from 'rxjs';
import { AppState, getEsriMapButtonState } from '../esri.selectors';
import { select, Store } from '@ngrx/store';
import { SelectedButtonTypeCodes } from '../../core';
import { EsriLayerService, EsriMapInteractionService, EsriMapService } from '../../services';

@Injectable()
export class EsriMapEffects {

  @Effect()
  InitializeMap$ = this.actions$.pipe(
    ofType<InitializeMap>(EsriMapActionTypes.InitializeMap),
    switchMap(action => this.mapService.initializeMap(action.payload.domContainer, action.payload.baseMap)),
    map(() => new InitializeMapSuccess()),
    catchError(err => of(new InitializeMapFailure({ errorResponse: err })))
  );

  @Effect()
  handleMapClick$ = this.actions$.pipe(
    ofType<MapClicked>(EsriMapActionTypes.MapClicked),
    withLatestFrom(this.store$.pipe(select(getEsriMapButtonState))),
    filter(([action, state]) => state === SelectedButtonTypeCodes.SelectSinglePoly),
    mergeMap(([action]) => this.mapInteractionService.processClick(action.payload.event)),
    map(features => new FeaturesSelected({ features }))
  );

  @Effect({ dispatch: false })
  handlePopupVisibilityChange$ = this.actions$.pipe(
    ofType<SetPopupVisibility>(EsriMapActionTypes.SetPopupVisibility),
    tap(action => this.layerService.setAllPopupStates(action.payload.isVisible))
  );

  constructor(private actions$: Actions,
              private store$: Store<AppState>,
              private mapService: EsriMapService,
              private layerService: EsriLayerService,
              private mapInteractionService: EsriMapInteractionService) {}
}
