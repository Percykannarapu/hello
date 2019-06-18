import { Action } from '@ngrx/store';

export enum TransientActionTypes {
  CacheGeos             = '[Transient] Cache Geos',
  CacheGeofootprintGeos = '[Transient] Cache Geofootprint Geos',
  CacheGeosComplete     = '[Transient] Cache Geos Complete',
  CacheGeosFailure      = '[Transient] Cache Geos Failed',
  RemoveGeoCache        = '[Transient] Remove Geo Cache',
  ClearAudiencesAndVars = '[Transient] Clear Audiences, Geo and Map Vars'
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

export class ClearAudiencesAndVars implements Action {
  readonly type = TransientActionTypes.ClearAudiencesAndVars;
}

export type TransientActions =
    CacheGeos
  | CacheGeofootprintGeos
  | CacheGeosComplete
  | CacheGeosFailure
  | RemoveGeoCache
  | ClearAudiencesAndVars;
