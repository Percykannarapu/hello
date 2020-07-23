import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AppState, EsriState } from './esri.reducers';

const getEsriState = createFeatureSelector<AppState, EsriState>('esri');
const getEsriInitState = createSelector(getEsriState, state => state.init);
const getEsriMapState = createSelector(getEsriState, state => state.map);

const getEsriInitialized = createSelector(getEsriInitState, state => state.isInitialized);
const getEsriFeatureReady = createSelector(getEsriInitState, (auth) => auth.isAuthenticated);

const getEsriViewpointState = createSelector(getEsriMapState, state => state.mapViewpoint);
const getEsriLabelConfiguration = createSelector(getEsriMapState, state => state.labelConfiguration);
const getEsriLayerLabelExpressions = createSelector(getEsriMapState, state => state.layerExpressions);
const getEsriSelectedLayer = createSelector(getEsriMapState, state => state.selectedLayerId);
const getEsriMapButtonState = createSelector(getEsriMapState, state => state.selectedButton);
const getEsriMapHeight = createSelector(getEsriMapState, state => state.containerHeight);
const getEsriSketchViewModel = createSelector(getEsriMapState, state => state.sketchView);
const getMapReady = createSelector(getEsriMapState, state => state.mapIsReady);
const getEsriFeaturesSelected = createSelector(getEsriMapState, state => state.selectedFeatures);

const selectedLayerFeatures = (selectedFeatures: __esri.Graphic[], selectedLayerId: string) => {
  if (selectedFeatures == null || selectedLayerId == null || selectedFeatures.length === 0 ) return null;
  const filteredFeatures: __esri.Graphic[] = [];
  selectedFeatures.forEach(feature => {
    if (feature.layer != null && feature.layer['portalItem'] != null && feature.layer['portalItem'].id === selectedLayerId)
      filteredFeatures.push(feature) ;
  });
  return filteredFeatures;
};

const getEsriFeatureForSelectedLayer = createSelector(getEsriFeaturesSelected, getEsriSelectedLayer, selectedLayerFeatures);

// These are the publicly available selectors
export const selectors = {
  getEsriFeatureReady,
  getMapReady,
  getEsriFeaturesSelected,
  getEsriLabelConfiguration,
  getEsriViewpointState,
  getEsriSelectedLayer,
  getEsriFeatureForSelectedLayer,
};

export const internalSelectors = {
  getEsriInitialized,
  getEsriState,
  getEsriMapState,
  getEsriMapButtonState,
  getEsriSketchViewModel,
  getEsriMapHeight,
  getEsriLayerLabelExpressions
};
