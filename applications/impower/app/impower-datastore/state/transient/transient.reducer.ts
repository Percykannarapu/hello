import { Action, ActionReducer, ActionReducerMap, combineReducers } from '@ngrx/store';
import * as fromAudience from './audience/audience.reducer';
import * as fromCustomVars from './custom-vars/custom-vars.reducer';
import * as fromGeoAttribute from './geo-attributes/geo-attributes.reducer';
import * as fromGeoVars from './geo-vars/geo-vars.reducer';
import * as fromMapVars from './map-vars/map-vars.reducer';
import * as fromTransactions from './transactions/transactions.reducer';

export interface ImpowerTransientState {
  audiences: fromAudience.State;
  customVars: fromCustomVars.State;
  geoVars: fromGeoVars.State;
  mapVars: fromMapVars.State;
  geoAttributes: fromGeoAttribute.State;
  transactions: fromTransactions.State;
}

const transientReducers: ActionReducerMap<ImpowerTransientState> = {
  audiences: fromAudience.reducer,
  customVars: fromCustomVars.reducer,
  geoVars: fromGeoVars.reducer,
  mapVars: fromMapVars.reducer,
  geoAttributes: fromGeoAttribute.reducer,
  transactions: fromTransactions.reducer,
};

const metaReducer: ActionReducer<ImpowerTransientState> = combineReducers(transientReducers);

export function reducer(state: ImpowerTransientState | undefined, action: Action) : ImpowerTransientState {
  return metaReducer(state, action);
}
