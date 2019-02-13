import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { RfpUiEditWrap } from '../../../val-modules/mediaexpress/models/RfpUiEditWrap';

export enum RfpUiEditWrapActionTypes {
  LoadRfpUiEditWraps = '[RfpUiEditWrap] Load RfpUiEditWraps',
  AddRfpUiEditWrap = '[RfpUiEditWrap] Add RfpUiEditWrap',
  UpsertRfpUiEditWrap = '[RfpUiEditWrap] Upsert RfpUiEditWrap',
  AddRfpUiEditWraps = '[RfpUiEditWrap] Add RfpUiEditWraps',
  UpsertRfpUiEditWraps = '[RfpUiEditWrap] Upsert RfpUiEditWraps',
  UpdateRfpUiEditWrap = '[RfpUiEditWrap] Update RfpUiEditWrap',
  UpdateRfpUiEditWraps = '[RfpUiEditWrap] Update RfpUiEditWraps',
  DeleteRfpUiEditWrap = '[RfpUiEditWrap] Delete RfpUiEditWrap',
  DeleteRfpUiEditWraps = '[RfpUiEditWrap] Delete RfpUiEditWraps',
  ClearRfpUiEditWraps = '[RfpUiEditWrap] Clear RfpUiEditWraps'
}

export class LoadRfpUiEditWraps implements Action {
  readonly type = RfpUiEditWrapActionTypes.LoadRfpUiEditWraps;

  constructor(public payload: { rfpUiEditWraps: RfpUiEditWrap[] }) {}
}

export class AddRfpUiEditWrap implements Action {
  readonly type = RfpUiEditWrapActionTypes.AddRfpUiEditWrap;

  constructor(public payload: { rfpUiEditWrap: RfpUiEditWrap }) {}
}

export class UpsertRfpUiEditWrap implements Action {
  readonly type = RfpUiEditWrapActionTypes.UpsertRfpUiEditWrap;

  constructor(public payload: { rfpUiEditWrap: RfpUiEditWrap }) {}
}

export class AddRfpUiEditWraps implements Action {
  readonly type = RfpUiEditWrapActionTypes.AddRfpUiEditWraps;

  constructor(public payload: { rfpUiEditWraps: RfpUiEditWrap[] }) {}
}

export class UpsertRfpUiEditWraps implements Action {
  readonly type = RfpUiEditWrapActionTypes.UpsertRfpUiEditWraps;

  constructor(public payload: { rfpUiEditWraps: RfpUiEditWrap[] }) {}
}

export class UpdateRfpUiEditWrap implements Action {
  readonly type = RfpUiEditWrapActionTypes.UpdateRfpUiEditWrap;

  constructor(public payload: { rfpUiEditWrap: Update<RfpUiEditWrap> }) {}
}

export class UpdateRfpUiEditWraps implements Action {
  readonly type = RfpUiEditWrapActionTypes.UpdateRfpUiEditWraps;

  constructor(public payload: { rfpUiEditWraps: Update<RfpUiEditWrap>[] }) {}
}

export class DeleteRfpUiEditWrap implements Action {
  readonly type = RfpUiEditWrapActionTypes.DeleteRfpUiEditWrap;

  constructor(public payload: { id: string }) {}
}

export class DeleteRfpUiEditWraps implements Action {
  readonly type = RfpUiEditWrapActionTypes.DeleteRfpUiEditWraps;

  constructor(public payload: { ids: string[] }) {}
}

export class ClearRfpUiEditWraps implements Action {
  readonly type = RfpUiEditWrapActionTypes.ClearRfpUiEditWraps;
}

export type RfpUiEditWrapActions =
 LoadRfpUiEditWraps
 | AddRfpUiEditWrap
 | UpsertRfpUiEditWrap
 | AddRfpUiEditWraps
 | UpsertRfpUiEditWraps
 | UpdateRfpUiEditWrap
 | UpdateRfpUiEditWraps
 | DeleteRfpUiEditWrap
 | DeleteRfpUiEditWraps
 | ClearRfpUiEditWraps;
