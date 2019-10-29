import { createAction, props } from '@ngrx/store';

export const mapViewChanged = createAction(
  '[Esri.Shading] Map View Changed',
  props<{ visibleGeos: string[] }>()
);

export const geoSelectionChanged = createAction(
  '[Esri.Shading] Feature Selection Changed',
  props<{ selectedFeatureIds: string[], layerId: string, minScale: number, featureTypeName: string }>()
);

export const clearShadingData = createAction('[Esri.Shading] Clear Shading Data');

export const clearSelectionData = createAction(
  '[Esri.Shading] Clear Selection Data',
  props<{ featureTypeName: string }>()
);

export const addLayerToLegend = createAction(
  '[Esri.Shading] Add Layer to Legend',
  props<{ layerUniqueId: string, title: string, addToBottom?: boolean }>()
);
