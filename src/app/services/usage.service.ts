import { Injectable } from '@angular/core';
import { ImpMetricName } from '../val-modules/metrics/models/ImpMetricName';
import { ImpMetricType } from '../val-modules/metrics/models/ImpMetricType';
import { ImpMetricCounter } from '../val-modules/metrics/models/ImpMetricCounter';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { ImpMetricNameService } from '../val-modules/metrics/services/ImpMetricName.service';
import { RestResponse } from '../models/RestResponse';
import { UserService } from './user.service';
import { DataStore } from '../val-modules/common/services/datastore.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import { HttpHeaders } from '@angular/common/http';
import { ImpProjectService } from '../val-modules/targeting/services/ImpProject.service';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';


@Injectable()
export class UsageService {

  // A counter to avoid infinite recursion on fetch operations from Fuse
  private fetchRetries: number = 0;

  constructor(private userService: UserService,
    private restClient: RestDataService,
    private impMetricNameService: ImpMetricNameService,
    private impProjectService: ImpProjectService) {
     }

  /**
   * Create a new usage metric for an even that happened in the imPower application
   * @param metricName The object of type UsageMetricName containing the namepsace, section, target, and action
   * @param metricText The data that will be saved with this counter
   * @param metricValue The number of times a particular event has occurred for this metric
   */
  public createCounterMetric(metricName: ImpMetricName, metricText: string, metricValue: number, projectId?: string) {
    if (metricName.namespace == null || metricName.section == null || metricName.target == null || metricName.action == null) {
      console.warn('not enough information provided to create a usage metric: ', metricName, metricText, metricValue);
      return;
    }

    //If the data store is empty load it up from Fuse and then call this function again
    if (this.impMetricNameService.get().length === 0 && this.fetchRetries < 3) {
      this.impMetricNameService.get(true).subscribe(res => {
        this.fetchRetries++;
        this.createCounterMetric(metricName, metricText, metricValue);
      }, err => {
        console.warn('Error saving usage metric: ', metricName, metricText, metricValue);
      });
      return;
    }

    //If there is no OAuth token available yet wait a few seconds and try again
    if (DataStore.getConfig().oauthToken == null) {
      setTimeout(() => { this.createCounterMetric(metricName, metricText, metricValue); }, 2000);
    }

    const impMetricName = this.impMetricNameService.get().filter(item => item.namespace === metricName.namespace && item.section === metricName.section && item.target === metricName.target && item.action === metricName.action);
    if (impMetricName.length === 0) {
      this.createMetricName(metricName, 'COUNTER')
        .map(res => res.payload)
        .mergeMap(res => this._createCounterMetric(Number(res), metricText, metricValue))
        .subscribe(res => {
          // do nothing with the response for now
        }, err => {
          console.warn('Error saving usage metric: ', metricName, metricText, metricValue);
        });
    } else {
      this._createCounterMetric(impMetricName[0].metricId, metricText, metricValue)
        .subscribe(res => {
          // do nothing with the response for now
        }, err => {
          console.warn('Error saving usage metric: ', metricName, metricText, metricValue);
        });
    }
  }

  /**
   * Create a new ImpMetricName and persist it in the database using the Fuse service
   * @param metricName The object of type UsageMetricName containing the namepsace, section, target, and action
   * @param metricTypeCode The type of ImpMetricName to create; COUNTER, TIMER, HISTOGRAM
   */
  private createMetricName(metricName: ImpMetricName, metricTypeCode: string) : Observable<RestResponse> {
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
    return this.restClient.post('v1/metrics/base/impmetricname/save', JSON.stringify(impMetricName));
  }

  /**
   * Create a new usage record in the IMP_METRIC_COUNTERS table using the Fuse service
   * @param metricName The ImpMetricName record that will be the parent record of this counter, see UsageTypes class
   * @param metricText The data that will be saved with this counter
   * @param metricValue The number that will be saved on this counter
   */
  private _createCounterMetric(metricName: number, metricText: string, metricValue: number) : Observable<RestResponse> {
    const impProject: ImpProject = this.impProjectService.get()[0];
    const projectid: string = impProject != null && impProject.projectId != null ? impProject.projectId.toString() : '';
   
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
    impMetricCounter.origSystemRefId = projectid;

    const headers: HttpHeaders = new HttpHeaders().set('Authorization', 'Bearer ' + DataStore.getConfig().oauthToken);

    // Send the counter data to Fuse for persistence
    return this.restClient.post('v1/metrics/base/impmetriccounter/save', JSON.stringify(impMetricCounter));

  }

}