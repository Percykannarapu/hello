import { routerReducer } from '@ngrx/router-store';
import { Action, ActionReducer, ActionReducerMap, MetaReducer } from '@ngrx/store';
import { environment } from '../../environments/environment';
import { AppState } from './app.interfaces';

export const appReducer: ActionReducerMap<AppState> = {
  router: routerReducer
};

export function logger(reducer: ActionReducer<AppState>) : ActionReducer<AppState> {
  return function(state: AppState, action: Action) : AppState {
    console.groupCollapsed(action.type);
    console.log('state', state);
    console.log('action', action);
    console.groupEnd();
    return reducer(state, action);
  };
}

export const appMetaReducers: MetaReducer<AppState>[] = !environment.production
  ? [logger]
  : [];
