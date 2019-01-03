import { Action } from '@ngrx/store';

export enum UsageActionTypes {
  CreateUsageMetric = '[Usage] Create Counter Metric',
  CreateGaugeMetric = '[Usage] Create Gauge Metric'
}

export class CreateGaugeMetric implements Action {
  readonly type = UsageActionTypes.CreateGaugeMetric;
  constructor(public payload: { gaugeAction: string }) {}
}

export abstract class CreateUsageMetric implements Action {
  readonly type = UsageActionTypes.CreateUsageMetric;
  protected constructor(public payload: { namespace: string, section: string, target: string, action: string, metricText: string, metricValue: number }) {}
}
