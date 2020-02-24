import { Action } from '@ngrx/store';
import { BatchMapPayload, SinglePageBatchMapPayload } from '../app.interfaces';

export enum BatchMapActionTypes {
  CreateBatchMap = '[BatchMap] Create Batch Map',
  SetBatchMode = '[BatchMap] Set Batch Mode',
  MoveToSite = '[BatchMap] Move To Site',
  SiteMoved = '[BatchMap] Site Moved',
  SetMapReady = '[BatchMap] Set Map Ready',
  OpenBatchMapDialog = '[Batch Map] Open Batch Map Dialog',
  CloseBatchMapDialog = '[Batch Map] Close Batch Map Dialog',
  SetCurrentSiteNum = '[Batch Map] Set Current Site Number'
}

export class CreateBatchMap implements Action {
  readonly type = BatchMapActionTypes.CreateBatchMap;
  constructor(public payload: { templateFields: BatchMapPayload | SinglePageBatchMapPayload}) {}
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

export class OpenBatchMapDialog implements Action {
  readonly type = BatchMapActionTypes.OpenBatchMapDialog;
}

export class CloseBatchMapDialog implements Action {
  readonly type = BatchMapActionTypes.CloseBatchMapDialog;
}

export class SetCurrentSiteNum implements Action {
  readonly type = BatchMapActionTypes.SetCurrentSiteNum;
  constructor(public payload: { currentSiteNum: string }) {}
}

export type BatchMapActions = OpenBatchMapDialog | CloseBatchMapDialog | CreateBatchMap | SetBatchMode | MoveToSite | SiteMoved | SetMapReady | SetCurrentSiteNum;
