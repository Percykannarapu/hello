import { createFeatureSelector, createSelector } from '@ngrx/store';
import { EsriAuthState } from './auth/esri.auth.reducer';
import { EsriApiState } from './api/esri.api.reducer';
import { EsriMapState } from './map/esri.map.reducer';
import * as fromRoot from '../../state/app.interfaces';

export interface AppState extends fromRoot.AppState {
  esri: EsriState;
}

export interface EsriState {
  api: EsriApiState;
  auth: EsriAuthState;
  map: EsriMapState;
}

export const getEsriState = createFeatureSelector<AppState, EsriState>('esri');
export const getEsriApiState = createSelector(getEsriState, state => state.api);
export const getEsriAuthState = createSelector(getEsriState, state => state.auth);
export const getEsriMapState = createSelector(getEsriState, state => state.map);

export const getEsriFeatureReady = createSelector(getEsriApiState, getEsriAuthState, (api, auth) => api.isLoaded && auth.isAuthenticated);

export const getEsriMapButtonState = createSelector(getEsriMapState, state => state.selectedButton);
export const getEsriMapHeight = createSelector(getEsriMapState, state => state.containerHeight);
export const getEsriSketchViewModel = createSelector(getEsriMapState, state => state.sketchView);
export const getMapReady = createSelector(getEsriMapState, state => state.mapIsReady);
export const getEsriFeaturesSelected = createSelector(getEsriMapState, state => state.selectedFeatures);

