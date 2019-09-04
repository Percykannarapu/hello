import { GridSize } from '../app.interfaces';
import { SetMapPreferences, SharedActionTypes } from '../shared/shared.actions';
import { ShadingActions, MapUIActionTypes } from './map-ui.actions';

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

export interface MapUIState {
  isDistrQtyEnabled: boolean;
  gridSize: GridSize;
  classifications: VariableRanges[];
  availableVars: VarDefinition[];
  selectedVarName: string;
  shadingType: ShadingType;
  classBreakValues: number[];
  selectedClassBreaks: number;
  selectedVar: VarDefinition;
  selectedNumericMethod: NumericVariableShadingMethod;
  shadeAnne: boolean;
  shadeSolo: boolean;
}

export const initialState: MapUIState = {
  isDistrQtyEnabled: false,
  gridSize: 'small',
  classifications: [],
  availableVars: [],
  selectedVarName: '',
  shadingType: ShadingType.SITE,
  classBreakValues: [],
  selectedClassBreaks: 4,
  selectedVar: null,
  selectedNumericMethod: NumericVariableShadingMethod.StandardIndex,
  shadeAnne: false,
  shadeSolo: false
};

type ReducerActions = ShadingActions | SetMapPreferences;

export function mapUIReducer(state = initialState, action: ReducerActions) : MapUIState {
  switch (action.type) {
    case SharedActionTypes.LoadMapPreferences:
      return {
        ...state,
        ...action.payload.mapUISlice
      };
    case MapUIActionTypes.SetIsDistributionVisible:
      return {
        ...state,
        isDistrQtyEnabled: action.payload.isVisible
      };
    case MapUIActionTypes.SetGridSize:
      return {
        ...state,
        gridSize: action.payload.gridSize
      };
    case MapUIActionTypes.InitializeVariableOptions:
      return {
        ...state,
        availableVars: action.payload.definitions
      };
    case MapUIActionTypes.SetNonVariableShading:
      return {
        ...state,
        shadingType: action.payload.shadingType,
        classifications: [...initialState.classifications],
        selectedVarName: initialState.selectedVarName
      };
    case MapUIActionTypes.SetVariableShading:
      return {
        ...state,
        shadingType: ShadingType.VARIABLE,
        classifications: [...action.payload.classifications],
        selectedVarName: action.payload.selectedVarName
      };
    case MapUIActionTypes.SetClassBreakValues:
      return {
        ...state,
        classBreakValues: action.payload.classBreakValues,
        selectedClassBreaks: action.payload.breakCount,
        selectedVar: action.payload.selectedVar,
        selectedNumericMethod: action.payload.selectedNumericMethod
      };
    case MapUIActionTypes.SetShadingType:
      return{
        ...state,
        shadingType: action.payload.shadingType
      };
    case MapUIActionTypes.SetAnneShading:
      return {
        ...state,
        shadeAnne: action.payload.shadeAnne,
      };
    case MapUIActionTypes.SetSoloShading:
      return {
        ...state,
        shadeSolo: action.payload.shadeSolo,
      };
    default:
      return state;
  }
}
