import { ActionReducerMap } from '@ngrx/store';
import { apiReducer } from './api/esri.api.reducer';
import { authReducer } from './auth/esri.auth.reducer';
import { EsriState } from './esri.selectors';
import { mapReducer } from './map/esri.map.reducer';
import { shadingReducer } from './shading/esri.shading.reducer';

export const esriReducers: ActionReducerMap<EsriState> = {
  api: apiReducer,
  auth: authReducer,
  map: mapReducer,
  shading: shadingReducer
};
