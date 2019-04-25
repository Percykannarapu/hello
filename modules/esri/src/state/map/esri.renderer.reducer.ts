import { EsriMapActionTypes, ResetMapState } from './esri.map.actions';
import { EsriRendererActions, EsriRendererActionTypes } from './esri.renderer.actions';
import { ColorPallete } from '../../models/ColorPalletes';

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
  highlightLayer: string;
  highlightLayerGroup: string;
  shadingGroups: { groupName: string, ids: string[] }[];
  colorPallete: ColorPallete;
}

const initialState: EsriRendererState = {
  shadingData: null,
  isNumericData: false,
  selectedGeocodes: new Array<string>(),
  statistics: null,
  enableShading: false,
  highlightMode: HighlightMode.OUTLINE,
  highlightLayer: null,
  highlightLayerGroup: null,
  shadingGroups: null,
  colorPallete: ColorPallete.Random
};

type ReducerActions = EsriRendererActions | ResetMapState;

export function rendererReducer(state = initialState, action: ReducerActions) : EsriRendererState {
  switch (action.type) {
    case EsriMapActionTypes.ResetMapState:
      return {
        ...initialState
      };
    case EsriRendererActionTypes.SetShadingData:
      return {
        ...state,
        shadingData: { ...action.payload.data },
        isNumericData: action.payload.isNumericData,
        statistics: { ...action.payload.statistics },
        colorPallete: action.payload.theme,
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
        highlightLayer: action.payload.layer,
        shadingGroups: action.payload.groups,
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
