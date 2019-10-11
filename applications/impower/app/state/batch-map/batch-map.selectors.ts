import { createSelector } from '@ngrx/store';
import { LocalAppState, getMenuSlice } from '../app.interfaces';

const getBatchMapSlice = (state: LocalAppState) => state.batchMap;
export const getBatchMode = createSelector(getBatchMapSlice, state => state.batchMode);
export const getBatchMapReady = createSelector(getBatchMapSlice, state => state.mapReady);
export const getNextSiteNumber = createSelector(getBatchMapSlice, state => state.nextSiteNum);
export const getLastSiteFlag = createSelector(getBatchMapSlice, state => state.isLastSite);
export const getMapMoving = createSelector(getBatchMapSlice, state => state.moving);
export const getBatchMapDialog = createSelector(getBatchMapSlice, state => state.displayBatchMapDialog);
