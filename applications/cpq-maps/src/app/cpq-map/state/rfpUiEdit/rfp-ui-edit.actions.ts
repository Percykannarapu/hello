import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { RfpUiEdit } from '../../../val-modules/mediaexpress/models/RfpUiEdit';

export enum RfpUiEditActionTypes {
  LoadRfpUiEdits = '[RfpUiEdit] Load RfpUiEdits',
  AddRfpUiEdit = '[RfpUiEdit] Add RfpUiEdit',
  UpsertRfpUiEdit = '[RfpUiEdit] Upsert RfpUiEdit',
  AddRfpUiEdits = '[RfpUiEdit] Add RfpUiEdits',
  UpsertRfpUiEdits = '[RfpUiEdit] Upsert RfpUiEdits',
  UpdateRfpUiEdit = '[RfpUiEdit] Update RfpUiEdit',
  UpdateRfpUiEdits = '[RfpUiEdit] Update RfpUiEdits',
  DeleteRfpUiEdit = '[RfpUiEdit] Delete RfpUiEdit',
  DeleteRfpUiEdits = '[RfpUiEdit] Delete RfpUiEdits',
  ClearRfpUiEdits = '[RfpUiEdit] Clear RfpUiEdits'
}

export class LoadRfpUiEdits implements Action {
  readonly type = RfpUiEditActionTypes.LoadRfpUiEdits;

  constructor(public payload: { rfpUiEdits: RfpUiEdit[] }) {}
}

export class AddRfpUiEdit implements Action {
  readonly type = RfpUiEditActionTypes.AddRfpUiEdit;

  constructor(public payload: { rfpUiEdit: RfpUiEdit }) {}
}

export class UpsertRfpUiEdit implements Action {
  readonly type = RfpUiEditActionTypes.UpsertRfpUiEdit;

  constructor(public payload: { rfpUiEdit: RfpUiEdit }) {}
}

export class AddRfpUiEdits implements Action {
  readonly type = RfpUiEditActionTypes.AddRfpUiEdits;

  constructor(public payload: { rfpUiEdits: RfpUiEdit[] }) {}
}

export class UpsertRfpUiEdits implements Action {
  readonly type = RfpUiEditActionTypes.UpsertRfpUiEdits;

  constructor(public payload: { rfpUiEdits: RfpUiEdit[] }) {}
}

export class UpdateRfpUiEdit implements Action {
  readonly type = RfpUiEditActionTypes.UpdateRfpUiEdit;

  constructor(public payload: { rfpUiEdit: Update<RfpUiEdit> }) {}
}

export class UpdateRfpUiEdits implements Action {
  readonly type = RfpUiEditActionTypes.UpdateRfpUiEdits;

  constructor(public payload: { rfpUiEdits: Update<RfpUiEdit>[] }) {}
}

export class DeleteRfpUiEdit implements Action {
  readonly type = RfpUiEditActionTypes.DeleteRfpUiEdit;

  constructor(public payload: { id: string }) {}
}

export class DeleteRfpUiEdits implements Action {
  readonly type = RfpUiEditActionTypes.DeleteRfpUiEdits;

  constructor(public payload: { ids: string[] }) {}
}

export class ClearRfpUiEdits implements Action {
  readonly type = RfpUiEditActionTypes.ClearRfpUiEdits;
}

export type RfpUiEditActions =
 LoadRfpUiEdits
 | AddRfpUiEdit
 | UpsertRfpUiEdit
 | AddRfpUiEdits
 | UpsertRfpUiEdits
 | UpdateRfpUiEdit
 | UpdateRfpUiEdits
 | DeleteRfpUiEdit
 | DeleteRfpUiEdits
 | ClearRfpUiEdits;
