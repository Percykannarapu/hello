import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { EsriLayerService } from '../../services/esri-layer.service';
import { EsriMapService } from '../../services/esri-map.service';
import { EsriShadingLayersService } from '../../services/esri-shading-layers.service';
import { AppState } from '../esri.selectors';
import { addLayerToLegend, clearSelectionData, geoSelectionChanged, applyAudienceShading, clearAudienceShading } from './esri.shading.actions';

@Injectable()
export class EsriShadingEffects {

  selectedGeosShading$ = createEffect(() =>
    this.actions$.pipe(
      ofType(geoSelectionChanged),
      filter(payload => payload.selectedFeatureIds != null && payload.selectedFeatureIds.length > 0),
      switchMap(payload => this.shadingService.selectedFeaturesShading(payload.selectedFeatureIds, payload.layerId, payload.minScale, payload.featureTypeName, payload.useCrossHatching)),
      map(id => addLayerToLegend({ layerUniqueId: id, title: null }))
    )
  );

  audienceShading$ = createEffect(() =>
      this.actions$.pipe(
        ofType(applyAudienceShading),
        switchMap(payload => this.shadingService.audienceShading(payload.mapVars, payload.layerId, payload.minScale, payload.theme, payload.audienceName, payload.isTextVariable)),
        map(([id, title]) => addLayerToLegend({ layerUniqueId: id, title: title }))
      )
  );

  clearShading$ = createEffect(() =>
    this.actions$.pipe(
      ofType(clearAudienceShading),
      tap(() => this.shadingService.clearAudienceShading())
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

  addLayerToLegend$ = createEffect(() => this.actions$.pipe(
      ofType(addLayerToLegend),
      tap(payload => this.layerService.addLayerToLegend(payload.layerUniqueId, payload.title))
    ),
    { dispatch: false }
  );

  constructor(private actions$: Actions,
              private store$: Store<AppState>,
              private shadingService: EsriShadingLayersService,
              private mapService: EsriMapService,
              private layerService: EsriLayerService) {}
}
