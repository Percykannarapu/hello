import { Action, ActionReducer, ActionReducerMap, combineReducers } from '@ngrx/store';
import * as fromAppState from './application-state/application-state.reducer';
import * as fromPersistent from './persistent/persistent.reducer';
import * as fromTransient from './transient/transient.reducer';

export interface AppState {
  datastore: ImpowerDatastoreState;
}

export interface ImpowerDatastoreState {
  applicationState: fromAppState.ImpowerApplicationState;
  persistent: fromPersistent.ImpowerPersistentState;
  transient:  fromTransient.ImpowerTransientState;
}

export const dataStoreReducers: ActionReducerMap<ImpowerDatastoreState> = {
  applicationState: fromAppState.reducer,
  persistent: fromPersistent.reducer,
  transient:  fromTransient.reducer,
};

const metaReducer: ActionReducer<ImpowerDatastoreState, Action> = combineReducers(dataStoreReducers);

export function masterDataStoreReducer(state: ImpowerDatastoreState, action: Action) : ImpowerDatastoreState {
  return metaReducer(state, action);
}
