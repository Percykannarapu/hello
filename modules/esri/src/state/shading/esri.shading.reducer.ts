
import { EsriShadingActions, EsriShadingActionTypes } from './esri.shading.actions';

interface ShadingData {
  [varId: string] : number | string;
}

interface GeoData {
  selected: boolean;
  ownerSite: string;
}

export interface State {
  geoShadingData: {
    [geocode: string] : ShadingData & GeoData;
  };
}

export const initialState: State = {
  geoShadingData: {}
};

export function reducer(state = initialState, action: EsriShadingActions) : State {
  switch (action.type) {
    case EsriShadingActionTypes.MapViewChanged:
    case EsriShadingActionTypes.GeoSelectionChanged:
    case EsriShadingActionTypes.ClearShadingData:
    default:
      return state;
  }
}
