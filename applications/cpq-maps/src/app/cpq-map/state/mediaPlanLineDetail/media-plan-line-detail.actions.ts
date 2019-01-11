import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { MediaPlanLineDetail } from '../../../val-modules/mediaexpress/models/MediaPlanLineDetail';

export enum MediaPlanLineDetailActionTypes {
  LoadMediaPlanLineDetails = '[MediaPlanLineDetail] Load MediaPlanLineDetails',
  AddMediaPlanLineDetail = '[MediaPlanLineDetail] Add MediaPlanLineDetail',
  UpsertMediaPlanLineDetail = '[MediaPlanLineDetail] Upsert MediaPlanLineDetail',
  AddMediaPlanLineDetails = '[MediaPlanLineDetail] Add MediaPlanLineDetails',
  UpsertMediaPlanLineDetails = '[MediaPlanLineDetail] Upsert MediaPlanLineDetails',
  UpdateMediaPlanLineDetail = '[MediaPlanLineDetail] Update MediaPlanLineDetail',
  UpdateMediaPlanLineDetails = '[MediaPlanLineDetail] Update MediaPlanLineDetails',
  DeleteMediaPlanLineDetail = '[MediaPlanLineDetail] Delete MediaPlanLineDetail',
  DeleteMediaPlanLineDetails = '[MediaPlanLineDetail] Delete MediaPlanLineDetails',
  ClearMediaPlanLineDetails = '[MediaPlanLineDetail] Clear MediaPlanLineDetails'
}

export class LoadMediaPlanLineDetails implements Action {
  readonly type = MediaPlanLineDetailActionTypes.LoadMediaPlanLineDetails;

  constructor(public payload: { mediaPlanLineDetails: MediaPlanLineDetail[] }) {}
}

export class AddMediaPlanLineDetail implements Action {
  readonly type = MediaPlanLineDetailActionTypes.AddMediaPlanLineDetail;

  constructor(public payload: { mediaPlanLineDetail: MediaPlanLineDetail }) {}
}

export class UpsertMediaPlanLineDetail implements Action {
  readonly type = MediaPlanLineDetailActionTypes.UpsertMediaPlanLineDetail;

  constructor(public payload: { mediaPlanLineDetail: MediaPlanLineDetail }) {}
}

export class AddMediaPlanLineDetails implements Action {
  readonly type = MediaPlanLineDetailActionTypes.AddMediaPlanLineDetails;

  constructor(public payload: { mediaPlanLineDetails: MediaPlanLineDetail[] }) {}
}

export class UpsertMediaPlanLineDetails implements Action {
  readonly type = MediaPlanLineDetailActionTypes.UpsertMediaPlanLineDetails;

  constructor(public payload: { mediaPlanLineDetails: MediaPlanLineDetail[] }) {}
}

export class UpdateMediaPlanLineDetail implements Action {
  readonly type = MediaPlanLineDetailActionTypes.UpdateMediaPlanLineDetail;

  constructor(public payload: { mediaPlanLineDetail: Update<MediaPlanLineDetail> }) {}
}

export class UpdateMediaPlanLineDetails implements Action {
  readonly type = MediaPlanLineDetailActionTypes.UpdateMediaPlanLineDetails;

  constructor(public payload: { mediaPlanLineDetails: Update<MediaPlanLineDetail>[] }) {}
}

export class DeleteMediaPlanLineDetail implements Action {
  readonly type = MediaPlanLineDetailActionTypes.DeleteMediaPlanLineDetail;

  constructor(public payload: { id: string }) {}
}

export class DeleteMediaPlanLineDetails implements Action {
  readonly type = MediaPlanLineDetailActionTypes.DeleteMediaPlanLineDetails;

  constructor(public payload: { ids: string[] }) {}
}

export class ClearMediaPlanLineDetails implements Action {
  readonly type = MediaPlanLineDetailActionTypes.ClearMediaPlanLineDetails;
}

export type MediaPlanLineDetailActions =
 LoadMediaPlanLineDetails
 | AddMediaPlanLineDetail
 | UpsertMediaPlanLineDetail
 | AddMediaPlanLineDetails
 | UpsertMediaPlanLineDetails
 | UpdateMediaPlanLineDetail
 | UpdateMediaPlanLineDetails
 | DeleteMediaPlanLineDetail
 | DeleteMediaPlanLineDetails
 | ClearMediaPlanLineDetails;
