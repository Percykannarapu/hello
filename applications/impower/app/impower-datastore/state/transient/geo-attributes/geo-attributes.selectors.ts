import { createSelector } from '@ngrx/store';
import { transientSlice } from '../../impower-datastore.selectors';
import * as fromGeoAttributes from './geo-attributes.reducer';

export const geoAttributeSlice = createSelector(transientSlice, state => state.geoAttributes);
export const allGeoAttributes = createSelector(geoAttributeSlice, fromGeoAttributes.selectAll);
export const allGeoAttributeEntities = createSelector(geoAttributeSlice, fromGeoAttributes.selectEntities);

export const selectGeoAttributeIds = createSelector(geoAttributeSlice, fromGeoAttributes.selectIds);
export const selectGeoAttributeEntities = createSelector(geoAttributeSlice, fromGeoAttributes.selectEntities);
export const selectGeoAttributes = createSelector(geoAttributeSlice, fromGeoAttributes.selectAll);
