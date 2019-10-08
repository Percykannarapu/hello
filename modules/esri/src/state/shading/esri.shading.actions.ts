import { createAction, props } from '@ngrx/store';

export const mapViewChanged = createAction(
  '[Esri.Shading] Map View Changed',
  props<{ visibleGeos: string[] }>()
);

export const geoSelectionChanged = createAction(
  '[Esri.Shading] Geo Selection Changed',
  props<{ selectedGeos: string[], layerId: string, minScale: number, geoType: string }>()
);

export const clearShadingData = createAction('[Esri.Shading] Clear Shading Data');

export const clearSelectionData = createAction('[Esri.Shading] Clear Selection Data');
