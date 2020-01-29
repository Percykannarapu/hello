import { Action, ActionReducer, ActionReducerMap, combineReducers } from '@ngrx/store';
import { EsriState } from './esri.selectors';
import { initReducer } from './init/esri.init.reducer';
import { mapReducer } from './map/esri.map.reducer';
import { shadingReducer } from './shading/esri.shading.reducer';

const esriReducers: ActionReducerMap<EsriState> = {
  init: initReducer,
  map: mapReducer,
  shading: shadingReducer
};

const metaReducer: ActionReducer<EsriState> = combineReducers(esriReducers);

export function masterEsriReducer(state: EsriState, action: Action) : EsriState {
  return metaReducer(state, action);
}
