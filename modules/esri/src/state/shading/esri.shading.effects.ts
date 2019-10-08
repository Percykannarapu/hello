import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter, tap } from 'rxjs/operators';
import { SelectedShadingLayerName } from '../../../settings';
import { EsriLayerService } from '../../services/esri-layer.service';
import { EsriShadingLayersService } from '../../services/esri-shading-layers.service';
import { AppState } from '../esri.selectors';
import { clearSelectionData, geoSelectionChanged } from './esri.shading.actions';

@Injectable()
export class EsriShadingEffects {

  selectedGeosShading$ = createEffect(() =>
    this.actions$.pipe(
      ofType(geoSelectionChanged),
      filter(action => action.selectedGeos != null),
      tap(payload => this.shadingService.selectedGeosShading(payload.selectedGeos, payload.layerId, payload.minScale, payload.geoType))
    ),
    { dispatch: false }
  );

  clearSelectedShading$ = createEffect(() => this.actions$.pipe(
      ofType(clearSelectionData),
      tap(() => this.layerService.removeLayer(SelectedShadingLayerName))
    ),
    { dispatch: false }
  );

  constructor(private actions$: Actions,
              private store$: Store<AppState>,
              private layerService: EsriLayerService,
              private shadingService: EsriShadingLayersService) {}
}
