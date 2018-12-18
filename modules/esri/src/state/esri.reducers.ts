import { apiReducer } from './api/esri.api.reducer';
import { authReducer } from './auth/esri.auth.reducer';
import { mapReducer } from './map/esri.map.reducer';
import { rendererReducer } from './map/esri.renderer.reducer';

export const esriReducers = {
  api: apiReducer,
  auth: authReducer,
  map: mapReducer,
  renderer: rendererReducer
};
