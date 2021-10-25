import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { UsageActionTypes, CreateUsageMetric, CreateGaugeMetric } from './usage.actions';
import { tap, withLatestFrom, filter } from 'rxjs/operators';
import { UsageService } from '../../services/usage.service';
import { ImpMetricName } from '../../val-modules/metrics/models/ImpMetricName';
import { AppDiscoveryService } from '../../services/app-discovery.service';
import { MetricService } from '../../val-modules/common/services/metric.service';
import { Store, select } from '@ngrx/store';
import { FullAppState } from '../app.interfaces';
import { getBatchMode } from '../batch-map/batch-map.selectors';

@Injectable({
  providedIn: 'root'
})
export class UsageEffects {

  @Effect({ dispatch: false })
  counterMetric$ = this.actions$.pipe(
    ofType<CreateUsageMetric>(UsageActionTypes.CreateUsageMetric),
    withLatestFrom(this.store$.pipe(select(getBatchMode))),
    filter(([action, batchMode]) => !batchMode),
    tap(([action, batchMode]) => this.createCounterFromAction(action))
  );

  @Effect({ dispatch: false })
  gaugeMetric$ = this.actions$.pipe(
    ofType<CreateGaugeMetric>(UsageActionTypes.CreateGaugeMetric),
    tap(action => this.createGaugeFromAction(action))
  );

  constructor(private actions$: Actions,
              private discoveryService: AppDiscoveryService,
              private metricService: MetricService,
              private usageService: UsageService,
              private store$: Store<FullAppState>) {}

  private createCounterFromAction(action: CreateUsageMetric) : void {
    const metric = new ImpMetricName({ namespace: action.payload.namespace, section: action.payload.section, target: action.payload.target, action: action.payload.action });
    this.usageService.createCounterMetric(metric, action.payload.metricText, action.payload.metricValue);
  }

  private createGaugeFromAction(action: CreateGaugeMetric) : void {
    const counterMetricsDiscover = this.discoveryService.discoveryUsageMetricsCreate(action.payload.gaugeAction);
    const counterMetricsColorBox = this.metricService.colorboxUsageMetricsCreate(action.payload.gaugeAction);
    this.usageService.createGaugeMetrics(counterMetricsDiscover);
    this.usageService.createGaugeMetrics(counterMetricsColorBox);
  }
}
