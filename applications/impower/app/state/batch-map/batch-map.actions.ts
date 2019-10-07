import { Action } from '@ngrx/store';

export enum BatchMapActionTypes {
  CreateBatchMap = '[BatchMap] Create Batch Map',
  SetBatchMode = '[BatchMap] Set Batch Mode',
  MoveToSite = '[BatchMap] Move To Site',
  SiteMoved = '[BatchMap] Site Moved',
  SetMapReady = '[BatchMap] Set Map Ready'
}

export class CreateBatchMap implements Action {
  readonly type = BatchMapActionTypes.CreateBatchMap;
  constructor(public payload: { email: string }) {}
}

export class SetBatchMode implements Action {
    readonly type = BatchMapActionTypes.SetBatchMode;
}

export class MoveToSite implements Action {
  readonly type = BatchMapActionTypes.MoveToSite;
  constructor(public payload: { siteNum: string }) {}
}

export class SiteMoved implements Action {
    readonly type = BatchMapActionTypes.SiteMoved;
    constructor(public payload: { siteNum: string, isLastSite: boolean }) {}
}

export class SetMapReady implements Action {
    readonly type = BatchMapActionTypes.SetMapReady;
    constructor(public payload: { mapReady: boolean }) {}
}

export type BatchMapActions = CreateBatchMap | SetBatchMode | MoveToSite | SiteMoved | SetMapReady;
