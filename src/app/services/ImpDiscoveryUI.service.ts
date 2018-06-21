/** A temporary service to manage the ImpDiscoveryUI model data
 **
 ** This class contains code operates against data in its data store.
 ** See the contents of val-modules/common/services/datastore.service.ts to see built in
 ** methods that all data services have.
 **
 **/
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ImpMetricName } from '../val-modules/metrics/models/ImpMetricName';
import { map } from 'rxjs/internal/operators/map';
import { AppMessagingService } from './app-messaging.service';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { UsageService } from './usage.service';
import { isNumber } from '../app.utils';

const dataUrl = '';


export class CounterMetrics {
      constructor(public usageMetricName: ImpMetricName, public metricText: string, public metricValue: number
      ) { }
}

@Injectable()
export class ImpDiscoveryService // extends DataStore<ImpDiscoveryUI>
{
      public storeProjectTrackerData;
      public needsGeoRefresh: boolean = false;

      constructor(private restDataService: RestDataService) {
            // super(restDataService, dataUrl, null, 'ImpDiscovery');
      }

      public getProjectTrackerData() : Observable<any> {
        const updatedDateTo = new Date();
        updatedDateTo.setDate(updatedDateTo.getDate() + 1);
        const updatedDateFrom = new Date();
        updatedDateFrom.setMonth(updatedDateFrom.getMonth() - 6);
        return this.restDataService.get(`v1/targeting/base/impimsprojectsview/search?q=impimsprojectsview&fields=PROJECT_ID projectId,PROJECT_NAME projectName,
              TARGETOR targetor,CLIENT_NAME clientName&updatedDateFrom=${this.formatDate(updatedDateFrom)}&updatedDateTo=${this.formatDate(updatedDateTo)}&sort=UPDATED_DATE&sortDirection=desc`).pipe(
          map((result: any) => result.payload.rows)
        );
      }

      public discoveryUsageMetricsCreate(actionName: string) : CounterMetrics[] {
        return;
        //let discoverUIData: ImpDiscoveryUI = this.get()[0];
        // const counterMetrics = [];
        // let usageMetricName = null;
        //
        // if (discoverUIData.productCode != null || discoverUIData.productCode != '') {
        //   usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'product', action: actionName });
        //   counterMetrics.push(new CounterMetrics(usageMetricName, discoverUIData.productCode, null));
        // }
        // if (discoverUIData.industryCategoryName != null || discoverUIData.industryCategoryName != '') {
        //   usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'category', action: actionName });
        //   counterMetrics.push(new CounterMetrics(usageMetricName, discoverUIData.industryCategoryName, null));
        // }
        // if (discoverUIData.analysisLevel) {
        //   usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'analysis-level', action: actionName });
        //   counterMetrics.push(new CounterMetrics(usageMetricName, discoverUIData.analysisLevel, null));
        // }
        // if (discoverUIData.cpm != null) {
        //   const blendedCpm = discoverUIData.cpm != null ? discoverUIData.cpm : null;
        //   usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'blended-cpm', action: actionName });
        //   counterMetrics.push(new CounterMetrics(usageMetricName, null, blendedCpm));
        // }
        // if (discoverUIData.valassisCPM != null) {
        //   const valassisCpm = discoverUIData.valassisCPM != null ? discoverUIData.valassisCPM : null;
        //   usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'valassis-cpm', action: actionName });
        //   counterMetrics.push(new CounterMetrics(usageMetricName, null, valassisCpm));
        // }
        // if (discoverUIData.anneCPM != null) {
        //   const anneCPM = discoverUIData.anneCPM != null ? discoverUIData.anneCPM : null;
        //   usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'anne-cpm', action: actionName });
        //   counterMetrics.push(new CounterMetrics(usageMetricName, null, anneCPM));
        // }
        // if (discoverUIData.soloCPM != null) {
        //   const soloCpm = discoverUIData.soloCPM != null ? discoverUIData.soloCPM : null;
        //   usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'solo-cpm', action: actionName });
        //   counterMetrics.push(new CounterMetrics(usageMetricName, null, soloCpm));
        // }
        // if (discoverUIData.totalBudget != null) {
        //   const totalBudget = discoverUIData.totalBudget != null ? discoverUIData.totalBudget : null;
        //   usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'dollar-budget', action: actionName });
        //   counterMetrics.push(new CounterMetrics(usageMetricName, null, totalBudget));
        // }
        // if (discoverUIData.circBudget != null) {
        //   const circBudget = discoverUIData.circBudget != null ? discoverUIData.circBudget : null;
        //   usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'circ-budget', action: actionName });
        //   counterMetrics.push(new CounterMetrics(usageMetricName, null, circBudget));
        // }
        // if (discoverUIData.selectedSeason != null) {
        //   usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'season', action: actionName });
        //   counterMetrics.push(new CounterMetrics(usageMetricName, discoverUIData.selectedSeason, null));
        // }
        // usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'include-pob-geo', action: actionName });
        // const ispob = discoverUIData.includePob ? 1 : 0;
        // counterMetrics.push(new CounterMetrics(usageMetricName, ispob.toString(), null));
        //
        // usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'include-valassis-geo', action: actionName });
        // const isvalGeo = discoverUIData.includeValassis ? 1 : 0;
        // counterMetrics.push(new CounterMetrics(usageMetricName, isvalGeo.toString(), null));
        //
        // usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'include-anne-geo', action: actionName });
        // const isAnneGeo = discoverUIData.includeAnne ? 1 : 0;
        // counterMetrics.push(new CounterMetrics(usageMetricName, isAnneGeo.toString(), null));
        //
        // usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'include-solo-geo', action: actionName });
        // const isSoloGeo = discoverUIData.includeAnne ? 1 : 0;
        // counterMetrics.push(new CounterMetrics(usageMetricName, isSoloGeo.toString(), null));
        //
        // return counterMetrics;
      }

      private formatDate(date) : string {
        const zeroPad = Intl.NumberFormat(undefined, { minimumIntegerDigits: 2 }).format;
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}-${zeroPad(month)}-${zeroPad(day)}`;
      }

}
