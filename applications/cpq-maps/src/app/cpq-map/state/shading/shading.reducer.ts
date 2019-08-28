import { ColorPalette, getColorPalette } from '@val/esri';
import { ShadingActions, ShadingActionTypes } from './shading.actions';

export enum ShadingType {
  SITE,
  ZIP,
  WRAP_ZONE,
  ATZ_INDICATOR,
  VARIABLE
}

export enum NumericVariableShadingMethod {
  StandardIndex = 'Standard Index',
  CustomClassifications = 'Custom Classifications',
  EqualIntervals = 'Equal Intervals'
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
  selectedNumericMethod: NumericVariableShadingMethod;
  shadeBy: ShadingType;
  shadeAnne: boolean;
  shadeSolo: boolean;
}

export const initialState: ShadingState = {
  classifications: [],
  availableVars: [],
  selectedVarName: '',
  shadingType: ShadingType.SITE,
  basePalette: getColorPalette(ColorPalette.Cpqmaps),
  classBreakValues: [],
  selectedClassBreaks: 4,
  selectedVar: null,
  selectedNumericMethod: NumericVariableShadingMethod.StandardIndex,
  shadeBy: null,
  shadeAnne: false,
  shadeSolo: false
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
        selectedVar: action.payload.selectedVar,
        selectedNumericMethod: action.payload.selectedNumericMethod
      };
    case ShadingActionTypes.SetShadingType:
      return{
        ...state,
        shadeBy: action.payload.shadingType
      };
    case ShadingActionTypes.SetAnneShading:
      return {
        ...state,
        shadeAnne: action.payload.shadeAnne,
      };
    case ShadingActionTypes.SetSoloShading:
      return {
        ...state,
        shadeSolo: action.payload.shadeSolo,
      };
    default:
      return state;
  }
}
