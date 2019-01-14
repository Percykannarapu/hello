import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { CbxReport } from '../../../val-modules/mediaexpress/models/CbxReport';

export enum CbxReportActionTypes {
  LoadCbxReports = '[CbxReport] Load CbxReports',
  AddCbxReport = '[CbxReport] Add CbxReport',
  UpsertCbxReport = '[CbxReport] Upsert CbxReport',
  AddCbxReports = '[CbxReport] Add CbxReports',
  UpsertCbxReports = '[CbxReport] Upsert CbxReports',
  UpdateCbxReport = '[CbxReport] Update CbxReport',
  UpdateCbxReports = '[CbxReport] Update CbxReports',
  DeleteCbxReport = '[CbxReport] Delete CbxReport',
  DeleteCbxReports = '[CbxReport] Delete CbxReports',
  ClearCbxReports = '[CbxReport] Clear CbxReports'
}

export class LoadCbxReports implements Action {
  readonly type = CbxReportActionTypes.LoadCbxReports;

  constructor(public payload: { cbxReports: CbxReport[] }) {}
}

export class AddCbxReport implements Action {
  readonly type = CbxReportActionTypes.AddCbxReport;

  constructor(public payload: { cbxReport: CbxReport }) {}
}

export class UpsertCbxReport implements Action {
  readonly type = CbxReportActionTypes.UpsertCbxReport;

  constructor(public payload: { cbxReport: CbxReport }) {}
}

export class AddCbxReports implements Action {
  readonly type = CbxReportActionTypes.AddCbxReports;

  constructor(public payload: { cbxReports: CbxReport[] }) {}
}

export class UpsertCbxReports implements Action {
  readonly type = CbxReportActionTypes.UpsertCbxReports;

  constructor(public payload: { cbxReports: CbxReport[] }) {}
}

export class UpdateCbxReport implements Action {
  readonly type = CbxReportActionTypes.UpdateCbxReport;

  constructor(public payload: { cbxReport: Update<CbxReport> }) {}
}

export class UpdateCbxReports implements Action {
  readonly type = CbxReportActionTypes.UpdateCbxReports;

  constructor(public payload: { cbxReports: Update<CbxReport>[] }) {}
}

export class DeleteCbxReport implements Action {
  readonly type = CbxReportActionTypes.DeleteCbxReport;

  constructor(public payload: { id: string }) {}
}

export class DeleteCbxReports implements Action {
  readonly type = CbxReportActionTypes.DeleteCbxReports;

  constructor(public payload: { ids: string[] }) {}
}

export class ClearCbxReports implements Action {
  readonly type = CbxReportActionTypes.ClearCbxReports;
}

export type CbxReportActions =
 LoadCbxReports
 | AddCbxReport
 | UpsertCbxReport
 | AddCbxReports
 | UpsertCbxReports
 | UpdateCbxReport
 | UpdateCbxReports
 | DeleteCbxReport
 | DeleteCbxReports
 | ClearCbxReports;
