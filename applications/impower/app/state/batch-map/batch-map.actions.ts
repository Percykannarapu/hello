import { Action } from '@ngrx/store';
import { BatchMapPayload, SinglePageBatchMapPayload, CurrentPageBatchMapPayload, NationalMapBatchMapPayload } from '../app.interfaces';

export enum BatchMapActionTypes {
  CreateBatchMap = '[BatchMap] Create Batch Map',
  SetBatchMode = '[BatchMap] Set Batch Mode',
  MoveToSite = '[BatchMap] Move To Site',
  SiteMoved = '[BatchMap] Site Moved',
  SetMapReady = '[BatchMap] Set Map Ready',
  SetCurrentSiteNum = '[Batch Map] Set Current Site Number',
  ForceMapUpdate= '[Batch Map] Force Batch Map update',
  ResetForceMapUpdate= '[Batch Map] Reset Force Batch Map update',
  MapViewUpdating= '[Batch Map] Set Mapview Updating'
}

export class CreateBatchMap implements Action {
  readonly type = BatchMapActionTypes.CreateBatchMap;
  constructor(public payload: { templateFields: BatchMapPayload | SinglePageBatchMapPayload | CurrentPageBatchMapPayload | NationalMapBatchMapPayload}) {}
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

export class SetCurrentSiteNum implements Action {
  readonly type = BatchMapActionTypes.SetCurrentSiteNum;
  constructor(public payload: { currentSiteNum: string }) {}
}

export class ForceMapUpdate  implements Action{
  readonly type = BatchMapActionTypes.ForceMapUpdate;
}

export class ResetForceMapUpdate implements Action{
  readonly type = BatchMapActionTypes.ResetForceMapUpdate;
}

export class MapViewUpdating implements Action {
  readonly type = BatchMapActionTypes.MapViewUpdating;
  constructor(public payload: { isUpdating: boolean }) {}
}

export type BatchMapActions = CreateBatchMap | SetBatchMode
            | MoveToSite | SiteMoved | SetMapReady | SetCurrentSiteNum
            | ForceMapUpdate| ResetForceMapUpdate | MapViewUpdating;
