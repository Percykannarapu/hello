import { Action, ActionReducer, ActionReducerMap, combineReducers } from '@ngrx/store';
import { EsriInitState, initReducer } from './init/esri.init.reducer';
import { EsriMapState, mapReducer } from './map/esri.map.reducer';
import { EsriPoiState, poiReducer } from './poi/esri.poi.reducer';
import { EsriShadingState, shadingReducer } from './shading/esri.shading.reducer';

export interface AppState {
  esri: EsriState;
}

export interface EsriState {
  init: EsriInitState;
  map: EsriMapState;
  shading: EsriShadingState;
  poi: EsriPoiState;
}

const esriReducers: ActionReducerMap<EsriState> = {
  init: initReducer,
  map: mapReducer,
  shading: shadingReducer,
  poi: poiReducer,
};

const metaReducer: ActionReducer<EsriState> = combineReducers(esriReducers);

export function masterEsriReducer(state: EsriState, action: Action) : EsriState {
  return metaReducer(state, action);
}
