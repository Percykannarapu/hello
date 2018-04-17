/** A TARGETING domain data service representing the table: IMPOWER.IMP_GEOFOOTPRINT_TRADE_AREAS
 **
 ** This class contains code operates against data in its data store.
 ** See the contents of val-modules/common/services/datastore.service.ts to see built in
 ** methods that all data services have.
 **
 ** NOTE: This class is generated only once and may be updated by developers.
 **
 ** ImpGeofootprintTradeArea.service.ts generated from VAL_ENTITY_GEN - v2.0
 **/
import { TransactionManager } from '../../common/services/TransactionManager.service';
import { ImpGeofootprintTradeArea } from '../models/ImpGeofootprintTradeArea';
import { RestDataService } from './../../common/services/restdata.service';
import { DataStore } from '../../common/services/datastore.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

const dataUrl = 'v1/targeting/base/impgeofootprinttradearea/search?q=impGeofootprintTradeArea';

@Injectable()
export class ImpGeofootprintTradeAreaService extends DataStore<ImpGeofootprintTradeArea>
{
   constructor(private restDataService: RestDataService
              ,private projectTransactionManager: TransactionManager)
   {
      super(restDataService, dataUrl);
   }

   private handleError(error: Response)
   {
      const errorMsg = `Status code: ${error.status} on url ${error.url}`;
      console.error(errorMsg);
      return Observable.throw(errorMsg);
   }
}