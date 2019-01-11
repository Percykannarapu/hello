import { EsriRendererActions, EsriRendererActionTypes } from './esri.renderer.actions';

export interface ShadingData {
  [geocode: string] : string | number;
}

export interface Statistics {
  mean: number;
  sum: number;
  min: number;
  max: number;
  variance: number;
  stdDeviation: number;
}

export interface EsriRendererState {
  shadingData: ShadingData;
  isNumericData: boolean;
  selectedGeocodes: Array<string>;
  statistics: Statistics;
  enableShading: boolean;
}

const initialState: EsriRendererState = {
  shadingData: null,
  isNumericData: false,
  selectedGeocodes: new Array<string>(),
  statistics: null,
  enableShading: false
};

export function rendererReducer(state = initialState, action: EsriRendererActions) : EsriRendererState {
  switch (action.type) {
    case EsriRendererActionTypes.SetShadingData:
      return {
        ...state,
        shadingData: { ...action.payload.data },
        isNumericData: action.payload.isNumericData,
        statistics: { ...action.payload.statistics },
        enableShading: true,
      };
    case EsriRendererActionTypes.ClearShadingData:
      return {
        ...state,
        shadingData: initialState.shadingData,
        isNumericData: initialState.isNumericData,
        statistics: initialState.statistics,
        enableShading: true,
      };

    case EsriRendererActionTypes.SetSelectedGeos:
      return {...state, selectedGeocodes: action.payload};
    case EsriRendererActionTypes.ClearSelectedGeos:
      return {
        ...state,
        selectedGeocodes: initialState.selectedGeocodes,
      };

    default:
      return state;
  }
}
