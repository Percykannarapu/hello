import { Action } from '@ngrx/store';
import { AvailabilityDetailResponse } from '../../models/availability-detail-response';
import { NormalizedPayload } from '../../models/NormalizedPayload';
import { shadingType } from './shared.reducers';
import { ResultType } from '../app.interfaces';


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
  SaveMediaPlan = '[Shared Actions] Save Media Plan',
  SaveSucceeded = '[Shared Actions] Save Succeeded',
  SaveFailed = '[Shared Actions] Save Failed',
  ExportMaps = '[Shared Actions] Export Maps',
  GenerateMapFailed = '[Shared Actions] Generate Map Failed',
  GenerateMapSuccess = '[Shared ACtions] Generate Map Success',
  DownloadMapBook = '[Shared Actions] Download Map Book',

  NavigateToReviewPage = '[Shared Actions] Navigate to Review Page',
  SetShadingType = '[Shared Actions] Set Shading Type',
  SetShadingData = '[Shared Actions] Set Shading Data',
  SetLegendHTML = '[Shared Actions] Set Legend HTML'
}

export class SetLegendHTML implements Action {
  readonly type = SharedActionTypes.SetLegendHTML;
  constructor() { }
}

export class SetShadingData implements Action {
  readonly type = SharedActionTypes.SetShadingData;
  constructor(public payload: { shadingData: Array<{key: string | Number, value: number[]}> }) { }
}

export class SetShadingType implements Action {
  readonly type = SharedActionTypes.SetShadingType;
  constructor(public payload: { shadingType: shadingType }) { }
}

export class ApplicationStartup implements Action {
  readonly type = SharedActionTypes.ApplicationStartup;
  constructor(public payload: { groupId: number, mediaPlanId: number, radius: number, analysisLevel: string, threshold: string, promoDateFrom: Date, promoDateTo: Date }) { }
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

export class SaveMediaPlan implements Action {
    readonly type = SharedActionTypes.SaveMediaPlan;
    constructor(public payload: { updateIds: number[], addIds: number[] }) {}
}

export class SaveSucceeded implements Action {
    readonly type = SharedActionTypes.SaveSucceeded;
}

export class SaveFailed implements Action {
    readonly type = SharedActionTypes.SaveFailed;
    constructor(public payload: { err: any }) {}
}

export class NavigateToReviewPage implements Action {
    readonly type = SharedActionTypes.NavigateToReviewPage;
    constructor(public payload: { rfpId: string, mediaPlanGroupNumber: number }) {}
}

export class ExportMaps implements Action {
  readonly type = SharedActionTypes.ExportMaps;
}

export class GenerateMapFailed implements Action {
  readonly type = SharedActionTypes.GenerateMapFailed;
  constructor(public payload: { err: any }) {}
}


export class GenerateMapSuccess implements Action {
  readonly type = SharedActionTypes.GenerateMapSuccess;
  constructor(public payload: { response: ResultType }) {}
}

export class DownloadMapBook implements Action {
  readonly type = SharedActionTypes.DownloadMapBook;
  constructor(public payload: { response: ResultType }){}
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
  | GetMapDataFailed
  | SaveMediaPlan
  | SaveSucceeded
  | SaveFailed
  | NavigateToReviewPage
  | SetShadingType
  | SetShadingData
  | SetLegendHTML
  | ExportMaps
  | GenerateMapFailed
  | GenerateMapSuccess
  | DownloadMapBook
  ;

