import { Action, ActionReducer, ActionReducerMap, combineReducers } from '@ngrx/store';
// import * as fromGeoAttribute from './geo-attributes/geo-attributes.reducer';
import * as fromPersistent from './persistent/persistent.reducer';
import * as fromTransient from './transient/transient.reducer';

export interface ImpowerDatastoreState {
  persistent: fromPersistent.ImpowerPersistentState;
  transient:  fromTransient.ImpowerTransientState;
  // geoAttributes: fromGeoAttribute.State;
}

export const dataStoreReducers: ActionReducerMap<ImpowerDatastoreState> = {
  persistent: fromPersistent.reducer,
  transient:  fromTransient.reducer,
  // geoAttributes: fromGeoAttribute.reducer,
};

const metaReducer: ActionReducer<ImpowerDatastoreState, Action> = combineReducers(dataStoreReducers);

export function masterDataStoreReducer(state: ImpowerDatastoreState, action: Action) : ImpowerDatastoreState {
  return metaReducer(state, action);
}
