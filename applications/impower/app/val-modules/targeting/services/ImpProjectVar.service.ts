/** An IMPTARGETING domain data service representing the table: IMPOWER.IMP_PROJECT_VARS
 **
 ** This class contains code operates against data in its data store.
 ** See the contents of val-modules/common/services/datastore.service.ts to see built in
 ** methods that all data services have.
 **
 ** NOTE: This class is generated only once and may be updated by developers.
 **
 ** ImpProjectVar.service.ts generated from VAL_BASE_GEN - v1.04
 **/

import { Injectable } from '@angular/core';
import { DataStore } from '../../common/services/datastore.service';
import { LoggingService } from '../../common/services/logging.service';
import { RestDataService } from '../../common/services/restdata.service';
import { TransactionManager } from '../../common/services/TransactionManager.service';
import { ImpProjectVar } from '../models/ImpProjectVar';

const dataUrl = 'v1/imptargeting/base/impprojectvar/load';

@Injectable()
export class ImpProjectVarService extends DataStore<ImpProjectVar>
{
   constructor(transactionManager: TransactionManager,
               restDataService: RestDataService,
               logger: LoggingService)
   {
      super(restDataService, dataUrl, logger, transactionManager, 'ImpProjectVar');
   }
}
