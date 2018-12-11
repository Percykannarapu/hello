import {ActionReducerMap, createFeatureSelector, createSelector} from '@ngrx/store';
import * as fromRoot from '../../state/app.interfaces';
import * as fromPersistent from './persistent';

export interface AppState extends fromRoot.AppState {
  datastore: ImpowerDatastoreState;
}

export interface ImpowerDatastoreState {
  persistent: fromPersistent.ImpowerPersistentState;
}

const datastoreFeature = createFeatureSelector<AppState, ImpowerDatastoreState>('datastore');
export const persistentSlice = createSelector(datastoreFeature, state => state.persistent);

export const dataStoreReducers: ActionReducerMap<ImpowerDatastoreState> = {
  persistent: fromPersistent.reducer
};
