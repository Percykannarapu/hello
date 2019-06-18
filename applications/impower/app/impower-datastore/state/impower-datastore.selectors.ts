import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromRoot from '../../state/app.interfaces';
import { ImpowerDatastoreState } from './impower-datastore.interfaces';
import * as fromGeoAttributes from './geo-attributes/geo-attributes.reducer';
import * as fromAudiences from './transient/audience/audience.selectors';

const datastoreFeature = createFeatureSelector<fromRoot.LocalAppState, ImpowerDatastoreState>('datastore');
export const persistentSlice = createSelector(datastoreFeature, state => state.persistent);
export const transientSlice = createSelector(datastoreFeature, state => state.transient);
export const geoAttributeSlice = createSelector(datastoreFeature, state => state.geoAttributes);

export const selectGeoAttributeIds = createSelector(geoAttributeSlice, fromGeoAttributes.selectIds);
export const selectGeoAttributeEntities = createSelector(geoAttributeSlice, fromGeoAttributes.selectEntities);
export const selectGeoAttributes = createSelector(geoAttributeSlice, fromGeoAttributes.selectAll);
