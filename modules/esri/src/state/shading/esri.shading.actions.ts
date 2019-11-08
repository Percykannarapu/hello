import { createAction, props } from '@ngrx/store';
import { ColorPalette } from '../../models/color-palettes';
import { MapVar } from '../../../../../applications/impower/app/impower-datastore/state/transient/map-vars/map-vars.model';

export const mapViewChanged = createAction(
  '[Esri.Shading] Map View Changed',
  props<{ visibleGeos: string[] }>()
);

export const geoSelectionChanged = createAction(
  '[Esri.Shading] Feature Selection Changed',
  props<{ selectedFeatureIds: string[], layerId: string, minScale: number, useCrossHatching: boolean, featureTypeName: string }>()
);

export const clearShadingData = createAction('[Esri.Shading] Clear Shading Data');

export const applyAudienceShading = createAction(
  '[Esri.Shading] Apply Audience Shading',
  props<{ theme: ColorPalette, audienceVariable: string }>()
  );

export const clearSelectionData = createAction(
  '[Esri.Shading] Clear Selection Data',
  props<{ featureTypeName: string }>()
);

export const addLayerToLegend = createAction(
  '[Esri.Shading] Add Layer to Legend',
  props<{ layerUniqueId: string, title: string, addToBottom?: boolean }>()
);

export const audienceShading = createAction(
  '[Esri.Shading] Audience Shading',
  props<{ mapVars: MapVar[], layerId: string, minScale: number}>()
);
