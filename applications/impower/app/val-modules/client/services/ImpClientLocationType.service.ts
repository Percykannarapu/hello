/** A CLIENT domain data service representing the table: IMPOWER.IMP_CLIENT_LOCATION_TYPES
 **
 ** This class contains code operates against data in its data store.
 ** See the contents of val-modules/common/services/datastore.service.ts to see built in
 ** methods that all data services have.
 **
 ** NOTE: This class is generated only once and may be updated by developers.
 **
 ** ImpClientLocationType.service.ts generated from VAL_ENTITY_GEN - v2.0
 **/

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DataStore } from '../../common/services/datastore.service';
import { LoggingService } from '../../common/services/logging.service';
import { RestDataService } from '../../common/services/restdata.service';
import { ImpClientLocationType } from '../models/ImpClientLocationType';

const dataUrl = 'v1/client/base/impclientlocationtype/search?q=impClientLocationType';

@Injectable()
export class ImpClientLocationTypeService extends DataStore<ImpClientLocationType>
{
   constructor(private restDataService: RestDataService, logger: LoggingService) {super(restDataService, dataUrl, logger); }

   private handleError(error: Response)
   {
      const errorMsg = `Status code: ${error.status} on url ${error.url}`;
      console.error(errorMsg);
      return Observable.throw(errorMsg);
   }
}
