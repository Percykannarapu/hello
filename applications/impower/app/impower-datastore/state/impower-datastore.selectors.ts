import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromRoot from '../../state/app.interfaces';
import { ImpowerDatastoreState } from './impower-datastore.interfaces';
import * as fromGeoAttributes from './transient/geo-attributes/geo-attributes.reducer';
import * as fromAudiences from './transient/audience/audience.selectors';

const datastoreFeature = createFeatureSelector<fromRoot.LocalAppState, ImpowerDatastoreState>('datastore');
export const persistentSlice = createSelector(datastoreFeature, state => state.persistent);
export const transientSlice = createSelector(datastoreFeature, state => state.transient);
