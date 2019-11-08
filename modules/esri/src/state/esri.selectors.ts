import { createFeatureSelector, createSelector } from '@ngrx/store';
import { EsriAuthState } from './auth/esri.auth.reducer';
import { EsriApiState } from './api/esri.api.reducer';
import { EsriMapState } from './map/esri.map.reducer';
import { EsriRendererState } from './renderer/esri.renderer.reducer';
import { EsriShadingState } from './shading/esri.shading.reducer';

export interface AppState {
  esri: EsriState;
}

export interface EsriState {
  api: EsriApiState;
  auth: EsriAuthState;
  map: EsriMapState;
  renderer: EsriRendererState;
  shading: EsriShadingState;
}

const getEsriState = createFeatureSelector<AppState, EsriState>('esri');
// const getEsriState = (state: AppState) => state.esri;
const getEsriApiState = createSelector(getEsriState, state => state.api);
const getEsriAuthState = createSelector(getEsriState, state => state.auth);
const getEsriMapState = createSelector(getEsriState, state => state.map);
const getEsriRendererState = createSelector(getEsriState, state => state.renderer);

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

const getEsriRendererIsShaded = createSelector(getEsriRendererState, state => state.enableShading);

// These are the publicly available selectors
export const selectors = {
  getEsriFeatureReady,
  getMapReady,
  getEsriFeaturesSelected,
  getEsriLabelConfiguration,
  getEsriViewpointState,
  getEsriSelectedLayer,
  getEsriRendererIsShaded
};

export const internalSelectors = {
  getEsriState,
  getEsriMapState,
  getEsriMapButtonState,
  getEsriSketchViewModel,
  getEsriMapHeight,
  getEsriLayerLabelExpressions,
  getEsriRendererState
};
