import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AppState, EsriState } from './esri.reducers';

const getEsriState = createFeatureSelector<AppState, EsriState>('esri');
const getEsriInitState = createSelector(getEsriState, state => state.init);
const getEsriMapState = createSelector(getEsriState, state => state.map);

const getEsriInitialized = createSelector(getEsriInitState, state => state.isInitialized);
const getEsriFeatureReady = createSelector(getEsriInitState, state => state.isAuthenticated);
const getNetworkOnline = createSelector(getEsriInitState, state => state.isOnline);
const getEsriToken = createSelector(getEsriInitState, state => state.tokenResponse)

const getEsriViewpointState = createSelector(getEsriMapState, state => state.mapViewpoint);
const getEsriLabelConfiguration = createSelector(getEsriMapState, state => state.labelConfiguration);
const getEsriLayerLabelExpressions = createSelector(getEsriMapState, state => state.layerExpressions);
const getEsriSelectedLayer = createSelector(getEsriMapState, state => state.selectedLayerId);
const getEsriMapButtonState = createSelector(getEsriMapState, state => state.selectedButton);
const getEsriMapHeight = createSelector(getEsriMapState, state => state.containerHeight);
const getEsriSketchViewModel = createSelector(getEsriMapState, state => state.sketchView);
const getMapReady = createSelector(getEsriMapState, state => state.mapIsReady);

const getEsriSelectedFeatures = createSelector(getEsriMapState, state => state.selectedFeatures);
const getEsriSelectedFeaturesToggle = createSelector(getEsriMapState, state => state.selectedFeaturesToggle);
const getEsriSelectedFeaturesSelect = createSelector(getEsriMapState, state => state.selectedFeaturesSelect);

// These are the publicly available selectors
export const selectors = {
  getEsriFeatureReady,
  getMapReady,
  getEsriLabelConfiguration,
  getEsriViewpointState,
  getEsriSelectedLayer,
};

export const internalSelectors = {
  getEsriInitialized,
  getEsriState,
  getEsriMapState,
  getEsriMapButtonState,
  getEsriSketchViewModel,
  getEsriMapHeight,
  getEsriLayerLabelExpressions,
  getEsriSelectedFeatures,
  getEsriSelectedFeaturesToggle,
  getEsriSelectedFeaturesSelect,
  getNetworkOnline,
  getEsriToken
};
