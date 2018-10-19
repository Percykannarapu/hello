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
    const nextState = reducer(state, action);
    console.log('%c prev state', 'color: #9E9E9E', state);
    console.log('%c action', 'color: #03A9F4', action);
    console.log('%c next state', 'color: #4CAF50', nextState);
    console.groupEnd();
    return nextState;
  };
}

export const appMetaReducers: MetaReducer<AppState>[] = !environment.production
  ? [logger]
  : [];
