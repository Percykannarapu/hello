import { routerReducer } from '@ngrx/router-store';
import { Action, ActionReducer, ActionReducerMap, MetaReducer } from '@ngrx/store';
import { environment } from '../../environments/environment';
import { masterDataStoreReducer } from '../impower-datastore/state/impower-datastore.interfaces';
import { LocalAppState } from './app.interfaces';
import { dataShimReducer } from './data-shim/data-shim.reducer';
import { menuReducer } from './menu/menu.reducer';
import { homeGeoReducer } from './homeGeocode/homeGeo.reducer';
import { renderingReducer } from './rendering/rendering.reducer';

export const appReducer: ActionReducerMap<LocalAppState> = {
  router: routerReducer,
  dataShim: dataShimReducer,
  menu: menuReducer,
  homeGeo: homeGeoReducer,
  datastore: masterDataStoreReducer,
  rendering: renderingReducer
};

export function logger(reducer: ActionReducer<LocalAppState>) : ActionReducer<LocalAppState> {
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

export const appMetaReducers: MetaReducer<LocalAppState>[] = !environment.serverBuild
  ? [logger]
  : [];
