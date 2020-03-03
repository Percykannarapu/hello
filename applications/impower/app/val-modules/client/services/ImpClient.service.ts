/** A CLIENT domain data service representing the table: IMPOWER.IMP_CLIENTS_V
 **
 ** This class contains code operates against data in its data store.
 ** See the contents of val-modules/common/services/datastore.service.ts to see built in
 ** methods that all data services have.
 **
 ** NOTE: This class is generated only once and may be updated by developers.
 **
 ** ImpClient.service.ts generated from VAL_ENTITY_GEN - v2.0
 **/

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DataStore } from '../../common/services/datastore.service';
import { LoggingService } from '../../common/services/logging.service';
import { RestDataService } from '../../common/services/restdata.service';
import { ImpClient } from '../models/ImpClient';

const dataUrl = 'v1/client/base/impclient/search?q=impClient';

@Injectable()
export class ImpClientService extends DataStore<ImpClient>
{
   constructor(private restDataService: RestDataService, logger: LoggingService) {super(restDataService, dataUrl, logger); }

   private handleError(error: Response)
   {
      const errorMsg = `Status code: ${error.status} on url ${error.url}`;
      console.error(errorMsg);
      return Observable.throw(errorMsg);
   }
}
