import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { MediaPlanCommonMbu } from '../../../val-modules/mediaexpress/models/MediaPlanCommonMbu';

export enum MediaPlanCommonMbuActionTypes {
  LoadMediaPlanCommonMbus = '[MediaPlanCommonMbu] Load MediaPlanCommonMbus',
  AddMediaPlanCommonMbu = '[MediaPlanCommonMbu] Add MediaPlanCommonMbu',
  UpsertMediaPlanCommonMbu = '[MediaPlanCommonMbu] Upsert MediaPlanCommonMbu',
  AddMediaPlanCommonMbus = '[MediaPlanCommonMbu] Add MediaPlanCommonMbus',
  UpsertMediaPlanCommonMbus = '[MediaPlanCommonMbu] Upsert MediaPlanCommonMbus',
  UpdateMediaPlanCommonMbu = '[MediaPlanCommonMbu] Update MediaPlanCommonMbu',
  UpdateMediaPlanCommonMbus = '[MediaPlanCommonMbu] Update MediaPlanCommonMbus',
  DeleteMediaPlanCommonMbu = '[MediaPlanCommonMbu] Delete MediaPlanCommonMbu',
  DeleteMediaPlanCommonMbus = '[MediaPlanCommonMbu] Delete MediaPlanCommonMbus',
  ClearMediaPlanCommonMbus = '[MediaPlanCommonMbu] Clear MediaPlanCommonMbus'
}

export class LoadMediaPlanCommonMbus implements Action {
  readonly type = MediaPlanCommonMbuActionTypes.LoadMediaPlanCommonMbus;

  constructor(public payload: { mediaPlanCommonMbus: MediaPlanCommonMbu[] }) {}
}

export class AddMediaPlanCommonMbu implements Action {
  readonly type = MediaPlanCommonMbuActionTypes.AddMediaPlanCommonMbu;

  constructor(public payload: { mediaPlanCommonMbu: MediaPlanCommonMbu }) {}
}

export class UpsertMediaPlanCommonMbu implements Action {
  readonly type = MediaPlanCommonMbuActionTypes.UpsertMediaPlanCommonMbu;

  constructor(public payload: { mediaPlanCommonMbu: MediaPlanCommonMbu }) {}
}

export class AddMediaPlanCommonMbus implements Action {
  readonly type = MediaPlanCommonMbuActionTypes.AddMediaPlanCommonMbus;

  constructor(public payload: { mediaPlanCommonMbus: MediaPlanCommonMbu[] }) {}
}

export class UpsertMediaPlanCommonMbus implements Action {
  readonly type = MediaPlanCommonMbuActionTypes.UpsertMediaPlanCommonMbus;

  constructor(public payload: { mediaPlanCommonMbus: MediaPlanCommonMbu[] }) {}
}

export class UpdateMediaPlanCommonMbu implements Action {
  readonly type = MediaPlanCommonMbuActionTypes.UpdateMediaPlanCommonMbu;

  constructor(public payload: { mediaPlanCommonMbu: Update<MediaPlanCommonMbu> }) {}
}

export class UpdateMediaPlanCommonMbus implements Action {
  readonly type = MediaPlanCommonMbuActionTypes.UpdateMediaPlanCommonMbus;

  constructor(public payload: { mediaPlanCommonMbus: Update<MediaPlanCommonMbu>[] }) {}
}

export class DeleteMediaPlanCommonMbu implements Action {
  readonly type = MediaPlanCommonMbuActionTypes.DeleteMediaPlanCommonMbu;

  constructor(public payload: { id: string }) {}
}

export class DeleteMediaPlanCommonMbus implements Action {
  readonly type = MediaPlanCommonMbuActionTypes.DeleteMediaPlanCommonMbus;

  constructor(public payload: { ids: string[] }) {}
}

export class ClearMediaPlanCommonMbus implements Action {
  readonly type = MediaPlanCommonMbuActionTypes.ClearMediaPlanCommonMbus;
}

export type MediaPlanCommonMbuActions =
 LoadMediaPlanCommonMbus
 | AddMediaPlanCommonMbu
 | UpsertMediaPlanCommonMbu
 | AddMediaPlanCommonMbus
 | UpsertMediaPlanCommonMbus
 | UpdateMediaPlanCommonMbu
 | UpdateMediaPlanCommonMbus
 | DeleteMediaPlanCommonMbu
 | DeleteMediaPlanCommonMbus
 | ClearMediaPlanCommonMbus;
