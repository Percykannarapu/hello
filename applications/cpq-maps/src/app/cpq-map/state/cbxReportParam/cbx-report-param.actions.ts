import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { CbxReportParam } from '../../../val-modules/mediaexpress/models/CbxReportParam';

export enum CbxReportParamActionTypes {
  LoadCbxReportParams = '[CbxReportParam] Load CbxReportParams',
  AddCbxReportParam = '[CbxReportParam] Add CbxReportParam',
  UpsertCbxReportParam = '[CbxReportParam] Upsert CbxReportParam',
  AddCbxReportParams = '[CbxReportParam] Add CbxReportParams',
  UpsertCbxReportParams = '[CbxReportParam] Upsert CbxReportParams',
  UpdateCbxReportParam = '[CbxReportParam] Update CbxReportParam',
  UpdateCbxReportParams = '[CbxReportParam] Update CbxReportParams',
  DeleteCbxReportParam = '[CbxReportParam] Delete CbxReportParam',
  DeleteCbxReportParams = '[CbxReportParam] Delete CbxReportParams',
  ClearCbxReportParams = '[CbxReportParam] Clear CbxReportParams'
}

export class LoadCbxReportParams implements Action {
  readonly type = CbxReportParamActionTypes.LoadCbxReportParams;

  constructor(public payload: { cbxReportParams: CbxReportParam[] }) {}
}

export class AddCbxReportParam implements Action {
  readonly type = CbxReportParamActionTypes.AddCbxReportParam;

  constructor(public payload: { cbxReportParam: CbxReportParam }) {}
}

export class UpsertCbxReportParam implements Action {
  readonly type = CbxReportParamActionTypes.UpsertCbxReportParam;

  constructor(public payload: { cbxReportParam: CbxReportParam }) {}
}

export class AddCbxReportParams implements Action {
  readonly type = CbxReportParamActionTypes.AddCbxReportParams;

  constructor(public payload: { cbxReportParams: CbxReportParam[] }) {}
}

export class UpsertCbxReportParams implements Action {
  readonly type = CbxReportParamActionTypes.UpsertCbxReportParams;

  constructor(public payload: { cbxReportParams: CbxReportParam[] }) {}
}

export class UpdateCbxReportParam implements Action {
  readonly type = CbxReportParamActionTypes.UpdateCbxReportParam;

  constructor(public payload: { cbxReportParam: Update<CbxReportParam> }) {}
}

export class UpdateCbxReportParams implements Action {
  readonly type = CbxReportParamActionTypes.UpdateCbxReportParams;

  constructor(public payload: { cbxReportParams: Update<CbxReportParam>[] }) {}
}

export class DeleteCbxReportParam implements Action {
  readonly type = CbxReportParamActionTypes.DeleteCbxReportParam;

  constructor(public payload: { id: string }) {}
}

export class DeleteCbxReportParams implements Action {
  readonly type = CbxReportParamActionTypes.DeleteCbxReportParams;

  constructor(public payload: { ids: string[] }) {}
}

export class ClearCbxReportParams implements Action {
  readonly type = CbxReportParamActionTypes.ClearCbxReportParams;
}

export type CbxReportParamActions =
 LoadCbxReportParams
 | AddCbxReportParam
 | UpsertCbxReportParam
 | AddCbxReportParams
 | UpsertCbxReportParams
 | UpdateCbxReportParam
 | UpdateCbxReportParams
 | DeleteCbxReportParam
 | DeleteCbxReportParams
 | ClearCbxReportParams;
