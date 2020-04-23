import { Action } from '@ngrx/store';
import { getUuid } from '@val/common';

export enum TransientActionTypes {
  CacheGeos             = '[Transient] Cache Geos',
  CacheGeofootprintGeos = '[Transient] Cache Geofootprint Geos',
  CacheGeosComplete     = '[Transient] Cache Geos Complete',
  CacheGeosFailure      = '[Transient] Cache Geos Failed',
  RemoveGeoCache        = '[Transient] Remove Geo Cache',

  RehydrateAfterLoad    = '[Transient] Rehydrate after a load',
  GetAllMappedVariables = '[Transient] Retrieve all available map vars'
}

export class CacheGeos implements Action {
  readonly type = TransientActionTypes.CacheGeos;
  constructor(public payload: { geocodes: Set<string>, correlationId: string }) {}
}

export class CacheGeofootprintGeos implements Action {
  readonly type = TransientActionTypes.CacheGeofootprintGeos;
  constructor(public payload: { correlationId: string }) {}
}

export class CacheGeosComplete implements Action {
  readonly type = TransientActionTypes.CacheGeosComplete;
  constructor(public payload: { transactionId: number, correlationId: string }) {}
}

export class CacheGeosFailure implements Action {
  readonly type = TransientActionTypes.CacheGeosFailure;
  constructor(public payload: { err: any, correlationId: string }) {}
}

export class RemoveGeoCache implements Action {
  readonly type = TransientActionTypes.RemoveGeoCache;
  constructor(public payload: { transactionId: number }) {}
}

export class RehydrateAfterLoad implements Action {
  readonly type = TransientActionTypes.RehydrateAfterLoad;
  constructor(public payload: { projectId: number, geocodes: Set<string>, analysisLevel: string, isBatchMode?: boolean }) {}
}

export class GetAllMappedVariables {
  readonly type = TransientActionTypes.GetAllMappedVariables;
  constructor(public payload: { analysisLevel: string, correlationId?: string }) {
    if (payload != null && payload.correlationId == null) payload.correlationId = getUuid();
  }
}

export type TransientActions =
    CacheGeos
  | CacheGeofootprintGeos
  | CacheGeosComplete
  | CacheGeosFailure
  | RemoveGeoCache
  | RehydrateAfterLoad
  | GetAllMappedVariables;
