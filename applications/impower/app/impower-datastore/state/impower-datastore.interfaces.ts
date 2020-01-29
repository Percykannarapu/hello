import { Action, ActionReducer, ActionReducerMap, combineReducers } from '@ngrx/store';
import * as fromPersistent from './persistent/persistent.reducer';
import * as fromTransient from './transient/transient.reducer';

export interface AppState {
  datastore: ImpowerDatastoreState;
}

export interface ImpowerDatastoreState {
  persistent: fromPersistent.ImpowerPersistentState;
  transient:  fromTransient.ImpowerTransientState;
}

export const dataStoreReducers: ActionReducerMap<ImpowerDatastoreState> = {
  persistent: fromPersistent.reducer,
  transient:  fromTransient.reducer,
};

const metaReducer: ActionReducer<ImpowerDatastoreState, Action> = combineReducers(dataStoreReducers);

export function masterDataStoreReducer(state: ImpowerDatastoreState, action: Action) : ImpowerDatastoreState {
  return metaReducer(state, action);
}
