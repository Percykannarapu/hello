/** A TARGETING domain data service representing the table: IMPOWER.IMP_GEOFOOTPRINT_VARS
 **
 ** This class contains code operates against data in its data store.
 ** See the contents of val-modules/common/services/datastore.service.ts to see built in
 ** methods that all data services have.
 **
 ** NOTE: This class is generated only once and may be updated by developers.
 **
 ** ImpGeofootprintVar.service.ts generated from VAL_ENTITY_GEN - v2.0
 **/
import { TransactionManager } from '../../common/services/TransactionManager.service';
import { ImpGeofootprintVar } from '../models/ImpGeofootprintVar';
import { RestDataService } from './../../common/services/restdata.service';
import { DataStore } from '../../common/services/datastore.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

const dataUrl = 'v1/targeting/base/impgeofootprintvar/search?q=impGeofootprintVar';

@Injectable()
export class ImpGeofootprintVarService extends DataStore<ImpGeofootprintVar>
{
   constructor(private restDataService: RestDataService
              ,private projectTransactionManager: TransactionManager)
   {
      super(restDataService, dataUrl, projectTransactionManager, 'ImpGeofootprintVar');
   }

   private handleError(error: Response)
   {
      const errorMsg = `Status code: ${error.status} on url ${error.url}`;
      console.error(errorMsg);
      return Observable.throw(errorMsg);
   }
}