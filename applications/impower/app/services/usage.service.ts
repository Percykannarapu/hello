import { Injectable } from '@angular/core';
import { toNullOrNumber } from '@val/common';
import { Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { RestResponse } from '../../worker-shared/data-model/core.interfaces';
import { AppConfig } from '../app.config';
import { LoggingService } from '../val-modules/common/services/logging.service';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { ImpMetricCounter } from '../val-modules/metrics/models/ImpMetricCounter';
import { ImpMetricGauge } from '../val-modules/metrics/models/ImpMetricGauge';
import { ImpMetricName } from '../val-modules/metrics/models/ImpMetricName';
import { ImpMetricNameService } from '../val-modules/metrics/services/ImpMetricName.service';
import { AppStateService } from './app-state.service';
import { UserService } from './user.service';

export class Metrics{
  constructor(
    public usageMetricName: ImpMetricName, public metricText: string, public metricValue: number
  ){}
}

@Injectable({ providedIn: 'root' })
export class UsageService {

  // A counter to avoid infinite recursion on fetch operations from Fuse
  private fetchRetries: number = 0;

  constructor(private userService: UserService,
              private restClient: RestDataService,
              private impMetricNameService: ImpMetricNameService,
              private appConfig: AppConfig,
              private stateService: AppStateService,
              private logger: LoggingService) {}

    public createCounterMetrics(counterMetrics: Metrics[]) {
      counterMetrics.forEach(counterMetric => {
            counterMetric.metricValue = toNullOrNumber(counterMetric.metricValue) ?? 0;
            this.createCounterMetric(counterMetric.usageMetricName, counterMetric.metricText, counterMetric.metricValue);
      });
    }

    public createGaugeMetrics(counterMetrics: Metrics[]) {
      counterMetrics.forEach(counterMetric => {
            counterMetric.metricValue = toNullOrNumber(counterMetric.metricValue) ?? 0;
            this.createGaugeMetric(counterMetric.usageMetricName, counterMetric.metricText, counterMetric.metricValue);
      });
    }

  /**
   * Create a new usage metric for an even that happened in the imPower application
   * @param metricName The object of type UsageMetricName containing the namespace, section, target, and action
   * @param metricText The data that will be saved with this counter
   * @param metricValue The number of times a particular event has occurred for this metric
   */
  public createCounterMetric(metricName: ImpMetricName, metricText: string, metricValue: number) {
    //we don't want to capture metrics if working locally
    if (this.appConfig.environmentName === 'LOCAL') {
      return;
    }
    if (metricName.namespace == null || metricName.section == null || metricName.target == null || metricName.action == null) {
      this.logger.warn.log('not enough information provided to create a usage metric: ', metricName, metricText, metricValue);
      return;
    }

    //If the data store is empty load it up from Fuse and then call this function again
    if (this.impMetricNameService.get().length === 0 && this.fetchRetries < 3) {
      this.impMetricNameService.get(true).subscribe(() => {
        this.fetchRetries++;
        this.createCounterMetric(metricName, metricText, metricValue);
      }, () => {
        this.logger.warn.log('Error saving usage metric: ', metricName, metricText, metricValue);
      });
      return;
    }

    //If there is no OAuth token available yet wait a few seconds and try again
    const user = this.userService.getUser();
    if (user?.token == null) {
      setTimeout(() => { this.createCounterMetric(metricName, metricText, metricValue); }, 2000);
    } else {
      const impMetricName = this.impMetricNameService.get().filter(item => item.namespace === metricName.namespace && item.section === metricName.section && item.target === metricName.target && item.action === metricName.action);
      if (impMetricName.length === 0) {
        this.createMetricName(metricName, 'COUNTER').pipe(
          map(res => res.payload),
          mergeMap(res => this._createCounterMetric(Number(res), metricText, metricValue))
        ).subscribe(() => {
          // do nothing with the response for now
        }, () => {
          this.logger.warn.log('Error saving usage metric: ', metricName, metricText, metricValue);
        });
      } else {
        this._createCounterMetric(impMetricName[0].metricId, metricText, metricValue)
            .subscribe(() => {
              // do nothing with the response for now
            }, () => {
              this.logger.warn.log('Error saving usage metric: ', metricName, metricText, metricValue);
            });
      }
    }
  }

  /**
   * Create a new usage metric for an even that happened in the imPower application
   * @param metricName The object of type UsageMetricName containing the namepsace, section, target, and action
   * @param metricText The data that will be saved with this counter
   * @param metricValue The number of times a particular event has occurred for this metric
   */
  public createGaugeMetric(metricName: ImpMetricName, metricText: string, metricValue: number) {
    //we don't want to capture metrics if working locally
    if (this.appConfig.environmentName === 'LOCAL') {
      return;
    }
    if (metricName.namespace == null || metricName.section == null || metricName.target == null || metricName.action == null) {
      this.logger.warn.log('not enough information provided to create a usage metric: ', metricName, metricText, metricValue);
      return;
    }

    //If the data store is empty load it up from Fuse and then call this function again
    if (this.impMetricNameService.get().length === 0 && this.fetchRetries < 3) {
      this.impMetricNameService.get(true).subscribe(() => {
        this.fetchRetries++;
        this.createGaugeMetric(metricName, metricText, metricValue);
      }, () => {
        this.logger.warn.log('Error saving usage metric: ', metricName, metricText, metricValue);
      });
      return;
    }

    //If there is no OAuth token available yet wait a few seconds and try again
    const user = this.userService.getUser();
    if (user?.token == null) {
      setTimeout(() => { this.createGaugeMetric(metricName, metricText, metricValue); }, 2000);
    } else {
      const impMetricName = this.impMetricNameService.get().filter(item => item.namespace === metricName.namespace && item.section === metricName.section && item.target === metricName.target && item.action === metricName.action);
      if (impMetricName.length === 0) {
        this.createMetricName(metricName, 'COUNTER').pipe(
          map(res => res.payload),
          mergeMap(res => this._createGaugeMetric(Number(res), metricText, metricValue))
        ).subscribe(() => {
          // do nothing with the response for now
        }, () => {
          this.logger.warn.log('Error saving usage metric: ', metricName, metricText, metricValue);
        });
      } else {
        this._createGaugeMetric(impMetricName[0].metricId, metricText, metricValue)
            .subscribe(() => {
              // do nothing with the response for now
            }, () => {
              this.logger.warn.log('Error saving usage metric: ', metricName, metricText, metricValue);
            });
      }
    }
  }

  /**
   * Create a new ImpMetricName and persist it in the database using the Fuse service
   * @param metricName The object of type UsageMetricName containing the namepsace, section, target, and action
   * @param metricTypeCode The type of ImpMetricName to create; COUNTER, TIMER, HISTOGRAM
   */
  private createMetricName(metricName: ImpMetricName, metricTypeCode: string) : Observable<RestResponse<number>> {
    const impMetricName: ImpMetricName = new ImpMetricName();
    const now = new Date(Date.now());
    impMetricName['dirty'] = true;
    impMetricName['baseStatus'] = 'INSERT';
    impMetricName.action = metricName.action;
    impMetricName.createDate = now;
    impMetricName.createUser = this.userService.getUser().userId;
    impMetricName.isActive = 1;
    impMetricName.metricTypeCode = metricTypeCode;
    impMetricName.modifyDate = now;
    impMetricName.modifyUser = this.userService.getUser().userId;
    impMetricName.namespace = metricName.namespace;
    impMetricName.section = metricName.section;
    impMetricName.target = metricName.target;

    // send the new metric name to Fuse for persistence
    return this.restClient.post<number>('v1/metrics/base/impmetricname/save', JSON.stringify(impMetricName));
  }

  /**
   * Create a new usage record in the IMP_METRIC_COUNTERS table using the Fuse service
   * @param metricName The ImpMetricName record that will be the parent record of this counter, see UsageTypes class
   * @param metricText The data that will be saved with this counter
   * @param metricValue The number that will be saved on this counter
   */
  private _createCounterMetric(metricName: number, metricText: string, metricValue: number) : Observable<RestResponse<any>> {
    const currentProject = this.stateService.currentProject$.getValue();
    const impProjectId = currentProject != null ? currentProject.projectId : null;

    // Create the new counter to be persisted
    const impMetricCounter: ImpMetricCounter = new ImpMetricCounter();
    impMetricCounter['dirty'] = true;
    impMetricCounter['baseStatus'] = 'INSERT';
    impMetricCounter.metricId = metricName;
    impMetricCounter.createDate = new Date(Date.now());
    impMetricCounter.createUser = this.userService.getUser().userId;
    impMetricCounter.metricText = metricText;
    impMetricCounter.metricValue = metricValue;
    impMetricCounter.modifyDate = new Date(Date.now());
    impMetricCounter.modifyUser = this.userService.getUser().userId;
    impMetricCounter.origSystemRefId = impProjectId != null ? impProjectId.toString() : null;
    impMetricCounter.projectTrackerId = currentProject != null ? currentProject.projectTrackerId : null;

    // Send the counter data to Fuse for persistence
    return this.restClient.post('v1/metrics/base/impmetriccounter/save', JSON.stringify(impMetricCounter));

  }

  /**
   * Create a new usage record in the imp_metric_gauges table using the Fuse service
   * @param metricName The ImpMetricName record that will be the parent record of this counter, see UsageTypes class
   * @param metricText The data that will be saved with this counter
   * @param metricValue The number that will be saved on this counter
   */
  private _createGaugeMetric(metricName: number, metricText: string, metricValue: number) : Observable<RestResponse<any>> {
    const impProjectId = this.stateService.projectId$.getValue();

    // Create the new counter to be persisted
    const impMetricGauge: ImpMetricGauge = new ImpMetricGauge();
    impMetricGauge['dirty'] = true;
    impMetricGauge['baseStatus'] = 'INSERT';
    impMetricGauge.metricId = metricName;
    impMetricGauge.createDate = new Date(Date.now());
    impMetricGauge.createUser = this.userService.getUser().userId;
    impMetricGauge.metricText = metricText;
    impMetricGauge.metricValue = metricValue;
    impMetricGauge.modifyDate = new Date(Date.now());
    impMetricGauge.modifyUser = this.userService.getUser().userId;
    impMetricGauge.origSystemRefId = impProjectId != null ? impProjectId.toString() : null;
    impMetricGauge.isActive = 1;
    impMetricGauge.projectTrackerId = this.stateService.currentProject$.getValue().projectTrackerId;

    // Send the counter data to Fuse for persistence
    return this.restClient.post('v1/metrics/base/impmetricgauge/save', JSON.stringify(impMetricGauge));
  }

}
