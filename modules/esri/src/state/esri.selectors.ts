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

export const getEsriState = createFeatureSelector<AppState, EsriState>('esri');
export const getEsriApiState = createSelector(getEsriState, state => state.api);
export const getEsriAuthState = createSelector(getEsriState, state => state.auth);
export const getEsriMapState = createSelector(getEsriState, state => state != null ? state.map : null);
export const getEsriRendererState = createSelector(getEsriState, state => state != null ? state.renderer : null);
export const getEsriRendererNumericData = createSelector(getEsriRendererState, state => state != null ? state.numericShadingData : null);
export const getEsriRendererTextData = createSelector(getEsriRendererState, state => state != null ? state.textShadingData : null);
export const getEsriRendererSelectedGeocodes = createSelector(getEsriRendererState, state => state != null ? state.selectedGeocodes : null);
export const getEsriViewpointState = createSelector(getEsriState, state => state != null ? state.map.mapViewpoint : null);
export const getEsriLabelConfiguration = createSelector(getEsriMapState, state => state != null ? state.labelConfiguration : null);
export const getEsriSelectedLayer = createSelector(getEsriMapState, state => state != null ? state.selectedLayerId : null);

export const getEsriFeatureReady = createSelector(getEsriApiState, getEsriAuthState, (api, auth) => api.isLoaded && auth.isAuthenticated);

export const getEsriMapButtonState = createSelector(getEsriMapState, state => state.selectedButton);
export const getEsriMapHeight = createSelector(getEsriMapState, state => state.containerHeight);
export const getEsriSketchViewModel = createSelector(getEsriMapState, state => state.sketchView);
export const getMapReady = createSelector(getEsriMapState, state => state.mapIsReady);
export const getEsriFeaturesSelected = createSelector(getEsriMapState, state => state.selectedFeatures);
