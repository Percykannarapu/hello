import { createSelector } from '@ngrx/store';
import { LocalAppState } from '../app.interfaces';

export const getDataShimSlice = (state: LocalAppState) => state.dataShim;
export const projectIsLoaded = createSelector(getDataShimSlice, state => state.projectIsLoaded);
export const projectIsReady = createSelector(getDataShimSlice, state => !state.projectIsLoading && state.projectIsLoaded);
export const layersAreReady = createSelector(getDataShimSlice, state => state.layersAreReady);
