import { createSelector } from '@ngrx/store';
import { impowerAppSlice } from '../app.reducer';

const getBatchMapSlice = createSelector(impowerAppSlice, state => state.batchMap);
export const getBatchMode = createSelector(getBatchMapSlice, state => state.batchMode);
export const getBatchMapReady = createSelector(getBatchMapSlice, state => state.mapReady);
export const getNextSiteNumber = createSelector(getBatchMapSlice, state => state.nextSiteNum);
export const getLastSiteFlag = createSelector(getBatchMapSlice, state => state.isLastSite);
export const getMapMoving = createSelector(getBatchMapSlice, state => state.moving);
export const getCurrentSiteNum = createSelector(getBatchMapSlice, state => state.currentSiteNum);
export const getForceMapUpdate = createSelector(getBatchMapSlice, state => state.forceMapUpdate);
