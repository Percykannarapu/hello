import { createSelector } from '@ngrx/store';
import { FullAppState } from '../app.interfaces';

const renderingSlice = (state: FullAppState) => state.rendering;
export const getCurrentColorPalette = createSelector(renderingSlice, state => state.currentPalette);
