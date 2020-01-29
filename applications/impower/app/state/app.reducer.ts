import { routerReducer } from '@ngrx/router-store';
import { Action, ActionReducer, ActionReducerMap, combineReducers, createFeatureSelector, MetaReducer } from '@ngrx/store';
import { LogLevels } from '@val/common';
import { environment } from '../../environments/environment';
import { ImpowerState, LocalAppState } from './app.interfaces';
import { batchMapReducer } from './batch-map/batch-map.reducer';
import { dataShimReducer } from './data-shim/data-shim.reducer';
import { formsReducer } from './forms/forms.reducer';
import { homeGeoReducer } from './homeGeocode/homeGeo.reducer';
import { menuReducer } from './menu/menu.reducer';
import { renderingReducer } from './rendering/rendering.reducer';

const impowerReducer: ActionReducerMap<ImpowerState> = {
  dataShim: dataShimReducer,
  menu: menuReducer,
  homeGeo: homeGeoReducer,
  rendering: renderingReducer,
  batchMap: batchMapReducer,
  forms: formsReducer
};

export const impowerAppSlice = createFeatureSelector<ImpowerState>('impower');

export const appReducer: ActionReducerMap<LocalAppState> = {
  router: routerReducer,
};

const combinedImpowerReducer: ActionReducer<ImpowerState> = combineReducers(impowerReducer);

function logger(reducer: ActionReducer<LocalAppState>) : ActionReducer<LocalAppState> {
  return function(state: LocalAppState, action: Action) : LocalAppState {
    console.groupCollapsed('%c' + action.type, 'color: #66666699');
    const nextState = reducer(state, action);
    console.log('%c prev state', 'color: #9E9E9E', state);
    console.log('%c action', 'color: #03A9F4', action);
    console.log('%c next state', 'color: #4CAF50', nextState);
    console.groupEnd();
    return nextState;
  };
}

export const appMetaReducers: MetaReducer<LocalAppState>[] = environment.logLevel <= LogLevels.ALL ? [logger] : [];

export function masterImpowerReducer(state: ImpowerState, action: Action) : ImpowerState {
  return combinedImpowerReducer(state, action);
}
