import { Action } from '@ngrx/store';
import { GridSize, NumericVariableShadingMethod, ShadingType, VarDefinition, VariableRanges } from '../app.interfaces';

export enum MapUIActionTypes {
  InitializeMapUI = '[Map UI] Initialize',
  InitializeVariableOptions = '[Map UI] Initialize Variable Options',
  RenderShading = '[Map UI] Render Shading',
  SetIsDistributionVisible = '[Map UI] Set Distribution Qty Visibility',
  SetGridSize = '[Map UI] Set Grid Size',
  SetNonVariableShading = '[Map UI] Set Non Variable Shading Type',
  SetVariableShading = '[Map UI] Set Selected Var',
  CalculateEqualIntervals = '[Map UI] Calculate equal intervals',
  SetClassBreakValues = '[Map UI] Set Class Break Values',
  SetShadingType = '[Map UI] Set Shading Type',
  SetAnneShading = '[Map UI] Set Anne Shading',
  SetSoloShading = '[Map UI] Set Solo Shading'
}

export class InitializeMapUI implements Action {
  readonly type = MapUIActionTypes.InitializeMapUI;
}

export class InitializeVariableOptions implements Action {
  readonly type = MapUIActionTypes.InitializeVariableOptions;
  constructor(public payload: { definitions: VarDefinition[] }) {}
}

export class RenderShading implements Action {
  readonly type = MapUIActionTypes.RenderShading;
  constructor(public payload: { recreateLayer: boolean }) {}
}

export class SetIsDistributionVisible implements Action {
  readonly type = MapUIActionTypes.SetIsDistributionVisible;
  constructor(public payload: { isVisible: boolean }) {}
}

export class SetGridSize implements Action {
  readonly type = MapUIActionTypes.SetGridSize;
  constructor(public payload: { gridSize: GridSize }) {}
}

export class SetVariableShading implements Action {
  readonly type = MapUIActionTypes.SetVariableShading;
  constructor(public payload: { classifications: VariableRanges[], selectedVarName: string }) {}
}
export class SetNonVariableShading implements Action {
    readonly type = MapUIActionTypes.SetNonVariableShading;
    constructor(public payload: { shadingType: ShadingType }) {}
}

export class CalculateEqualIntervals implements Action{
  readonly type = MapUIActionTypes.CalculateEqualIntervals;
  constructor(public payload: {breakCount: number,
                               selectedVar: VarDefinition,
                               selectedNumericMethod: NumericVariableShadingMethod,
                               classBreakValues: number[],
                               isRowCheckOrUncheck?: boolean }){}
}

export class SetShadingType implements Action {
  readonly type = MapUIActionTypes.SetShadingType;
  constructor(public payload: { shadingType: ShadingType }) {}
}

export class SetClassBreakValues implements Action{
  readonly type = MapUIActionTypes.SetClassBreakValues;
  constructor(public payload: {classBreakValues: number[],
                               breakCount: number,
                               selectedVar: VarDefinition,
                               selectedNumericMethod: NumericVariableShadingMethod }){}
}

export class SetAnneShading implements Action {
  readonly type = MapUIActionTypes.SetAnneShading;
  constructor(public payload: { shadeAnne: boolean }) {}
}

export class SetSoloShading implements Action {
  readonly type = MapUIActionTypes.SetSoloShading;
  constructor(public payload: { shadeSolo: boolean }) {}
}

export type ShadingActions =
  InitializeMapUI |
  InitializeVariableOptions |
  RenderShading |
  SetIsDistributionVisible |
  SetGridSize |
  SetVariableShading |
  SetNonVariableShading |
  CalculateEqualIntervals |
  SetClassBreakValues |
  SetShadingType |
  SetAnneShading |
  SetSoloShading
  ;
