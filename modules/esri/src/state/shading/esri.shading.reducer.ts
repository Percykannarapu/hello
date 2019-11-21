import { createReducer, on } from '@ngrx/store';
import { InitialEsriState, loadInitialState } from '../esri.actions';
import { applyAudienceShading, clearAudienceShading, geoSelectionChanged } from './esri.shading.actions';
import { ColorPalette } from '../../models/color-palettes';

export interface EsriShadingState {
  theme: ColorPalette;
  isShaded: boolean;
}

export const initialState: EsriShadingState = {
  theme: ColorPalette.EsriPurple,
  isShaded: false
};

export const shadingReducer = createReducer(
  initialState,
  on(loadInitialState, (state, payload: InitialEsriState) => {
      return {
        ...state,
        ...initialState,
        ...payload.shading
      };
  }),
  on(geoSelectionChanged, (state, { selectedFeatureIds }) => ({ ...state })),
  on(applyAudienceShading, (state) => ({...state, isShaded: true })),
  on(clearAudienceShading, (state, { resetSelectionShading }) => {
    if (resetSelectionShading) {
      return { ...state, isShaded: false };
    } else {
      return state;
    }
  })
);
