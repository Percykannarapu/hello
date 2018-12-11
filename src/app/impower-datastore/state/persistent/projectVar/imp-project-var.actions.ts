import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { ImpProjectVarState } from '../../models/imp-project-var-state';

export enum ImpProjectVarActionTypes {
  AddImpProjectVar = '[ImpProjectVar Entity] Add ImpProjectVar',
  AddImpProjectVars = '[ImpProjectVar Entity] Add ImpProjectVars',
  UpdateImpProjectVar = '[ImpProjectVar Entity] Update ImpProjectVar',
  UpdateImpProjectVars = '[ImpProjectVar Entity] Update ImpProjectVars',
  DeleteImpProjectVar = '[ImpProjectVar Entity] Delete ImpProjectVar',
  DeleteImpProjectVars = '[ImpProjectVar Entity] Delete ImpProjectVars',
  ClearImpProjectVars = '[ImpProjectVar Entity] Clear ImpProjectVars'
}

export class AddImpProjectVar implements Action {
  readonly type = ImpProjectVarActionTypes.AddImpProjectVar;

  constructor(public payload: { impProjectVar: ImpProjectVarState }) {}
}

export class AddImpProjectVars implements Action {
  readonly type = ImpProjectVarActionTypes.AddImpProjectVars;

  constructor(public payload: { impProjectVars: ImpProjectVarState[] }) {}
}

export class UpdateImpProjectVar implements Action {
  readonly type = ImpProjectVarActionTypes.UpdateImpProjectVar;

  constructor(public payload: { impProjectVar: Update<ImpProjectVarState> }) {}
}

export class UpdateImpProjectVars implements Action {
  readonly type = ImpProjectVarActionTypes.UpdateImpProjectVars;

  constructor(public payload: { impProjectVars: Update<ImpProjectVarState>[] }) {}
}

export class DeleteImpProjectVar implements Action {
  readonly type = ImpProjectVarActionTypes.DeleteImpProjectVar;

  constructor(public payload: { id: number }) {}
}

export class DeleteImpProjectVars implements Action {
  readonly type = ImpProjectVarActionTypes.DeleteImpProjectVars;

  constructor(public payload: { ids: number[] }) {}
}

export class ClearImpProjectVars implements Action {
  readonly type = ImpProjectVarActionTypes.ClearImpProjectVars;
}

export type ImpProjectVarActionsAffectingParent =
  AddImpProjectVar |
  AddImpProjectVars |
  DeleteImpProjectVar |
  DeleteImpProjectVars |
  ClearImpProjectVars;

export type ImpProjectVarActions =
  ImpProjectVarActionsAffectingParent
  | UpdateImpProjectVar
  | UpdateImpProjectVars;
