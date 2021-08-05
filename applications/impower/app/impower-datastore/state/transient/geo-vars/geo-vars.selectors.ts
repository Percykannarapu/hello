import { createSelector } from '@ngrx/store';
import { transientSlice } from '../../impower-datastore.selectors';
import * as fromGeoVars from './geo-vars.reducer';

export const geoVarSlice = createSelector(transientSlice, state => state.geoVars);
export const allGeoVars = createSelector(geoVarSlice, fromGeoVars.selectAll);
export const allGeoVarEntities = createSelector(geoVarSlice, fromGeoVars.selectEntities);

export const getGeoVarCount = createSelector(allGeoVars, geoVars => {
  let count = 0;
  for (let i = 0; i < geoVars.length; i++)
    for (const [fieldName, ] of Object.entries(geoVars[i]))
      if (fieldName !== 'geocode')
        count++;
  return count;
});
