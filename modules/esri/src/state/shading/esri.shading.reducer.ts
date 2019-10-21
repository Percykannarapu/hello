
import { createReducer, on } from '@ngrx/store';
import { geoSelectionChanged } from './esri.shading.actions';

interface ShadingData {
  [varId: string] : number | string;
}

interface GeoData {
  selected: boolean;
  ownerSite: string;
}

export interface EsriShadingState {
  geoShadingData: {
    [geocode: string] : ShadingData & GeoData;
  };
}

export const initialState: EsriShadingState = {
  geoShadingData: {}
};

export const shadingReducer = createReducer(
  initialState,
  on(geoSelectionChanged, (state, { selectedFeatureIds }) => ({ ...state }))
);
