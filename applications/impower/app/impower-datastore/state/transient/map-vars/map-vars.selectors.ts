import { createSelector } from '@ngrx/store';
import { transientSlice } from '../../impower-datastore.selectors';
import * as fromMapVars from './map-vars.reducer';

export const mapVarSlice = createSelector(transientSlice, state => state.mapVars);
export const allMapVars = createSelector(mapVarSlice, fromMapVars.selectAll);
export const allMapVarEntities = createSelector(mapVarSlice, fromMapVars.selectEntities);

export const getMapVarIds = createSelector(mapVarSlice, fromMapVars.selectIds);
export const getMapVarEntities = createSelector(mapVarSlice, fromMapVars.selectEntities);
export const getMapVars = createSelector(mapVarSlice, fromMapVars.selectAll);

