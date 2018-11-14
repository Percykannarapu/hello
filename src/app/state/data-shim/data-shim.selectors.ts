import { createSelector } from '@ngrx/store';
import { AppState } from '../app.interfaces';

export const getDataShimSlice = (state: AppState) => state.dataShim;
export const projectIsReady = createSelector(getDataShimSlice, state => !state.projectIsLoading && state.projectIsLoaded);
