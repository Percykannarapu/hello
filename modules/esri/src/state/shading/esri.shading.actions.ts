import { Update } from '@ngrx/entity';
import { createAction, props } from '@ngrx/store';
import { ShadingDefinition } from '../../models/shading-configuration';

export const addLayerToLegend = createAction(
  '[Esri.Shading] Add Layer to Legend',
  props<{ layerUniqueId: string, title: string }>()
);

export const setFeaturesOfInterest = createAction(
  '[Esri.Shading] Set Features of Interest',
  ({ features = [] }: { features: string[] }) => ({ features: features || [] })
);

export const clearFeaturesOfInterest = createAction(
  '[Esri.Shading] Clear Features of Interest'
);

export const loadShadingDefinitions = createAction(
  '[Esri.Shading] Load ShadingDefinitions',
  props<{ shadingDefinitions: ShadingDefinition[] }>()
);

export const addShadingDefinition = createAction(
  '[Esri.Shading] Add ShadingDefinition',
  props<{ shadingDefinition: ShadingDefinition }>()
);

export const upsertShadingDefinition = createAction(
  '[Esri.Shading] Upsert ShadingDefinition',
  props<{ shadingDefinition: ShadingDefinition }>()
);

export const addShadingDefinitions = createAction(
  '[Esri.Shading] Add ShadingDefinitions',
  props<{ shadingDefinitions: ShadingDefinition[] }>()
);

export const upsertShadingDefinitions = createAction(
  '[Esri.Shading] Upsert ShadingDefinitions',
  props<{ shadingDefinitions: ShadingDefinition[] }>()
);

export const updateShadingDefinition = createAction(
  '[Esri.Shading] Update ShadingDefinition',
  props<{ shadingDefinition: Update<ShadingDefinition> }>()
);

export const updateShadingDefinitions = createAction(
  '[Esri.Shading] Update ShadingDefinitions',
  props<{ shadingDefinitions: Update<ShadingDefinition>[] }>()
);

export const deleteShadingDefinition = createAction(
  '[Esri.Shading] Delete ShadingDefinition',
  props<{ id: string }>()
);

export const deleteShadingDefinitions = createAction(
  '[Esri.Shading] Delete ShadingDefinitions',
  props<{ ids: string[] }>()
);

export const clearShadingDefinitions = createAction(
  '[Esri.Shading] Clear ShadingDefinitions'
);

export const resetShading = createAction(
  '[Esri.Shading] Reset Shading'
);
