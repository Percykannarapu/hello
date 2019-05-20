import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { RfpUiEditDetail } from '../../../val-modules/mediaexpress/models/RfpUiEditDetail';

export enum RfpUiEditDetailActionTypes {
  LoadRfpUiEditDetails = '[RfpUiEditDetail] Load RfpUiEditDetails',
  AddRfpUiEditDetail = '[RfpUiEditDetail] Add RfpUiEditDetail',
  UpsertRfpUiEditDetail = '[RfpUiEditDetail] Upsert RfpUiEditDetail',
  AddRfpUiEditDetails = '[RfpUiEditDetail] Add RfpUiEditDetails',
  UpsertRfpUiEditDetails = '[RfpUiEditDetail] Upsert RfpUiEditDetails',
  UpdateRfpUiEditDetail = '[RfpUiEditDetail] Update RfpUiEditDetail',
  UpdateRfpUiEditDetails = '[RfpUiEditDetail] Update RfpUiEditDetails',
  DeleteRfpUiEditDetail = '[RfpUiEditDetail] Delete RfpUiEditDetail',
  DeleteRfpUiEditDetails = '[RfpUiEditDetail] Delete RfpUiEditDetails',
  ClearRfpUiEditDetails = '[RfpUiEditDetail] Clear RfpUiEditDetails'
}

export class LoadRfpUiEditDetails implements Action {
  readonly type = RfpUiEditDetailActionTypes.LoadRfpUiEditDetails;

  constructor(public payload: { rfpUiEditDetails: RfpUiEditDetail[] }) {}
}

export class AddRfpUiEditDetail implements Action {
  readonly type = RfpUiEditDetailActionTypes.AddRfpUiEditDetail;

  constructor(public payload: { rfpUiEditDetail: RfpUiEditDetail }) {}
}

export class UpsertRfpUiEditDetail implements Action {
  readonly type = RfpUiEditDetailActionTypes.UpsertRfpUiEditDetail;

  constructor(public payload: { rfpUiEditDetail: RfpUiEditDetail }) {}
}

export class AddRfpUiEditDetails implements Action {
  readonly type = RfpUiEditDetailActionTypes.AddRfpUiEditDetails;

  constructor(public payload: { rfpUiEditDetails: RfpUiEditDetail[] }) {}
}

export class UpsertRfpUiEditDetails implements Action {
  readonly type = RfpUiEditDetailActionTypes.UpsertRfpUiEditDetails;

  constructor(public payload: { rfpUiEditDetails: RfpUiEditDetail[] }) {}
}

export class UpdateRfpUiEditDetail implements Action {
  readonly type = RfpUiEditDetailActionTypes.UpdateRfpUiEditDetail;

  constructor(public payload: { rfpUiEditDetail: Update<RfpUiEditDetail> }) {}
}

export class UpdateRfpUiEditDetails implements Action {
  readonly type = RfpUiEditDetailActionTypes.UpdateRfpUiEditDetails;

  constructor(public payload: { rfpUiEditDetails: Update<RfpUiEditDetail>[] }) {}
}

export class DeleteRfpUiEditDetail implements Action {
  readonly type = RfpUiEditDetailActionTypes.DeleteRfpUiEditDetail;

  constructor(public payload: { id: string, geocode: string }) {}
}

export class DeleteRfpUiEditDetails implements Action {
  readonly type = RfpUiEditDetailActionTypes.DeleteRfpUiEditDetails;

  constructor(public payload: { ids: string[], geocodes: string[] }) {}
}

export class ClearRfpUiEditDetails implements Action {
  readonly type = RfpUiEditDetailActionTypes.ClearRfpUiEditDetails;
}

export type RfpUiEditDetailActions =
 LoadRfpUiEditDetails
 | AddRfpUiEditDetail
 | UpsertRfpUiEditDetail
 | AddRfpUiEditDetails
 | UpsertRfpUiEditDetails
 | UpdateRfpUiEditDetail
 | UpdateRfpUiEditDetails
 | DeleteRfpUiEditDetail
 | DeleteRfpUiEditDetails
 | ClearRfpUiEditDetails;
