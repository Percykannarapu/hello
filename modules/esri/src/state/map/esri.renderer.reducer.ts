import { EsriRendererActions, EsriRendererActionTypes } from './esri.renderer.actions';

export interface ShadingData {
  [geocode: string] : string | number;
}

export enum HighlightMode {
  OUTLINE,
  SHADE,
  OUTLINE_GROUPS,
  SHADE_GROUPS
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
  highlightMode: HighlightMode;
  highlighLayer: string;
  highlightLayerGroup: string;
}

const initialState: EsriRendererState = {
  shadingData: null,
  isNumericData: false,
  selectedGeocodes: new Array<string>(),
  statistics: null,
  enableShading: false,
  highlightMode: HighlightMode.OUTLINE,
  highlighLayer: null,
  highlightLayerGroup: null
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
      return { ...state, selectedGeocodes: action.payload };
    case EsriRendererActionTypes.SetHighlightOptions:
      return { 
        ...state, 
        highlightMode: action.payload.higlightMode, 
        highlightLayerGroup: action.payload.layerGroup, 
        highlighLayer: action.payload.layer 
      };
    case EsriRendererActionTypes.ClearSelectedGeos:
      return {
        ...state,
        selectedGeocodes: initialState.selectedGeocodes,
      };

    default:
      return state;
  }
}
