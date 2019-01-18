import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { RfpUiReview } from '../../../val-modules/mediaexpress/models/RfpUiReview';

export enum RfpUiReviewActionTypes {
  LoadRfpUiReviews = '[RfpUiReview] Load RfpUiReviews',
  AddRfpUiReview = '[RfpUiReview] Add RfpUiReview',
  UpsertRfpUiReview = '[RfpUiReview] Upsert RfpUiReview',
  AddRfpUiReviews = '[RfpUiReview] Add RfpUiReviews',
  UpsertRfpUiReviews = '[RfpUiReview] Upsert RfpUiReviews',
  UpdateRfpUiReview = '[RfpUiReview] Update RfpUiReview',
  UpdateRfpUiReviews = '[RfpUiReview] Update RfpUiReviews',
  DeleteRfpUiReview = '[RfpUiReview] Delete RfpUiReview',
  DeleteRfpUiReviews = '[RfpUiReview] Delete RfpUiReviews',
  ClearRfpUiReviews = '[RfpUiReview] Clear RfpUiReviews'
}

export class LoadRfpUiReviews implements Action {
  readonly type = RfpUiReviewActionTypes.LoadRfpUiReviews;

  constructor(public payload: { rfpUiReviews: RfpUiReview[] }) {}
}

export class AddRfpUiReview implements Action {
  readonly type = RfpUiReviewActionTypes.AddRfpUiReview;

  constructor(public payload: { rfpUiReview: RfpUiReview }) {}
}

export class UpsertRfpUiReview implements Action {
  readonly type = RfpUiReviewActionTypes.UpsertRfpUiReview;

  constructor(public payload: { rfpUiReview: RfpUiReview }) {}
}

export class AddRfpUiReviews implements Action {
  readonly type = RfpUiReviewActionTypes.AddRfpUiReviews;

  constructor(public payload: { rfpUiReviews: RfpUiReview[] }) {}
}

export class UpsertRfpUiReviews implements Action {
  readonly type = RfpUiReviewActionTypes.UpsertRfpUiReviews;

  constructor(public payload: { rfpUiReviews: RfpUiReview[] }) {}
}

export class UpdateRfpUiReview implements Action {
  readonly type = RfpUiReviewActionTypes.UpdateRfpUiReview;

  constructor(public payload: { rfpUiReview: Update<RfpUiReview> }) {}
}

export class UpdateRfpUiReviews implements Action {
  readonly type = RfpUiReviewActionTypes.UpdateRfpUiReviews;

  constructor(public payload: { rfpUiReviews: Update<RfpUiReview>[] }) {}
}

export class DeleteRfpUiReview implements Action {
  readonly type = RfpUiReviewActionTypes.DeleteRfpUiReview;

  constructor(public payload: { id: string }) {}
}

export class DeleteRfpUiReviews implements Action {
  readonly type = RfpUiReviewActionTypes.DeleteRfpUiReviews;

  constructor(public payload: { ids: string[] }) {}
}

export class ClearRfpUiReviews implements Action {
  readonly type = RfpUiReviewActionTypes.ClearRfpUiReviews;
}

export type RfpUiReviewActions =
 LoadRfpUiReviews
 | AddRfpUiReview
 | UpsertRfpUiReview
 | AddRfpUiReviews
 | UpsertRfpUiReviews
 | UpdateRfpUiReview
 | UpdateRfpUiReviews
 | DeleteRfpUiReview
 | DeleteRfpUiReviews
 | ClearRfpUiReviews;
