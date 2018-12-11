import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { ImpProjectPrefState } from '../../models/imp-project-pref-state';

export enum ImpProjectPrefActionTypes {
  AddImpProjectPref = '[ImpProjectPref Entity] Add ImpProjectPref',
  AddImpProjectPrefs = '[ImpProjectPref Entity] Add ImpProjectPrefs',
  UpdateImpProjectPref = '[ImpProjectPref Entity] Update ImpProjectPref',
  UpdateImpProjectPrefs = '[ImpProjectPref Entity] Update ImpProjectPrefs',
  DeleteImpProjectPref = '[ImpProjectPref Entity] Delete ImpProjectPref',
  DeleteImpProjectPrefs = '[ImpProjectPref Entity] Delete ImpProjectPrefs',
  ClearImpProjectPrefs = '[ImpProjectPref Entity] Clear ImpProjectPrefs'
}

export class AddImpProjectPref implements Action {
  readonly type = ImpProjectPrefActionTypes.AddImpProjectPref;

  constructor(public payload: { impProjectPref: ImpProjectPrefState }) {}
}

export class AddImpProjectPrefs implements Action {
  readonly type = ImpProjectPrefActionTypes.AddImpProjectPrefs;

  constructor(public payload: { impProjectPrefs: ImpProjectPrefState[] }) {}
}

export class UpdateImpProjectPref implements Action {
  readonly type = ImpProjectPrefActionTypes.UpdateImpProjectPref;

  constructor(public payload: { impProjectPref: Update<ImpProjectPrefState> }) {}
}

export class UpdateImpProjectPrefs implements Action {
  readonly type = ImpProjectPrefActionTypes.UpdateImpProjectPrefs;

  constructor(public payload: { impProjectPrefs: Update<ImpProjectPrefState>[] }) {}
}

export class DeleteImpProjectPref implements Action {
  readonly type = ImpProjectPrefActionTypes.DeleteImpProjectPref;

  constructor(public payload: { id: number }) {}
}

export class DeleteImpProjectPrefs implements Action {
  readonly type = ImpProjectPrefActionTypes.DeleteImpProjectPrefs;

  constructor(public payload: { ids: number[] }) {}
}

export class ClearImpProjectPrefs implements Action {
  readonly type = ImpProjectPrefActionTypes.ClearImpProjectPrefs;
}

export type ImpProjectPrefActionsAffectingParent =
  AddImpProjectPref |
  AddImpProjectPrefs |
  DeleteImpProjectPref |
  DeleteImpProjectPrefs |
  ClearImpProjectPrefs;

export type ImpProjectPrefActions =
  ImpProjectPrefActionsAffectingParent
  | UpdateImpProjectPref
  | UpdateImpProjectPrefs;
