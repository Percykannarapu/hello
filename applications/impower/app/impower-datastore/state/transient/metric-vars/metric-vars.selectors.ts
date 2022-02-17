import { createSelector } from '@ngrx/store';
import { transientSlice } from '../../impower-datastore.selectors';
import * as fromMetricVars from './metric-vars.reducer';

export const metricVarSlice = createSelector(transientSlice, state => state.mapVars);
export const allMetricVars = createSelector(metricVarSlice, fromMetricVars.selectAll);
export const allMetricVarEntities = createSelector(metricVarSlice, fromMetricVars.selectEntities);

export const getMetricVarIds = createSelector(metricVarSlice, fromMetricVars.selectIds);
export const getMetricVarEntities = createSelector(metricVarSlice, fromMetricVars.selectEntities);
export const getMetricVars = createSelector(metricVarSlice, fromMetricVars.selectAll);