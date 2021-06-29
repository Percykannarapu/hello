/** A METRICS domain data service representing the table: IMPOWER.IMP_METRIC_HEALTH_CHECKS
 **
 ** This class contains code operates against data in its data store.
 ** See the contents of val-modules/common/services/datastore.service.ts to see built in
 ** methods that all data services have.
 **
 ** NOTE: This class is generated only once and may be updated by developers.
 **
 ** ImpMetricHealthCheck.service.ts generated from VAL_ENTITY_GEN - v2.01
 **/

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DataStore } from '../../app/val-modules/common/services/datastore.service';
import { LoggingService } from '../../app/val-modules/common/services/logging.service';
import { RestDataService } from '../../app/val-modules/common/services/restdata.service';
import { ImpMetricHealthCheck } from './ImpMetricHealthCheck';

const dataUrl = 'v1/metrics/base/impmetrichealthcheck/search?q=impMetricHealthCheck';

@Injectable()
export class ImpMetricHealthCheckService extends DataStore<ImpMetricHealthCheck>
{
   constructor(private restDataService: RestDataService, logger: LoggingService) {super(restDataService, dataUrl, logger); }

   private handleError(error: Response)
   {
      const errorMsg = `Status code: ${error.status} on url ${error.url}`;
      console.error(errorMsg);
      return Observable.throw(errorMsg);
   }
}