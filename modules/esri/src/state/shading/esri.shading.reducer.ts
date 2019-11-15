
import { createReducer, on } from '@ngrx/store';
import { geoSelectionChanged } from './esri.shading.actions';
import { ColorPalette } from '../../models/color-palettes';

export interface ShadingData {
  [varId: string] : number | string;
}

export interface GeoData {
  selected: boolean;
  ownerSite: string;
}

export interface EsriShadingState {
  geoShadingData: {
    [geocode: string] : ShadingData & GeoData;
  };
  theme: ColorPalette;
}

export const initialState: EsriShadingState = {
  geoShadingData: {},
  theme: ColorPalette.EsriPurple
};

export const shadingReducer = createReducer(
  initialState,
  on(geoSelectionChanged, (state, { selectedFeatureIds }) => ({ ...state }))
);
