import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { CbxReportType } from '../../../val-modules/mediaexpress/models/CbxReportType';

export enum CbxReportTypeActionTypes {
  LoadCbxReportTypes = '[CbxReportType] Load CbxReportTypes',
  AddCbxReportType = '[CbxReportType] Add CbxReportType',
  UpsertCbxReportType = '[CbxReportType] Upsert CbxReportType',
  AddCbxReportTypes = '[CbxReportType] Add CbxReportTypes',
  UpsertCbxReportTypes = '[CbxReportType] Upsert CbxReportTypes',
  UpdateCbxReportType = '[CbxReportType] Update CbxReportType',
  UpdateCbxReportTypes = '[CbxReportType] Update CbxReportTypes',
  DeleteCbxReportType = '[CbxReportType] Delete CbxReportType',
  DeleteCbxReportTypes = '[CbxReportType] Delete CbxReportTypes',
  ClearCbxReportTypes = '[CbxReportType] Clear CbxReportTypes'
}

export class LoadCbxReportTypes implements Action {
  readonly type = CbxReportTypeActionTypes.LoadCbxReportTypes;

  constructor(public payload: { cbxReportTypes: CbxReportType[] }) {}
}

export class AddCbxReportType implements Action {
  readonly type = CbxReportTypeActionTypes.AddCbxReportType;

  constructor(public payload: { cbxReportType: CbxReportType }) {}
}

export class UpsertCbxReportType implements Action {
  readonly type = CbxReportTypeActionTypes.UpsertCbxReportType;

  constructor(public payload: { cbxReportType: CbxReportType }) {}
}

export class AddCbxReportTypes implements Action {
  readonly type = CbxReportTypeActionTypes.AddCbxReportTypes;

  constructor(public payload: { cbxReportTypes: CbxReportType[] }) {}
}

export class UpsertCbxReportTypes implements Action {
  readonly type = CbxReportTypeActionTypes.UpsertCbxReportTypes;

  constructor(public payload: { cbxReportTypes: CbxReportType[] }) {}
}

export class UpdateCbxReportType implements Action {
  readonly type = CbxReportTypeActionTypes.UpdateCbxReportType;

  constructor(public payload: { cbxReportType: Update<CbxReportType> }) {}
}

export class UpdateCbxReportTypes implements Action {
  readonly type = CbxReportTypeActionTypes.UpdateCbxReportTypes;

  constructor(public payload: { cbxReportTypes: Update<CbxReportType>[] }) {}
}

export class DeleteCbxReportType implements Action {
  readonly type = CbxReportTypeActionTypes.DeleteCbxReportType;

  constructor(public payload: { id: string }) {}
}

export class DeleteCbxReportTypes implements Action {
  readonly type = CbxReportTypeActionTypes.DeleteCbxReportTypes;

  constructor(public payload: { ids: string[] }) {}
}

export class ClearCbxReportTypes implements Action {
  readonly type = CbxReportTypeActionTypes.ClearCbxReportTypes;
}

export type CbxReportTypeActions =
 LoadCbxReportTypes
 | AddCbxReportType
 | UpsertCbxReportType
 | AddCbxReportTypes
 | UpsertCbxReportTypes
 | UpdateCbxReportType
 | UpdateCbxReportTypes
 | DeleteCbxReportType
 | DeleteCbxReportTypes
 | ClearCbxReportTypes;
