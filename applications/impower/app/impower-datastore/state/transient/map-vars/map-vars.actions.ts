import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { MapVar } from './map-vars.model';

export enum MapVarActionTypes {
  LoadMapVars                 = '[MapVar] Load MapVars',
  AddMapVar                   = '[MapVar] Add MapVar',
  UpsertMapVar                = '[MapVar] Upsert MapVar',
  AddMapVars                  = '[MapVar] Add MapVars',
  UpsertMapVars               = '[MapVar] Upsert MapVars',
  UpdateMapVar                = '[MapVar] Update MapVar',
  UpdateMapVars               = '[MapVar] Update MapVars',
  DeleteMapVar                = '[MapVar] Delete MapVar',
  DeleteMapVars               = '[MapVar] Delete MapVars',
  ClearMapVars                = '[MapVar] Clear MapVars',
  MapVarCacheGeos             = '[MapVar] Cache Geos',
  MapVarCacheGeofootprintGeos = '[MapVar] Cache Geofootprint Geos',
  MapVarCacheGeosComplete     = '[MapVar] Cache Geos Complete',
  MapVarCacheGeosFailure      = '[MapVar] Cache Geos Failed',
}

export class LoadMapVars implements Action {
  readonly type = MapVarActionTypes.LoadMapVars;

  constructor(public payload: { mapVars: MapVar[] }) {}
}

export class AddMapVar implements Action {
  readonly type = MapVarActionTypes.AddMapVar;

  constructor(public payload: { mapVar: MapVar }) {}
}

export class UpsertMapVar implements Action {
  readonly type = MapVarActionTypes.UpsertMapVar;

  constructor(public payload: { mapVar: MapVar }) {}
}

export class AddMapVars implements Action {
  readonly type = MapVarActionTypes.AddMapVars;

  constructor(public payload: { mapVars: MapVar[] }) {}
}

export class UpsertMapVars implements Action {
  readonly type = MapVarActionTypes.UpsertMapVars;

  constructor(public payload: { mapVars: MapVar[] }) {}
}

export class UpdateMapVar implements Action {
  readonly type = MapVarActionTypes.UpdateMapVar;

  constructor(public payload: { mapVar: Update<MapVar> }) {}
}

export class UpdateMapVars implements Action {
  readonly type = MapVarActionTypes.UpdateMapVars;

  constructor(public payload: { mapVars: Update<MapVar>[] }) {}
}

export class DeleteMapVar implements Action {
  readonly type = MapVarActionTypes.DeleteMapVar;

  constructor(public payload: { id: string }) {}
}

export class DeleteMapVars implements Action {
  readonly type = MapVarActionTypes.DeleteMapVars;

  constructor(public payload: { ids: string[] }) {}
}

export class ClearMapVars implements Action {
  readonly type = MapVarActionTypes.ClearMapVars;
}

export class MapVarCacheGeos implements Action {
  readonly type = MapVarActionTypes.MapVarCacheGeos;
  constructor(public payload: { geocodes: Set<string> }) {}
}

export class MapVarCacheGeofootprintGeos implements Action {
  readonly type = MapVarActionTypes.MapVarCacheGeofootprintGeos;
}

export class MapVarCacheGeosComplete implements Action {
  readonly type = MapVarActionTypes.MapVarCacheGeosComplete;
  constructor(public payload: { transactionId: number, correlationId: string }) {}
}

export class MapVarCacheGeosFailure implements Action {
  readonly type = MapVarActionTypes.MapVarCacheGeosFailure;
  constructor(public payload: { err: any, correlationId: string }) {}
}

export type MapVarActions =
   LoadMapVars
 | AddMapVar
 | UpsertMapVar
 | AddMapVars
 | UpsertMapVars
 | UpdateMapVar
 | UpdateMapVars
 | DeleteMapVar
 | DeleteMapVars
 | ClearMapVars
 | MapVarCacheGeos
 | MapVarCacheGeofootprintGeos
 | MapVarCacheGeosComplete
 | MapVarCacheGeosFailure;
