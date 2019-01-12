/** A TARGETING domain data service representing the table: IMPOWER.IMP_GEOFOOTPRINT_GEO_ATTRIBS (TABLE DOESNT EXIST)
 **
 ** This class contains code operates against data in its data store.
 ** See the contents of val-modules/common/services/datastore.service.ts to see built in
 ** methods that all data services have.
 **
 ** NOTE: This class is generated only once and may be updated by developers.
 **
 ** ImpGeofootprintGeoAttrib.service.ts generated from VAL_ENTITY_GEN - v2.0
 **/
import { TransactionManager } from '../../common/services/TransactionManager.service';
import { ImpGeofootprintGeoAttrib } from '../models/ImpGeofootprintGeoAttrib';
import { RestDataService } from '../../common/services/restdata.service';
import { DataStore } from '../../common/services/datastore.service';
import { Injectable } from '@angular/core';

const dataUrl = 'v1/targeting/base/impgeofootprintgeoattrib/search?q=impGeofootprintGeoAttrib';

@Injectable()
export class ImpGeofootprintGeoAttribService extends DataStore<ImpGeofootprintGeoAttrib>
{
   constructor(restDataService: RestDataService,
               projectTransactionManager: TransactionManager)
   {
      super(restDataService, dataUrl, projectTransactionManager, 'ImpGeofootprintGeoAttrib');
   }
}