/** A TARGETING domain data service representing the table: IMPOWER.IMP_GEOFOOTPRINT_LOC_ATTRIBS
 **
 ** This class contains code operates against data in its data store.
 ** See the contents of val-modules/common/services/datastore.service.ts to see built in
 ** methods that all data services have.
 **
 ** NOTE: This class is generated only once and may be updated by developers.
 **
 ** ImpGeofootprintLocAttrib.service.ts generated from VAL_ENTITY_GEN - v2.0
 **/
import { TransactionManager } from '../../common/services/TransactionManager.service';
import { ImpGeofootprintLocAttrib } from '../models/ImpGeofootprintLocAttrib';
import { RestDataService } from './../../common/services/restdata.service';
import { DataStore } from '../../common/services/datastore.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

const dataUrl = 'v1/targeting/base/impgeofootprintlocattrib/search?q=impGeofootprintLocAttrib';

@Injectable()
export class ImpGeofootprintLocAttribService extends DataStore<ImpGeofootprintLocAttrib>
{
   constructor(private restDataService: RestDataService
              ,private projectTransactionManager: TransactionManager)
   {
      super(restDataService, dataUrl, projectTransactionManager, 'ImpGeofootprintLocAttrib');
   }

   public sort (a: ImpGeofootprintLocAttrib, b: ImpGeofootprintLocAttrib): number
   {
      if (a == null || b == null || a.impGeofootprintLocation == null || b.impGeofootprintLocation == null)
      {
         console.warn('sort criteria is null - a:', a, ', b: ', b);
         return 0;
      }

      if (a.impGeofootprintLocation.locationNumber === b.impGeofootprintLocation.locationNumber)
      {
         if (a.attributeCode === b.attributeCode)
            return 0;
         else
            if (a.attributeCode > b.attributeCode)
               return -1;
            else
               return  1;
      }
      else
         if (a.impGeofootprintLocation.locationNumber > b.impGeofootprintLocation.locationNumber)
            return 1;
         else
            return -1;
   }

   public partition (p1: ImpGeofootprintLocAttrib, p2: ImpGeofootprintLocAttrib): boolean
   {
      if (p1 == null || p2 == null)
      {
         return false;
      }

      // Partition within location, attributeCode
      return (p1 == null || p2 == null || p1.impGeofootprintLocation == null || p2.impGeofootprintLocation == null)
             ? null : (p1.impGeofootprintLocation.locationNumber != p2.impGeofootprintLocation.locationNumber
                    || p1.attributeCode != p2.attributeCode);
   }

   private handleError(error: Response)
   {
      const errorMsg = `Status code: ${error.status} on url ${error.url}`;
      console.error(errorMsg);
      return Observable.throw(errorMsg);
   }
}
