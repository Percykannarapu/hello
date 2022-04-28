import { createSelector } from '@ngrx/store';
import { transientSlice } from '../../impower-datastore.selectors';
import * as fromCustomVars from './custom-vars.reducer';

export const customVarSlice = createSelector(transientSlice, state => state.customVars);
const customIds = createSelector(customVarSlice, fromCustomVars.selectIds);
export const allCustomVarIds = createSelector(customIds, state => (state) as string[]);
export const allCustomVars = createSelector(customVarSlice, fromCustomVars.selectAll);
export const allCustomVarEntities = createSelector(customVarSlice, fromCustomVars.selectEntities);
