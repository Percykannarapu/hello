import { Action } from '@ngrx/store';
import { Audience } from '../audience/audience.model';
import { DynamicVariable } from '../dynamic-variable.model';

export enum MetricVarActionTypes {
  ClearMetricVars                = '[MetricVar] Clear MetricVars',
  FetchMetricVars                = '[MetricVar] Fetch MetricVars',
  FetchMetricVarsComplete        = '[MetricVar] Fetch MetricVars Complete',
  FetchMetricVarsFailed          = '[MetricVar] Fetch MetricVars Failed',
}


export class ClearMetricVars implements Action {
  readonly type = MetricVarActionTypes.ClearMetricVars;
}

export class FetchMetricVars implements Action {
  readonly type = MetricVarActionTypes.FetchMetricVars;
  constructor(public payload: { audiences: Audience[]}) {}
}

export class FetchMetricVarsComplete implements Action {
  readonly type = MetricVarActionTypes.FetchMetricVarsComplete;
  constructor(public payload: { metricVars: DynamicVariable[] }) {}
}

export class FetchMetricVarsFailed implements Action {
  readonly type = MetricVarActionTypes.FetchMetricVarsFailed;
  constructor(public payload: { err: any }) {}
}



export type MetricVarActions =
ClearMetricVars
  | FetchMetricVars
  | FetchMetricVarsComplete
  | FetchMetricVarsFailed
  ;