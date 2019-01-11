import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { MediaPlan } from '../../../val-modules/mediaexpress/models/MediaPlan';

export enum MediaPlanActionTypes {
  LoadMediaPlans = '[MediaPlan] Load MediaPlans',
  AddMediaPlan = '[MediaPlan] Add MediaPlan',
  UpsertMediaPlan = '[MediaPlan] Upsert MediaPlan',
  AddMediaPlans = '[MediaPlan] Add MediaPlans',
  UpsertMediaPlans = '[MediaPlan] Upsert MediaPlans',
  UpdateMediaPlan = '[MediaPlan] Update MediaPlan',
  UpdateMediaPlans = '[MediaPlan] Update MediaPlans',
  DeleteMediaPlan = '[MediaPlan] Delete MediaPlan',
  DeleteMediaPlans = '[MediaPlan] Delete MediaPlans',
  ClearMediaPlans = '[MediaPlan] Clear MediaPlans'
}

export class LoadMediaPlans implements Action {
  readonly type = MediaPlanActionTypes.LoadMediaPlans;

  constructor(public payload: { mediaPlans: MediaPlan[] }) {}
}

export class AddMediaPlan implements Action {
  readonly type = MediaPlanActionTypes.AddMediaPlan;

  constructor(public payload: { mediaPlan: MediaPlan }) {}
}

export class UpsertMediaPlan implements Action {
  readonly type = MediaPlanActionTypes.UpsertMediaPlan;

  constructor(public payload: { mediaPlan: MediaPlan }) {}
}

export class AddMediaPlans implements Action {
  readonly type = MediaPlanActionTypes.AddMediaPlans;

  constructor(public payload: { mediaPlans: MediaPlan[] }) {}
}

export class UpsertMediaPlans implements Action {
  readonly type = MediaPlanActionTypes.UpsertMediaPlans;

  constructor(public payload: { mediaPlans: MediaPlan[] }) {}
}

export class UpdateMediaPlan implements Action {
  readonly type = MediaPlanActionTypes.UpdateMediaPlan;

  constructor(public payload: { mediaPlan: Update<MediaPlan> }) {}
}

export class UpdateMediaPlans implements Action {
  readonly type = MediaPlanActionTypes.UpdateMediaPlans;

  constructor(public payload: { mediaPlans: Update<MediaPlan>[] }) {}
}

export class DeleteMediaPlan implements Action {
  readonly type = MediaPlanActionTypes.DeleteMediaPlan;

  constructor(public payload: { id: string }) {}
}

export class DeleteMediaPlans implements Action {
  readonly type = MediaPlanActionTypes.DeleteMediaPlans;

  constructor(public payload: { ids: string[] }) {}
}

export class ClearMediaPlans implements Action {
  readonly type = MediaPlanActionTypes.ClearMediaPlans;
}

export type MediaPlanActions =
 LoadMediaPlans
 | AddMediaPlan
 | UpsertMediaPlan
 | AddMediaPlans
 | UpsertMediaPlans
 | UpdateMediaPlan
 | UpdateMediaPlans
 | DeleteMediaPlan
 | DeleteMediaPlans
 | ClearMediaPlans;
