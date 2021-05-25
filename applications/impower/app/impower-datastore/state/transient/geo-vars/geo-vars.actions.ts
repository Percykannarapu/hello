import { Action } from '@ngrx/store';
import { Audience } from '../audience/audience.model';
import { DynamicVariable } from '../dynamic-variable.model';

export enum GeoVarActionTypes {
  ClearGeoVars                = '[GeoVar] Clear GeoVars',
  FetchGeoVars                = '[GeoVar] Fetch GeoVars',
  FetchGeoVarsComplete        = '[GeoVar] Fetch GeoVars Complete',
  FetchGeoVarsFailed          = '[GeoVar] Fetch GeoVars Failed',
}

export class ClearGeoVars implements Action {
  readonly type = GeoVarActionTypes.ClearGeoVars;
}

export class FetchGeoVars implements Action {
    readonly type = GeoVarActionTypes.FetchGeoVars;
    constructor(public payload: { audiences: Audience[], txId: number }) {}
}

export class FetchGeoVarsComplete implements Action {
    readonly type = GeoVarActionTypes.FetchGeoVarsComplete;
    constructor(public payload: { geoVars: DynamicVariable[] }) {}
}

export class FetchGeoVarsFailed implements Action {
  readonly type = GeoVarActionTypes.FetchGeoVarsFailed;
  constructor(public payload: { err: any }) {}
}

export type GeoVarActions =
    ClearGeoVars
  | FetchGeoVars
  | FetchGeoVarsComplete
  | FetchGeoVarsFailed
;
