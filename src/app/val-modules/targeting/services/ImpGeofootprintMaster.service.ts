/** An IMPTARGETING domain data service representing the table: IMPOWER.IMP_GEOFOOTPRINT_MASTER
 **
 ** This class contains code operates against data in its data store.
 ** See the contents of val-modules/common/services/datastore.service.ts to see built in
 ** methods that all data services have.
 **
 ** NOTE: This class is generated only once and may be updated by developers.
 **
 ** ImpGeofootprintMaster.service.ts generated from VAL_BASE_GEN - v1.04
 **/

import { ImpGeofootprintMaster } from '../models/ImpGeofootprintMaster';
import { AppConfig } from '../../../app.config';
import { RestDataService } from './../../common/services/restdata.service';
import { DataStore } from '../../common/services/datastore.service';
import { TransactionManager } from './../../common/services/TransactionManager.service';
import { InTransaction } from './../../common/services/datastore.service'
import { UserService } from '../../../services/user.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

const dataUrl = 'v1/targeting/base/impgeofootprintmaster/load';

@Injectable()
export class ImpGeofootprintMasterService extends DataStore<ImpGeofootprintMaster>
{
   constructor(public appConfig: AppConfig,
               public userService: UserService,
               public transactionManager: TransactionManager,
               private restDataService: RestDataService)
   {
      super(restDataService, dataUrl, transactionManager, 'ImpGeofootprintMaster');
   }

   private handleError(error: Response)
   {
      const errorMsg = `Status code: ${error.status} on url ${error.url}`;
      console.error(errorMsg);
      return Observable.throw(errorMsg);
   }
}
