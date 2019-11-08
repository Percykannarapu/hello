import { EsriMapActionTypes, ResetMapState } from '../map/esri.map.actions';
import { EsriRendererActions, EsriRendererActionTypes } from './esri.renderer.actions';
import { ColorPalette } from '../../models/color-palettes';

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
  colorPallete: ColorPalette;
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
  colorPallete: ColorPalette.EsriPurple
};

type ReducerActions = EsriRendererActions | ResetMapState;

export function rendererReducer(state = initialState, action: ReducerActions) : EsriRendererState {
  switch (action.type) {
    case EsriMapActionTypes.ResetMapState:
      return {
        ...initialState
      };
    case EsriRendererActionTypes.SetRenderingData:
      return {
        ...state,
        shadingData: { ...action.payload.data },
        isNumericData: action.payload.isNumericData,
        statistics: { ...action.payload.statistics },
        colorPallete: action.payload.theme,
        enableShading: true,
      };
    case EsriRendererActionTypes.ClearRenderingData:
      return {
        ...state,
        shadingData: initialState.shadingData,
        isNumericData: initialState.isNumericData,
        statistics: initialState.statistics,
        enableShading: false,
      };

    case EsriRendererActionTypes.SetSelectedGeos:
      return { ...state, selectedGeocodes: action.payload };
    case EsriRendererActionTypes.SelectedGeosShading:
      return { ...state, selectedGeocodes: action.payload.geos};
    case EsriRendererActionTypes.SetHighlightOptions:
      return {
        ...state,
        highlightMode: action.payload.highlightMode,
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
