import { Action } from '@ngrx/store';
import { Audience } from '../audience/audience.model';
import { DynamicVariable } from '../dynamic-variable.model';

export enum MapVarActionTypes {
  ClearMapVars                = '[MapVar] Clear MapVars',
  FetchMapVars                = '[MapVar] Fetch MapVars',
  FetchMapVarsComplete        = '[MapVar] Fetch MapVars Complete',
  FetchMapVarsFailed          = '[MapVar] Fetch MapVars Failed',
}

export class ClearMapVars implements Action {
  readonly type = MapVarActionTypes.ClearMapVars;
}

export class FetchMapVars implements Action {
  readonly type = MapVarActionTypes.FetchMapVars;
  constructor(public payload: { audiences: Audience[], txId: number }) {}
}

export class FetchMapVarsComplete implements Action {
  readonly type = MapVarActionTypes.FetchMapVarsComplete;
  constructor(public payload: { mapVars: DynamicVariable[] }) {}
}

export class FetchMapVarsFailed implements Action {
  readonly type = MapVarActionTypes.FetchMapVarsFailed;
  constructor(public payload: { err: any }) {}
}

export type MapVarActions =
  ClearMapVars
  | FetchMapVars
  | FetchMapVarsComplete
  | FetchMapVarsFailed
  ;
