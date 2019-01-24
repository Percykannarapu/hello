import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { ImpGeofootprintLocAttribState } from '../../models/imp-geofootprint-loc-attrib-state';

export enum ImpGeofootprintLocAttribActionTypes {
  AddImpGeofootprintLocAttrib = '[ImpGeofootprintLocAttrib Entity] Add ImpGeofootprintLocAttrib',
  AddImpGeofootprintLocAttribs = '[ImpGeofootprintLocAttrib Entity] Add ImpGeofootprintLocAttribs',
  UpdateImpGeofootprintLocAttrib = '[ImpGeofootprintLocAttrib Entity] Update ImpGeofootprintLocAttrib',
  UpdateImpGeofootprintLocAttribs = '[ImpGeofootprintLocAttrib Entity] Update ImpGeofootprintLocAttribs',
  DeleteImpGeofootprintLocAttrib = '[ImpGeofootprintLocAttrib Entity] Delete ImpGeofootprintLocAttrib',
  DeleteImpGeofootprintLocAttribs = '[ImpGeofootprintLocAttrib Entity] Delete ImpGeofootprintLocAttribs',
  ClearImpGeofootprintLocAttribs = '[ImpGeofootprintLocAttrib Entity] Clear ImpGeofootprintLocAttribs'
}

export class AddImpGeofootprintLocAttrib implements Action {
  readonly type = ImpGeofootprintLocAttribActionTypes.AddImpGeofootprintLocAttrib;

  constructor(public payload: { impGeofootprintLocAttrib: ImpGeofootprintLocAttribState }) {}
}

export class AddImpGeofootprintLocAttribs implements Action {
  readonly type = ImpGeofootprintLocAttribActionTypes.AddImpGeofootprintLocAttribs;

  constructor(public payload: { impGeofootprintLocAttribs: ImpGeofootprintLocAttribState[] }) {}
}

export class UpdateImpGeofootprintLocAttrib implements Action {
  readonly type = ImpGeofootprintLocAttribActionTypes.UpdateImpGeofootprintLocAttrib;

  constructor(public payload: { impGeofootprintLocAttrib: Update<ImpGeofootprintLocAttribState> }) {}
}

export class UpdateImpGeofootprintLocAttribs implements Action {
  readonly type = ImpGeofootprintLocAttribActionTypes.UpdateImpGeofootprintLocAttribs;

  constructor(public payload: { impGeofootprintLocAttribs: Update<ImpGeofootprintLocAttribState>[] }) {}
}

export class DeleteImpGeofootprintLocAttrib implements Action {
  readonly type = ImpGeofootprintLocAttribActionTypes.DeleteImpGeofootprintLocAttrib;

  constructor(public payload: { id: number }) {}
}

export class DeleteImpGeofootprintLocAttribs implements Action {
  readonly type = ImpGeofootprintLocAttribActionTypes.DeleteImpGeofootprintLocAttribs;

  constructor(public payload: { ids: number[] }) {}
}

export class ClearImpGeofootprintLocAttribs implements Action {
  readonly type = ImpGeofootprintLocAttribActionTypes.ClearImpGeofootprintLocAttribs;
}

export type ImpGeofootprintLocAttribActionsAffectingParent =
  AddImpGeofootprintLocAttrib
  | AddImpGeofootprintLocAttribs
  | DeleteImpGeofootprintLocAttrib
  | DeleteImpGeofootprintLocAttribs
  | ClearImpGeofootprintLocAttribs;

export type ImpGeofootprintLocAttribActions =
  ImpGeofootprintLocAttribActionsAffectingParent
 | UpdateImpGeofootprintLocAttrib
 | UpdateImpGeofootprintLocAttribs;

