import { Action } from '@ngrx/store';
import { NormalizedPayload } from '../../models/NormalizedPayload';


export enum SharedActionTypes {
  ApplicationStartup = '[Shared Actions] Application Startup',
  MapSetupComplete = '[Shared Actions] Map Setup Complete',
  MapSetupFailed = '[Shared Actions] Map Setup Failed',

  GetMapData = '[Shared Actions] Get Map Data',
  GetMapDataFailed = '[Shared Actions] Get Map Data Failed',
  LoadEntityGraph = '[Shared Actions] Load Entity Graph',

  SetAppReady = '[Shared Actions] Set App Ready',

  SetIsWrap = '[Shared Actions] Set isWrap',
  SetIsDistrQtyEnabled = '[Shared Actions] Set isDistrQtyEnabled',
  PopupGeoToggle = '[Shared Actions] Toggle Geo Through Map Popup'
}

export class PopupGeoToggle implements Action {
  readonly type = SharedActionTypes.PopupGeoToggle;
  constructor(public payload: { eventName: string }) { }
}

export class ApplicationStartup implements Action {
  readonly type = SharedActionTypes.ApplicationStartup;
  constructor(public payload: { groupId: number, mediaPlanId: number, radius: number, analysisLevel: string }) { }
}

export class MapSetupComplete implements Action {
  readonly type = SharedActionTypes.MapSetupComplete;
  constructor(public payload: { groupId: number, mediaPlanId: number }) {}
}

export class MapSetupFailed implements Action {
  readonly type = SharedActionTypes.MapSetupFailed;
  constructor(public payload: { err: any }) {}
}

export class GetMapData implements Action {
  readonly type = SharedActionTypes.GetMapData;
  constructor(public payload: { groupId: number, mediaPlanId: number }) {}
}

export class GetMapDataFailed implements Action {
  readonly type = SharedActionTypes.GetMapDataFailed;
  constructor(public payload: { err: any }) {}
}

export class LoadEntityGraph implements Action {
  readonly type = SharedActionTypes.LoadEntityGraph;
  constructor(public payload: { normalizedEntities: NormalizedPayload }) { }
}

export class SetAppReady implements Action {
  readonly type = SharedActionTypes.SetAppReady;
  constructor(public payload: boolean) { }
}

export class SetIsDistrQtyEnabled implements Action {
  readonly type = SharedActionTypes.SetIsDistrQtyEnabled;
  constructor(public payload: { isDistrQtyEnabled: boolean }) { }
}

export class SetIsWrap implements Action {
  readonly type = SharedActionTypes.SetIsWrap;
  constructor(public payload: { isWrap: boolean }) { }
}

export type SharedActions =
  ApplicationStartup
  | SetAppReady
  | LoadEntityGraph
  | SetIsWrap
  | SetIsDistrQtyEnabled
  | MapSetupComplete
  | MapSetupFailed
  | GetMapData
  | PopupGeoToggle
  ;

