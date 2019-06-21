import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ImpowerDatastoreState } from './impower-datastore.interfaces';
import * as fromRoot from '../../state/app.interfaces';

const datastoreFeature = createFeatureSelector<fromRoot.LocalAppState, ImpowerDatastoreState>('datastore');
export const persistentSlice = createSelector(datastoreFeature, state => state.persistent);
export const transientSlice = createSelector(datastoreFeature, state => state.transient);
