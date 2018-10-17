import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { EsriMapActionTypes, FeaturesSelected, InitializeMap, InitializeMapFailure, InitializeMapSuccess, MapClicked } from './esri.map.actions';
import { catchError, filter, map, mergeMap, switchMap, withLatestFrom } from 'rxjs/operators';
import { EsriMapService } from '../../services/esri-map.service';
import { of } from 'rxjs';
import { EsriMapInteractionService } from '../../services/esri-map-interaction.service';
import { AppState, getEsriMapButtonState } from '../esri.selectors';
import { select, Store } from '@ngrx/store';
import { EsriLayerService } from '../../services/esri-layer.service';
import { SelectedButtonTypeCodes } from '../../core/esri.enums';

@Injectable()
export class EsriMapEffects {

  @Effect()
  InitializeMap$ = this.actions$.pipe(
    ofType<InitializeMap>(EsriMapActionTypes.InitializeMap),
    switchMap(action => this.mapService.initializeMap(action.payload.domContainer)),
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

  constructor(private actions$: Actions,
              private store$: Store<AppState>,
              private mapService: EsriMapService,
              private layerService: EsriLayerService,
              private mapInteractionService: EsriMapInteractionService) {}
}
