import { createSelector } from '@ngrx/store';
import { impowerAppSlice } from '../app.reducer';

const getRenderingSlice = createSelector(impowerAppSlice, state => state.rendering);
export const getRadiusTradeAreasReady = createSelector(getRenderingSlice, state => !state.radiusTradeAreasRendering);
