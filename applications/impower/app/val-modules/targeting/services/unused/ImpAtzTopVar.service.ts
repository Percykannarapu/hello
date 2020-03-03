/** A TARGETING domain data service representing the table: IMPOWER.IMP_ATZ_TOP_VARS
 **
 ** This class contains code operates against data in its data store.
 ** See the contents of val-modules/common/services/datastore.service.ts to see built in
 ** methods that all data services have.
 **
 ** NOTE: This class is generated only once and may be updated by developers.
 **
 ** ImpAtzTopVar.service.ts generated from VAL_ENTITY_GEN - v2.0
 **/

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DataStore } from '../../../common/services/datastore.service';
import { LoggingService } from '../../../common/services/logging.service';
import { RestDataService } from '../../../common/services/restdata.service';
import { ImpAtzTopVar } from '../../models/ImpAtzTopVar';

const dataUrl = 'v1/targeting/base/impatztopvar/search?q=impAtzTopVar';

@Injectable()
export class ImpAtzTopVarService extends DataStore<ImpAtzTopVar>
{
   constructor(private restDataService: RestDataService, logger: LoggingService) {super(restDataService, dataUrl, logger); }

   private handleError(error: Response)
   {
      const errorMsg = `Status code: ${error.status} on url ${error.url}`;
      console.error(errorMsg);
      return Observable.throw(errorMsg);
   }
}
