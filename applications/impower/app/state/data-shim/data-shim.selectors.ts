import { createSelector } from '@ngrx/store';
import { impowerAppSlice } from '../app.reducer';

export const getDataShimSlice = createSelector(impowerAppSlice, state => state.dataShim);
export const projectIsLoaded = createSelector(getDataShimSlice, state => state.projectIsLoaded);
export const projectIsReady = createSelector(getDataShimSlice, state => !state.projectIsLoading && state.projectIsLoaded);
export const layersAreReady = createSelector(getDataShimSlice, state => state.layersAreReady);
export const deleteCustomTa = createSelector(getDataShimSlice, state => state.deleteCustomTa);
export const deleteMustCover = createSelector(getDataShimSlice, state => state.deleteMustCover);
export const deleteCustomData = createSelector(getDataShimSlice, state => state.deleteCustomData);
