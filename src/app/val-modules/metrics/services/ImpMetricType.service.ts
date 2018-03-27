/** A METRICS domain data service representing the table: IMPOWER.IMP_METRIC_TYPES
 **
 ** This class contains code operates against data in its data store.
 ** See the contents of val-modules/common/services/datastore.service.ts to see built in
 ** methods that all data services have.
 **
 ** NOTE: This class is generated only once and may be updated by developers.
 **
 ** ImpMetricType.service.ts generated from VAL_ENTITY_GEN - v2.01
 **/

import { ImpMetricType } from '../models/ImpMetricType';
import { RestDataService } from './../../common/services/restdata.service';
import { DataStore } from '../../common/services/datastore.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

const dataUrl = 'v1/metrics/base/impmetrictype/search?q=impMetricType';

@Injectable()
export class ImpMetricTypeService extends DataStore<ImpMetricType>
{
   constructor(private restDataService: RestDataService) {super(restDataService, dataUrl); }

   private handleError(error: Response)
   {
      const errorMsg = `Status code: ${error.status} on url ${error.url}`;
      console.error(errorMsg);
      return Observable.throw(errorMsg);
   }
}