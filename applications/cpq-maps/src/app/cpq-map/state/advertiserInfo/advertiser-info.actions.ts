import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { AdvertiserInfo } from '../../../val-modules/mediaexpress/models/AdvertiserInfo';

export enum AdvertiserInfoActionTypes {
  LoadAdvertiserInfos = '[AdvertiserInfo] Load AdvertiserInfos',
  AddAdvertiserInfo = '[AdvertiserInfo] Add AdvertiserInfo',
  UpsertAdvertiserInfo = '[AdvertiserInfo] Upsert AdvertiserInfo',
  AddAdvertiserInfos = '[AdvertiserInfo] Add AdvertiserInfos',
  UpsertAdvertiserInfos = '[AdvertiserInfo] Upsert AdvertiserInfos',
  UpdateAdvertiserInfo = '[AdvertiserInfo] Update AdvertiserInfo',
  UpdateAdvertiserInfos = '[AdvertiserInfo] Update AdvertiserInfos',
  DeleteAdvertiserInfo = '[AdvertiserInfo] Delete AdvertiserInfo',
  DeleteAdvertiserInfos = '[AdvertiserInfo] Delete AdvertiserInfos',
  ClearAdvertiserInfos = '[AdvertiserInfo] Clear AdvertiserInfos'
}

export class LoadAdvertiserInfos implements Action {
  readonly type = AdvertiserInfoActionTypes.LoadAdvertiserInfos;

  constructor(public payload: { advertiserInfos: AdvertiserInfo[] }) {}
}

export class AddAdvertiserInfo implements Action {
  readonly type = AdvertiserInfoActionTypes.AddAdvertiserInfo;

  constructor(public payload: { advertiserInfo: AdvertiserInfo }) {}
}

export class UpsertAdvertiserInfo implements Action {
  readonly type = AdvertiserInfoActionTypes.UpsertAdvertiserInfo;

  constructor(public payload: { advertiserInfo: AdvertiserInfo }) {}
}

export class AddAdvertiserInfos implements Action {
  readonly type = AdvertiserInfoActionTypes.AddAdvertiserInfos;

  constructor(public payload: { advertiserInfos: AdvertiserInfo[] }) {}
}

export class UpsertAdvertiserInfos implements Action {
  readonly type = AdvertiserInfoActionTypes.UpsertAdvertiserInfos;

  constructor(public payload: { advertiserInfos: AdvertiserInfo[] }) {}
}

export class UpdateAdvertiserInfo implements Action {
  readonly type = AdvertiserInfoActionTypes.UpdateAdvertiserInfo;

  constructor(public payload: { advertiserInfo: Update<AdvertiserInfo> }) {}
}

export class UpdateAdvertiserInfos implements Action {
  readonly type = AdvertiserInfoActionTypes.UpdateAdvertiserInfos;

  constructor(public payload: { advertiserInfos: Update<AdvertiserInfo>[] }) {}
}

export class DeleteAdvertiserInfo implements Action {
  readonly type = AdvertiserInfoActionTypes.DeleteAdvertiserInfo;

  constructor(public payload: { id: string }) {}
}

export class DeleteAdvertiserInfos implements Action {
  readonly type = AdvertiserInfoActionTypes.DeleteAdvertiserInfos;

  constructor(public payload: { ids: string[] }) {}
}

export class ClearAdvertiserInfos implements Action {
  readonly type = AdvertiserInfoActionTypes.ClearAdvertiserInfos;
}

export type AdvertiserInfoActions =
 LoadAdvertiserInfos
 | AddAdvertiserInfo
 | UpsertAdvertiserInfo
 | AddAdvertiserInfos
 | UpsertAdvertiserInfos
 | UpdateAdvertiserInfo
 | UpdateAdvertiserInfos
 | DeleteAdvertiserInfo
 | DeleteAdvertiserInfos
 | ClearAdvertiserInfos;
