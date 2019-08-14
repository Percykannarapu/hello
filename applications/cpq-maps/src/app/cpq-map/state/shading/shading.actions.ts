import { Action } from '@ngrx/store';
import { VariableRanges, ShadingType, VarDefinition, ShadingState, NumericVariableShadingMethod } from './shading.reducer';

export enum ShadingActionTypes {
  InitializeShading = '[Shading] Initialize',
  InitializeVariableOptions = '[Shading] Initialize Variable Options',
  RenderShading = '[Shading] Render Shading',
  SetNonVariableShading = '[Shading] Set Non Variable Shading Type',
  SetVariableShading = '[Shading] Set Selected Var',
  CalculateEqualIntervals = '[Shading] Calculate equal intervals',
  SetClassBreakValues = '[Shading] Set Class Break Values',
}

export class InitializeShading implements Action {
  readonly type = ShadingActionTypes.InitializeShading;
}
export class InitializeVariableOptions implements Action {
  readonly type = ShadingActionTypes.InitializeVariableOptions;
  constructor(public payload: { definitions: VarDefinition[] }) {}
}

export class RenderShading implements Action {
  readonly type = ShadingActionTypes.RenderShading;
  constructor(public payload: { recreateLayer: boolean }) {}
}

export class SetVariableShading implements Action {
  readonly type = ShadingActionTypes.SetVariableShading;
  constructor(public payload: { classifications: VariableRanges[], selectedVarName: string }) {}
}
export class SetNonVariableShading implements Action {
    readonly type = ShadingActionTypes.SetNonVariableShading;
    constructor(public payload: { shadingType: ShadingType }) {}
}

export class CalculateEqualIntervals implements Action{
  readonly type = ShadingActionTypes.CalculateEqualIntervals;
  constructor(public payload: {breakCount: number, selectedVar: VarDefinition, selectedNumericMethod: NumericVariableShadingMethod}){}
}

export class SetClassBreakValues implements Action{
  readonly type = ShadingActionTypes.SetClassBreakValues;
  constructor(public payload: {classBreakValues: number[], 
                               breakCount: number, 
                               selectedVar: VarDefinition,
                               selectedNumericMethod: NumericVariableShadingMethod}){}
}

export type ShadingActions =
  InitializeShading |
  InitializeVariableOptions |
  RenderShading |
  SetVariableShading |
  SetNonVariableShading |
  CalculateEqualIntervals |
  SetClassBreakValues
  ;
