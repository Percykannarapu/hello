import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { MediaPlanGroup } from '../../../val-modules/mediaexpress/models/MediaPlanGroup';

export enum MediaPlanGroupActionTypes {
  LoadMediaPlanGroups = '[MediaPlanGroup] Load MediaPlanGroups',
  AddMediaPlanGroup = '[MediaPlanGroup] Add MediaPlanGroup',
  UpsertMediaPlanGroup = '[MediaPlanGroup] Upsert MediaPlanGroup',
  AddMediaPlanGroups = '[MediaPlanGroup] Add MediaPlanGroups',
  UpsertMediaPlanGroups = '[MediaPlanGroup] Upsert MediaPlanGroups',
  UpdateMediaPlanGroup = '[MediaPlanGroup] Update MediaPlanGroup',
  UpdateMediaPlanGroups = '[MediaPlanGroup] Update MediaPlanGroups',
  DeleteMediaPlanGroup = '[MediaPlanGroup] Delete MediaPlanGroup',
  DeleteMediaPlanGroups = '[MediaPlanGroup] Delete MediaPlanGroups',
  ClearMediaPlanGroups = '[MediaPlanGroup] Clear MediaPlanGroups'
}

export class LoadMediaPlanGroups implements Action {
  readonly type = MediaPlanGroupActionTypes.LoadMediaPlanGroups;

  constructor(public payload: { mediaPlanGroups: MediaPlanGroup[] }) {}
}

export class AddMediaPlanGroup implements Action {
  readonly type = MediaPlanGroupActionTypes.AddMediaPlanGroup;

  constructor(public payload: { mediaPlanGroup: MediaPlanGroup }) {}
}

export class UpsertMediaPlanGroup implements Action {
  readonly type = MediaPlanGroupActionTypes.UpsertMediaPlanGroup;

  constructor(public payload: { mediaPlanGroup: MediaPlanGroup }) {}
}

export class AddMediaPlanGroups implements Action {
  readonly type = MediaPlanGroupActionTypes.AddMediaPlanGroups;

  constructor(public payload: { mediaPlanGroups: MediaPlanGroup[] }) {}
}

export class UpsertMediaPlanGroups implements Action {
  readonly type = MediaPlanGroupActionTypes.UpsertMediaPlanGroups;

  constructor(public payload: { mediaPlanGroups: MediaPlanGroup[] }) {}
}

export class UpdateMediaPlanGroup implements Action {
  readonly type = MediaPlanGroupActionTypes.UpdateMediaPlanGroup;

  constructor(public payload: { mediaPlanGroup: Update<MediaPlanGroup> }) {}
}

export class UpdateMediaPlanGroups implements Action {
  readonly type = MediaPlanGroupActionTypes.UpdateMediaPlanGroups;

  constructor(public payload: { mediaPlanGroups: Update<MediaPlanGroup>[] }) {}
}

export class DeleteMediaPlanGroup implements Action {
  readonly type = MediaPlanGroupActionTypes.DeleteMediaPlanGroup;

  constructor(public payload: { id: string }) {}
}

export class DeleteMediaPlanGroups implements Action {
  readonly type = MediaPlanGroupActionTypes.DeleteMediaPlanGroups;

  constructor(public payload: { ids: string[] }) {}
}

export class ClearMediaPlanGroups implements Action {
  readonly type = MediaPlanGroupActionTypes.ClearMediaPlanGroups;
}

export type MediaPlanGroupActions =
 LoadMediaPlanGroups
 | AddMediaPlanGroup
 | UpsertMediaPlanGroup
 | AddMediaPlanGroups
 | UpsertMediaPlanGroups
 | UpdateMediaPlanGroup
 | UpdateMediaPlanGroups
 | DeleteMediaPlanGroup
 | DeleteMediaPlanGroups
 | ClearMediaPlanGroups;
