import { ColorPalette, getColorPalette } from '@val/esri';
import { ShadingActions, ShadingActionTypes } from './shading.actions';

export enum ShadingType {
  SITE,
  ZIP,
  WRAP_ZONE,
  ATZ_INDICATOR,
  VARIABLE
}

export interface VariableRanges {
  minValue?: number;
  maxValue?: number;
}

export interface VarDefinition {
  name: string;
  isNumber: boolean;
  minValue?: number;
  maxValue?: number;
}

export interface ShadingState {
  classifications: VariableRanges[];
  availableVars: VarDefinition[];
  selectedVarName: string;
  shadingType: ShadingType;
  basePalette: number[][];
  //
  classBreakValues: number[];
  selectedClassBreaks: number;
  selectedVar: VarDefinition;
}



export const initialState: ShadingState = {
  classifications: [],
  availableVars: [],
  selectedVarName: '',
  shadingType: ShadingType.SITE,
  basePalette: getColorPalette(ColorPalette.Cpqmaps),
  classBreakValues: [],
  selectedClassBreaks: 4,
  selectedVar: null
};

type ReducerActions = ShadingActions;

export function shadingReducer(state = initialState, action: ReducerActions) : ShadingState {
  switch (action.type) {
    case ShadingActionTypes.InitializeVariableOptions:
      return {
        ...state,
        availableVars: action.payload.definitions
      };
    case ShadingActionTypes.SetNonVariableShading:
      return {
        ...state,
        shadingType: action.payload.shadingType,
        classifications: [...initialState.classifications],
        selectedVarName: initialState.selectedVarName
      };
    case ShadingActionTypes.SetVariableShading:
      return {
        ...state,
        shadingType: ShadingType.VARIABLE,
        classifications: [...action.payload.classifications],
        selectedVarName: action.payload.selectedVarName
      };
    case ShadingActionTypes.SetClassBreakValues:
      return {
        ...state,
        classBreakValues: action.payload.classBreakValues,
        selectedClassBreaks: action.payload.breakCount,
        selectedVar: action.payload.selectedVar

      };  
    default:
      return state;
  }
}
