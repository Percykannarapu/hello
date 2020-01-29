import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromRoot from '../../state/app.interfaces';
import { ImpowerDatastoreState } from './impower-datastore.interfaces';

const datastoreFeature = createFeatureSelector<fromRoot.FullAppState, ImpowerDatastoreState>('datastore');
export const persistentSlice = createSelector(datastoreFeature, state => state.persistent);
export const transientSlice = createSelector(datastoreFeature, state => state.transient);
