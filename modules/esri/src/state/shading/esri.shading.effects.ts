import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter, map, tap } from 'rxjs/operators';
import { EsriShadingLayersService } from '../../services/esri-shading-layers.service';
import { AppState } from '../esri.selectors';
import { clearSelectionData, geoSelectionChanged } from './esri.shading.actions';

@Injectable()
export class EsriShadingEffects {

  selectedGeosShading$ = createEffect(() =>
    this.actions$.pipe(
      ofType(geoSelectionChanged),
      filter(payload => payload.selectedFeatureIds != null && payload.selectedFeatureIds.length > 0),
      tap(payload => this.shadingService.selectedFeaturesShading(payload.selectedFeatureIds, payload.layerId, payload.minScale, payload.featureTypeName))
    ),
    { dispatch: false }
  );

  inActiveGeosShading$ = createEffect(() =>
    this.actions$.pipe(
      ofType(geoSelectionChanged),
      filter(payload => payload.selectedFeatureIds != null && payload.selectedFeatureIds.length === 0),
      map(payload => clearSelectionData({ featureTypeName: payload.featureTypeName }))
    )
  );

  clearSelectedShading$ = createEffect(() => this.actions$.pipe(
      ofType(clearSelectionData),
      tap(payload => this.shadingService.clearFeatureSelection(payload.featureTypeName))
    ),
    { dispatch: false }
  );

  constructor(private actions$: Actions,
              private store$: Store<AppState>,
              private shadingService: EsriShadingLayersService) {}
}
