import { Injectable } from '@angular/core';
import { ImpMetricName } from '../val-modules/metrics/models/ImpMetricName';
import { ImpMetricType } from '../val-modules/metrics/models/ImpMetricType';
import { ImpMetricCounter } from '../val-modules/metrics/models/ImpMetricCounter';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { UserService } from './user.service';


export class UsageTypes {
  static targetingMapThematicShadingActivated: number = 1;
  static targetingAudienceOfflineChecked: number = 2;
  static targetingAudienceOfflineUnchecked: number = 3;
  static targetingMapLayerVisibilityActivated: number = 4;
  static targetingMapLayerVisibilityDeactivated: number = 5;
  static targetingAudienceOnlineChecked: number = 22;
  static targetingAudienceOnlineUnchecked: number = 23;
  static targetingAudienceCustomDataFileUpload: number = 24;
  static targetingLocationSiteDataFileUpload: number = 25;
  static targetingLocationCompetitorDataFileUpload: number = 26;
  static targetingLocationBusinessSearchImport: number = 27;
  static targetingLocationBusinessSearchSearch: number = 28;
  static targetingLocationSingleLocationAdd: number = 29;
  static targetingLocationSingleLocationDelete: number = 30;
  static targetingLocationGeofootprintExport: number = 31;
  static targetingLocationSiteListExport: number = 32;
  static targetingLocationCompetitorListExport: number = 33;
  static targetingProjectProjectSave: number = 34;
  static targetingProjectProjectLoad: number = 35;
  static targetingTradeareaRadiusApplied: number = 36;
  static targetingTradeareaCustomDataFileUpload: number = 37;
  static targetingProjectAnalysisLevelChanged: number = 38;
  static targetingTradeareaGeographySelected: number = 39;
  static targetingTradeareaGeographyDeselected: number = 40;
}

@Injectable()
export class UsageService {

  constructor(private userService: UserService, private restClient: RestDataService) { }

  /**
   * Create a new usage record in the IMP_METRIC_COUNTERS table using the Fuse service
   * @param metricName The ImpMetricName record that will be the parent record of this counter, see UsageTypes class
   * @param metricText The data that will be saved with this counter
   * @param metricValue The number that will be saved on this counter
   */
  public createCounterMetric(metricName: number, metricText: string, metricValue: number) {
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

    // Send the counter data to Fuse for persistence
    this.restClient.post('v1/metrics/base/impmetriccounter/save', JSON.stringify(impMetricCounter))
      .subscribe(res => {
        // don't do anything with the response for now
      }, err => {
        console.warn('Unable to persist metric data');
      });

  }

}
