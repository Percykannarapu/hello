import { Action } from '@ngrx/store';
import { NormalizedPayload } from '../../models/NormalizedPayload';

export enum InitActionTypes {
  ApplicationStartup = '[Shared Actions] Application Startup',
  MapSetupSucceeded = '[Shared Actions] Map Setup Succeeded',
  MapSetupFailed = '[Shared Actions] Map Setup Failed',

  GetMediaPlanData = '[Shared Actions] Get Media Plan Data',
  GetMediaPlanDataFailed = '[Shared Actions] Get Map Data Failed',
  GetMediaPlanDataSucceeded = '[Shared Actions] Get Map Data Succeeded',
}

export class ApplicationStartup implements Action {
  readonly type = InitActionTypes.ApplicationStartup;
  constructor(public payload: { groupId: number, mediaPlanId: number, radius: number, analysisLevel: string, threshold: string, promoDateFrom: Date, promoDateTo: Date }) { }
}

export class MapSetupSucceeded implements Action {
  readonly type = InitActionTypes.MapSetupSucceeded;
  constructor(public payload: { groupId: number, mediaPlanId: number }) {}
}

export class MapSetupFailed implements Action {
  readonly type = InitActionTypes.MapSetupFailed;
  constructor(public payload: { err: any }) {}
}

export class GetMediaPlanData implements Action {
  readonly type = InitActionTypes.GetMediaPlanData;
  constructor(public payload: { groupId: number, mediaPlanId: number }) {}
}

export class GetMediaPlanDataSucceeded implements Action {
  readonly type = InitActionTypes.GetMediaPlanDataSucceeded;
  constructor(public payload: { normalizedEntities: NormalizedPayload }) { }
}

export class GetMediaPlanDataFailed implements Action {
  readonly type = InitActionTypes.GetMediaPlanDataFailed;
  constructor(public payload: { err: any }) {}
}

export type InitActions =
  ApplicationStartup
  | MapSetupSucceeded
  | MapSetupFailed
  | GetMediaPlanData
  | GetMediaPlanDataSucceeded
  | GetMediaPlanDataFailed;
