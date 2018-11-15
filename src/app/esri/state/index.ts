import { apiReducer } from './api/esri.api.reducer';
import { authReducer } from './auth/esri.auth.reducer';
import { mapReducer } from './map/esri.map.reducer';
import { EsriApiEffects } from './api/esri.api.effects';
import { EsriAuthEffects } from './auth/esri.auth.effects';
import { EsriMapEffects } from './map/esri.map.effects';
import { EsriEffects } from './esri.effects';
import { getEsriApiState, getEsriAuthState, getEsriFeatureReady, getEsriFeaturesSelected, getEsriMapButtonState, getEsriMapHeight, getEsriMapState, getEsriState, getMapReady, getEsriRendererState } from './esri.selectors';
import { EsriMapButtonEffects } from './map/esri.map-button.effects';
import { rendererReducer } from './map/esri.renderer.reducer';

export { SetMapHeight } from './map/esri.map.actions';
export { EsriState } from './esri.selectors';

export const esriReducers = {
  api: apiReducer,
  auth: authReducer,
  map: mapReducer,
  renderer: rendererReducer
};

export const allEffects = [
  EsriApiEffects,
  EsriAuthEffects,
  EsriMapEffects,
  EsriMapButtonEffects,
  EsriEffects       // EsriEffects must go last since it implements init$
];

export const selectors = {
  getEsriState,
  getEsriApiState,
  getEsriAuthState,
  getEsriMapState,
  getEsriMapButtonState,
  getEsriMapHeight,
  getEsriFeatureReady,
  getMapReady,
  getEsriFeaturesSelected,
  getEsriRendererState
};
