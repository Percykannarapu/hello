import { createSelector } from '@ngrx/store';
import { appStateSlice } from '../impower-datastore.selectors';

export const networkIsOnline = createSelector(appStateSlice, state => state.isOnline);
