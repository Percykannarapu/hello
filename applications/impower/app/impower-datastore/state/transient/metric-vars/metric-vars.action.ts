import { Action, createAction, props } from '@ngrx/store';
import { Audience } from '../audience/audience.model';
import { DynamicVariable } from '../dynamic-variable.model';


export const FetchMetricVars = createAction(
  '[MetricVar/API] Fetch MetricVars',
  props<{ audiences: Audience[] }>()
);

export const ClearMetricVars = createAction(
  '[MetricVar/API] Clear MetricVars'
);

export const FetchMetricVarsComplete = createAction(
  '[MetricVar/API] Fetch MetricVars Complete',
  props<{metricVars: DynamicVariable[]}>()
);

export const FetchMetricVarsFailed = createAction(
  '[MetricVar/API] Fetch MetricVars Failed',
  props<{ err: any}>()
);