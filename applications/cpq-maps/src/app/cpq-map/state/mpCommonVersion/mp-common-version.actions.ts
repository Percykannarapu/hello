import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { MpCommonVersion } from '../../../val-modules/mediaexpress/models/MpCommonVersion';

export enum MpCommonVersionActionTypes {
  LoadMpCommonVersions = '[MpCommonVersion] Load MpCommonVersions',
  AddMpCommonVersion = '[MpCommonVersion] Add MpCommonVersion',
  UpsertMpCommonVersion = '[MpCommonVersion] Upsert MpCommonVersion',
  AddMpCommonVersions = '[MpCommonVersion] Add MpCommonVersions',
  UpsertMpCommonVersions = '[MpCommonVersion] Upsert MpCommonVersions',
  UpdateMpCommonVersion = '[MpCommonVersion] Update MpCommonVersion',
  UpdateMpCommonVersions = '[MpCommonVersion] Update MpCommonVersions',
  DeleteMpCommonVersion = '[MpCommonVersion] Delete MpCommonVersion',
  DeleteMpCommonVersions = '[MpCommonVersion] Delete MpCommonVersions',
  ClearMpCommonVersions = '[MpCommonVersion] Clear MpCommonVersions'
}

export class LoadMpCommonVersions implements Action {
  readonly type = MpCommonVersionActionTypes.LoadMpCommonVersions;

  constructor(public payload: { mpCommonVersions: MpCommonVersion[] }) {}
}

export class AddMpCommonVersion implements Action {
  readonly type = MpCommonVersionActionTypes.AddMpCommonVersion;

  constructor(public payload: { mpCommonVersion: MpCommonVersion }) {}
}

export class UpsertMpCommonVersion implements Action {
  readonly type = MpCommonVersionActionTypes.UpsertMpCommonVersion;

  constructor(public payload: { mpCommonVersion: MpCommonVersion }) {}
}

export class AddMpCommonVersions implements Action {
  readonly type = MpCommonVersionActionTypes.AddMpCommonVersions;

  constructor(public payload: { mpCommonVersions: MpCommonVersion[] }) {}
}

export class UpsertMpCommonVersions implements Action {
  readonly type = MpCommonVersionActionTypes.UpsertMpCommonVersions;

  constructor(public payload: { mpCommonVersions: MpCommonVersion[] }) {}
}

export class UpdateMpCommonVersion implements Action {
  readonly type = MpCommonVersionActionTypes.UpdateMpCommonVersion;

  constructor(public payload: { mpCommonVersion: Update<MpCommonVersion> }) {}
}

export class UpdateMpCommonVersions implements Action {
  readonly type = MpCommonVersionActionTypes.UpdateMpCommonVersions;

  constructor(public payload: { mpCommonVersions: Update<MpCommonVersion>[] }) {}
}

export class DeleteMpCommonVersion implements Action {
  readonly type = MpCommonVersionActionTypes.DeleteMpCommonVersion;

  constructor(public payload: { id: string }) {}
}

export class DeleteMpCommonVersions implements Action {
  readonly type = MpCommonVersionActionTypes.DeleteMpCommonVersions;

  constructor(public payload: { ids: string[] }) {}
}

export class ClearMpCommonVersions implements Action {
  readonly type = MpCommonVersionActionTypes.ClearMpCommonVersions;
}

export type MpCommonVersionActions =
 LoadMpCommonVersions
 | AddMpCommonVersion
 | UpsertMpCommonVersion
 | AddMpCommonVersions
 | UpsertMpCommonVersions
 | UpdateMpCommonVersion
 | UpdateMpCommonVersions
 | DeleteMpCommonVersion
 | DeleteMpCommonVersions
 | ClearMpCommonVersions;
