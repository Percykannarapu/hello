import { createSelector } from '@ngrx/store';
import { transientSlice } from '../../impower-datastore.selectors';
import * as fromGeoVars from './geo-vars.reducer';

export const geoVarSlice = createSelector(transientSlice, state => state.geoVars);
export const allGeoVars = createSelector(geoVarSlice, fromGeoVars.selectAll);
export const allGeoVarEntities = createSelector(geoVarSlice, fromGeoVars.selectEntities);

export const getGeoVarIds = createSelector(geoVarSlice, fromGeoVars.selectIds);
export const getGeoVarEntities = createSelector(geoVarSlice, fromGeoVars.selectEntities);
export const getGeoVars = createSelector(geoVarSlice, fromGeoVars.selectAll);

export const getTransactionId = createSelector(geoVarSlice, state => state.transactionId);

export const getGeoVarCount = createSelector(allGeoVars, geoVars => {
  let count = 0;
  for (let i = 0; i < geoVars.length; i++)
    for (const [field, fieldValue] of Object.entries(geoVars[i]))
       if (field !== 'geocode')
          count++;
  return count;
});