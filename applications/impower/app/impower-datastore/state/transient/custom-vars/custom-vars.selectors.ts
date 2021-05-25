import { createSelector } from '@ngrx/store';
import { transientSlice } from '../../impower-datastore.selectors';
import * as fromCustomVars from './custom-vars.reducer';

export const customVarSlice = createSelector(transientSlice, state => state.customVars);
export const allCustomVars = createSelector(customVarSlice, fromCustomVars.selectAll);
export const allCustomVarEntities = createSelector(customVarSlice, fromCustomVars.selectEntities);
