import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';

import { concatMap, filter, tap, withLatestFrom } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { SelectedShadingLayerName } from '../../../settings';
import { EsriLayerService } from '../../services/esri-layer.service';
import { EsriShadingLayersService } from '../../services/esri-shading-layers.service';
import { AppState, internalSelectors } from '../esri.selectors';
import { EsriRendererActionTypes, SelectedGeosShading } from '../renderer/esri.renderer.actions';
import { EsriShadingActionTypes, EsriShadingActions } from './esri.shading.actions';

@Injectable()
export class EsriShadingEffects {

  @Effect({ dispatch: false})
  selectedGeosShading$ = this.actions$.pipe(
    ofType(EsriShadingActionTypes.GeoSelectionChanged),
    filter(action => action.payload.selectedGeos != null && action.payload.selectedGeos.length > 0),
    tap(action => this.shadingService.selectedGeosShading(action.payload.selectedGeos, action.payload.layerId, action.payload.minScale))
  );

  @Effect({ dispatch: false })
  clearSelectedShading$ = this.actions$.pipe(
    ofType(EsriShadingActionTypes.ClearSelectionData),
    tap(() => this.layerService.removeLayer(SelectedShadingLayerName))
  );

  constructor(private actions$: Actions<EsriShadingActions>,
              private store$: Store<AppState>,
              private layerService: EsriLayerService,
              private shadingService: EsriShadingLayersService) {}
}
