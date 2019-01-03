import {
  Action,
  ActionReducer,
  ActionReducerMap,
  createFeatureSelector,
  createSelector,
  MetaReducer
} from '@ngrx/store';
import { environment } from '../../../environments/environment';
import * as fromEsri from '@val/esri';

export interface FullState extends LocalState, fromEsri.AppState {}

export interface LocalState {

}

export const reducers: ActionReducerMap<LocalState> = {

};

export function logger(reducer: ActionReducer<LocalState>) : ActionReducer<LocalState> {
  return function(state: LocalState, action: Action) : LocalState {
    console.groupCollapsed(action.type);
    const nextState = reducer(state, action);
    console.log('%c prev state', 'color: #9E9E9E', state);
    console.log('%c action', 'color: #03A9F4', action);
    console.log('%c next state', 'color: #4CAF50', nextState);
    console.groupEnd();
    return nextState;
  };
}

export const metaReducers: MetaReducer<LocalState>[] = !environment.production ? [logger] : [];
