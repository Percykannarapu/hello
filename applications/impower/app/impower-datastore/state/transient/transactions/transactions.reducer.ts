import { Action, createReducer, createSelector, on } from '@ngrx/store';
import { transientSlice } from '../../impower-datastore.selectors';
import * as Actions from './transactions.actions';
import { GeoTransactionType } from './transactions.actions';

export interface State {
  geofootprintTxId: number;
  mapTxId: number;
}

const initialState: State = {
  geofootprintTxId: null,
  mapTxId: null,
};

const transactionReducer = createReducer(
  initialState,
  on(Actions.CacheGeosComplete,
    (state, action) => {
      switch (action.geoType) {
        case GeoTransactionType.Geofootprint:
          return { ...state, geofootprintTxId: action.transactionId };
        case GeoTransactionType.Map:
          return { ...state, mapTxId: action.transactionId };
      }
    }),
  on(Actions.CacheGeosFailure,
    Actions.RemoveGeoCacheComplete,
    Actions.RemoveGeoCacheFailure,
    (state, action) => {
      switch (action.geoType) {
        case GeoTransactionType.Geofootprint:
          return { ...state, geofootprintTxId: null };
        case GeoTransactionType.Map:
          return { ...state, mapTxId: null };
        default:
          return { ...state, mapTxId: null, geofootprintTxId: null };
      }
    })
);

export function reducer(state: State | undefined, action: Action) {
  return transactionReducer(state, action);
}

const currentSlice = createSelector(transientSlice, state => state.transactions);
export const geoTransactionId = createSelector(currentSlice, state => state.geofootprintTxId);
export const mapTransactionId = createSelector(currentSlice, state => state.mapTxId);
export const actionedTransactionId = createSelector(currentSlice, (state, { geoType }: { geoType: GeoTransactionType }) : number => {
  switch (geoType) {
    case GeoTransactionType.Geofootprint:
      return state.geofootprintTxId;
    case GeoTransactionType.Map:
      return state.mapTxId;
  }
});
