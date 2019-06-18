import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { GeoVar } from './geo-vars.model';

export enum GeoVarActionTypes {
  LoadGeoVars                 = '[GeoVar] Load GeoVars',
  AddGeoVar                   = '[GeoVar] Add GeoVar',
  UpsertGeoVar                = '[GeoVar] Upsert GeoVar',
  AddGeoVars                  = '[GeoVar] Add GeoVars',
  UpsertGeoVars               = '[GeoVar] Upsert GeoVars',
  UpdateGeoVar                = '[GeoVar] Update GeoVar',
  UpdateGeoVars               = '[GeoVar] Update GeoVars',
  DeleteGeoVar                = '[GeoVar] Delete GeoVar',
  DeleteGeoVars               = '[GeoVar] Delete GeoVars',
  ClearGeoVars                = '[GeoVar] Clear GeoVars',
  RemoveVar                   = '[GeoVar] Remove Var',
  RemoveVars                  = '[GeoVar] Remove Vars',
  GeoVarCacheGeos             = '[GeoVar] Cache Geos',
  GeoVarCacheGeofootprintGeos = '[GeoVar] Cache Geofootprint Geos',
  GeoVarCacheGeosComplete     = '[GeoVar] Cache Geos Complete',
  GeoVarCacheGeosFailure      = '[GeoVar] Cache Geos Failed',
}

export class LoadGeoVars implements Action {
  readonly type = GeoVarActionTypes.LoadGeoVars;
  constructor(public payload: { geoVars: GeoVar[] }) {}
}

export class AddGeoVar implements Action {
  readonly type = GeoVarActionTypes.AddGeoVar;
  constructor(public payload: { geoVar: GeoVar }) {}
}

export class UpsertGeoVar implements Action {
  readonly type = GeoVarActionTypes.UpsertGeoVar;
  constructor(public payload: { geoVar: GeoVar }) {}
}

export class AddGeoVars implements Action {
  readonly type = GeoVarActionTypes.AddGeoVars;
  constructor(public payload: { geoVars: GeoVar[] }) {}
}

export class UpsertGeoVars implements Action {
  readonly type = GeoVarActionTypes.UpsertGeoVars;
  constructor(public payload: { geoVars: GeoVar[] }) {}
}

export class UpdateGeoVar implements Action {
  readonly type = GeoVarActionTypes.UpdateGeoVar;
  constructor(public payload: { geoVar: Update<GeoVar> }) {}
}

export class UpdateGeoVars implements Action {
  readonly type = GeoVarActionTypes.UpdateGeoVars;
  constructor(public payload: { geoVars: Update<GeoVar>[] }) {}
}

export class DeleteGeoVar implements Action {
  readonly type = GeoVarActionTypes.DeleteGeoVar;
  constructor(public payload: { id: string }) {}
}

export class DeleteGeoVars implements Action {
  readonly type = GeoVarActionTypes.DeleteGeoVars;
  constructor(public payload: { ids: string[] }) {}
}

export class ClearGeoVars implements Action {
  readonly type = GeoVarActionTypes.ClearGeoVars;
}

export class RemoveVar implements Action {
  readonly type = GeoVarActionTypes.RemoveVar;
  constructor(public payload: { varPk: string }) {}
}

export class RemoveVars implements Action {
  readonly type = GeoVarActionTypes.RemoveVar;
  constructor(public payload: { varPks: string[] }) {}
}

export class GeoVarCacheGeos implements Action {
  readonly type = GeoVarActionTypes.GeoVarCacheGeos;
  constructor(public payload: { geocodes: Set<string> }) {}
}

export class GeoVarCacheGeofootprintGeos implements Action {
  readonly type = GeoVarActionTypes.GeoVarCacheGeofootprintGeos;
}

export class GeoVarCacheGeosComplete implements Action {
  readonly type = GeoVarActionTypes.GeoVarCacheGeosComplete;
  constructor(public payload: { transactionId: number, correlationId: string  }) {}
}

export class GeoVarCacheGeosFailure implements Action {
  readonly type = GeoVarActionTypes.GeoVarCacheGeosFailure;
  constructor(public payload: { err: any, correlationId: string  }) {}
}

export type GeoVarActions =
    LoadGeoVars
  | AddGeoVar
  | UpsertGeoVar
  | AddGeoVars
  | UpsertGeoVars
  | UpdateGeoVar
  | UpdateGeoVars
  | DeleteGeoVar
  | DeleteGeoVars
  | ClearGeoVars
  | RemoveVar
  | RemoveVars
  | GeoVarCacheGeos
  | GeoVarCacheGeofootprintGeos
  | GeoVarCacheGeosComplete
  | GeoVarCacheGeosFailure;
