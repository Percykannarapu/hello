import { createFeatureSelector, createSelector } from '@ngrx/store';
import { EsriAuthState } from './auth/esri.auth.reducer';
import { EsriApiState } from './api/esri.api.reducer';
import { EsriMapState } from './map/esri.map.reducer';
import { EsriRendererState } from './map/esri.renderer.reducer';

export interface AppState {
  esri: EsriState;
}

export interface EsriState {
  api: EsriApiState;
  auth: EsriAuthState;
  map: EsriMapState;
  renderer: EsriRendererState;
}

const getEsriState = createFeatureSelector<AppState, EsriState>('esri');
const getEsriApiState = createSelector(getEsriState, state => state.api);
const getEsriAuthState = createSelector(getEsriState, state => state.auth);
const getEsriMapState = createSelector(getEsriState, state => state != null ? state.map : null);
const getEsriRendererState = createSelector(getEsriState, state => state != null ? state.renderer : null);
const getEsriRendererNumericData = createSelector(getEsriRendererState, state => state != null ? state.numericShadingData : null);
const getEsriRendererTextData = createSelector(getEsriRendererState, state => state != null ? state.textShadingData : null);
const getEsriRendererSelectedGeocodes = createSelector(getEsriRendererState, state => state != null ? state.selectedGeocodes : null);
const getEsriViewpointState = createSelector(getEsriState, state => state != null ? state.map.mapViewpoint : null);
const getEsriLabelConfiguration = createSelector(getEsriMapState, state => state != null ? state.labelConfiguration : null);
const getEsriSelectedLayer = createSelector(getEsriMapState, state => state != null ? state.selectedLayerId : null);

const getEsriFeatureReady = createSelector(getEsriApiState, getEsriAuthState, (api, auth) => api.isLoaded && auth.isAuthenticated);

const getEsriMapButtonState = createSelector(getEsriMapState, state => state.selectedButton);
const getEsriMapHeight = createSelector(getEsriMapState, state => state.containerHeight);
const getEsriSketchViewModel = createSelector(getEsriMapState, state => state.sketchView);
const getMapReady = createSelector(getEsriMapState, state => state.mapIsReady);
const getEsriFeaturesSelected = createSelector(getEsriMapState, state => state.selectedFeatures);

// These are the publicly available selectors
export const selectors = {
  getEsriFeatureReady,
  getMapReady,
  getEsriFeaturesSelected,
  getEsriViewpointState
};

export const internalSelectors = {
  getEsriState,
  getEsriMapState,
  getEsriMapButtonState,
  getEsriSketchViewModel,
  getEsriMapHeight,
  getEsriLabelConfiguration,
  getEsriRendererState,
  getEsriRendererSelectedGeocodes,
  getEsriRendererNumericData,
  getEsriRendererTextData
};
