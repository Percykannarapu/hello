import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ConfigurationTypes, ShadingDefinition } from '../models/shading-configuration';
import { EsriApiState } from './api/esri.api.reducer';
import { EsriAuthState } from './auth/esri.auth.reducer';
import { EsriMapState } from './map/esri.map.reducer';
import * as fromShading from './shading/esri.shading.reducer';
import { EsriShadingState } from './shading/esri.shading.reducer';

export interface AppState {
  esri: EsriState;
}

export interface EsriState {
  api: EsriApiState;
  auth: EsriAuthState;
  map: EsriMapState;
  shading: EsriShadingState;
}

const getEsriState = createFeatureSelector<AppState, EsriState>('esri');
const getEsriApiState = createSelector(getEsriState, state => state.api);
const getEsriAuthState = createSelector(getEsriState, state => state.auth);
const getEsriMapState = createSelector(getEsriState, state => state.map);
const getEsriShadingSlice = createSelector(getEsriState, state => state.shading);

const getEsriFeatureReady = createSelector(getEsriApiState, getEsriAuthState, (api, auth) => api.isLoaded && auth.isAuthenticated);

const getEsriViewpointState = createSelector(getEsriMapState, state => state.mapViewpoint);
const getEsriLabelConfiguration = createSelector(getEsriMapState, state => state.labelConfiguration);
const getEsriLayerLabelExpressions = createSelector(getEsriMapState, state => state.layerExpressions);
const getEsriSelectedLayer = createSelector(getEsriMapState, state => state.selectedLayerId);
const getEsriMapButtonState = createSelector(getEsriMapState, state => state.selectedButton);
const getEsriMapHeight = createSelector(getEsriMapState, state => state.containerHeight);
const getEsriSketchViewModel = createSelector(getEsriMapState, state => state.sketchView);
const getMapReady = createSelector(getEsriMapState, state => state.mapIsReady);
const getEsriFeaturesSelected = createSelector(getEsriMapState, state => state.selectedFeatures);

const getEsriShadingTheme = createSelector(getEsriShadingSlice, state => state.theme);
const getEsriShadingFeatures = createSelector(getEsriShadingSlice, state => state.featuresOfInterest);
const getEsriShadingFeaturesCsv = createSelector(getEsriShadingFeatures, features => (features as any[]).map(f => `'${f}'`).join(','));
const getEsriShadingDefs = createSelector(getEsriShadingSlice, fromShading.selectAll);
const getEsriShadingDefsForCreate = createSelector(getEsriShadingDefs, layers => layers.filter(shadingDefinitionIsReady));
const getEsriShadingDefsForUpdate = createSelector(getEsriShadingDefs, layers => layers.filter(l => l.destinationLayerUniqueId != null));
const getEsriShadingLayerIds = createSelector(getEsriShadingDefsForUpdate, layers => layers.map(l => l.destinationLayerUniqueId));

function shadingDefinitionIsReady(def: ShadingDefinition) : boolean {
  switch (def.shadingType) {
    case ConfigurationTypes.Simple:
      return def.destinationLayerUniqueId == null;
    case ConfigurationTypes.Unique:
    case ConfigurationTypes.Ramp:
    case ConfigurationTypes.ClassBreak:
      return def.destinationLayerUniqueId == null && (def.breakDefinitions || []).length > 0;
  }
}

// These are the publicly available selectors
export const selectors = {
  getEsriFeatureReady,
  getMapReady,
  getEsriFeaturesSelected,
  getEsriLabelConfiguration,
  getEsriViewpointState,
  getEsriSelectedLayer,
};

export const shadingSelectors = {
  theme: getEsriShadingTheme,
  features: getEsriShadingFeatures,
  featuresCsv: getEsriShadingFeaturesCsv,
  allLayerDefs: getEsriShadingDefs,
  layerDefsToCreate: getEsriShadingDefsForCreate,
  layerDefsForUpdate: getEsriShadingDefsForUpdate,
  layerUniqueIds: getEsriShadingLayerIds
};

export const internalSelectors = {
  getEsriState,
  getEsriMapState,
  getEsriMapButtonState,
  getEsriSketchViewModel,
  getEsriMapHeight,
  getEsriLayerLabelExpressions
};
