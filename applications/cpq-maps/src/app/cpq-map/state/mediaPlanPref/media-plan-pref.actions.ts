import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { MediaPlanPref } from '../../../val-modules/mediaexpress/models/MediaPlanPref';


export enum MediaPlanPrefActionTypes {
  LoadMediaPlanPrefs   = '[MediaPlanPref] Load MediaPlanPrefs',
  AddMediaPlanPref     = '[MediaPlanPref] Add MediaPlanPref',
  UpsertMediaPlanPref  = '[MediaPlanPref] Upsert MediaPlanPref',
  AddMediaPlanPrefs    = '[MediaPlanPref] Add MediaPlanPrefs',
  UpsertMediaPlanPrefs = '[MediaPlanPref] Upsert MediaPlanPrefs',
  UpdateMediaPlanPref  = '[MediaPlanPref] Update MediaPlanPref',
  UpdateMediaPlanPrefs = '[MediaPlanPref] Update MediaPlanPrefs',
  DeleteMediaPlanPref  = '[MediaPlanPref] Delete MediaPlanPref',
  DeleteMediaPlanPrefs = '[MediaPlanPref] Delete MediaPlanPrefs',
  ClearMediaPlanPrefs  = '[MediaPlanPref] Clear MediaPlanPrefs'
}


export class LoadMediaPlanPrefs implements Action {
  readonly type = MediaPlanPrefActionTypes.LoadMediaPlanPrefs;

  constructor(public payload: { mediaPlanPrefs: MediaPlanPref[] }) {}
}

export class AddMediaPlanPref implements Action {
  readonly type = MediaPlanPrefActionTypes.AddMediaPlanPref;

  constructor(public payload: { mediaPlanPref: MediaPlanPref }) {}
}

export class UpsertMediaPlanPref implements Action {
  readonly type = MediaPlanPrefActionTypes.UpsertMediaPlanPref;

  constructor(public payload: { mediaPlanPref: MediaPlanPref }) {}
}

export class AddMediaPlanPrefs implements Action {
  readonly type = MediaPlanPrefActionTypes.AddMediaPlanPrefs;

  constructor(public payload: { mediaPlanPrefs: MediaPlanPref[] }) {}
}

export class UpsertMediaPlanPrefs implements Action {
  readonly type = MediaPlanPrefActionTypes.UpsertMediaPlanPrefs;

  constructor(public payload: { mediaPlanPrefs: MediaPlanPref[] }) {}
}

export class UpdateMediaPlanPref implements Action {
  readonly type = MediaPlanPrefActionTypes.UpdateMediaPlanPref;

  constructor(public payload: { mediaPlanPref: Update<MediaPlanPref> }) {}
}

export class UpdateMediaPlanPrefs implements Action {
  readonly type = MediaPlanPrefActionTypes.UpdateMediaPlanPrefs;

  constructor(public payload: { mediaPlanPrefs: Update<MediaPlanPref>[] }) {}
}

export class DeleteMediaPlanPref implements Action {
  readonly type = MediaPlanPrefActionTypes.DeleteMediaPlanPref;

  constructor(public payload: { id: string }) {}
}

export class DeleteMediaPlanPrefs implements Action {
  readonly type = MediaPlanPrefActionTypes.DeleteMediaPlanPrefs;

  constructor(public payload: { ids: string[] }) {}
}

export class ClearMediaPlanPrefs implements Action {
  readonly type = MediaPlanPrefActionTypes.ClearMediaPlanPrefs;
}



export type MediaPlanPrefActions =
 LoadMediaPlanPrefs
 | AddMediaPlanPref
 | UpsertMediaPlanPref
 | AddMediaPlanPrefs
 | UpsertMediaPlanPrefs
 | UpdateMediaPlanPref
 | UpdateMediaPlanPrefs
 | DeleteMediaPlanPref
 | DeleteMediaPlanPrefs
 | ClearMediaPlanPrefs;