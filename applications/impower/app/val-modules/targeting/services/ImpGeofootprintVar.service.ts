/** An IMPTARGETING domain data service representing the table: IMPOWER.IMP_GEOFOOTPRINT_VARS
 **
 ** This class contains code operates against data in its data store.
 ** See the contents of val-modules/common/services/datastore.service.ts to see built in
 ** methods that all data services have.
 **
 ** NOTE: This class is generated only once and may be updated by developers.
 **
 ** ImpGeofootprintVar.service.ts generated from VAL_BASE_GEN - v1.04
 **/

import { Injectable } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { DAOBaseStatus } from '../../api/models/BaseModel';
import { DataStore } from '../../common/services/datastore.service';
import { LoggingService } from '../../common/services/logging.service';
import { RestDataService } from '../../common/services/restdata.service';
import { TransactionManager } from '../../common/services/TransactionManager.service';
import { ImpGeofootprintVar } from '../models/ImpGeofootprintVar';

const dataUrl = 'v1/targeting/base/impgeofootprintvar/load';

@Injectable()
export class ImpGeofootprintVarService extends DataStore<ImpGeofootprintVar>
{
   constructor(transactionManager: TransactionManager,
               restDataService: RestDataService,
               logger: LoggingService)
   {
      super(restDataService, dataUrl, logger, transactionManager, 'ImpGeofootprintVar');
   }

   // After DB removes have be executed, complete them by removing them from the data stores delete list
   public completeDBRemoves(completes: ImpGeofootprintVar[]) {
      this.clearDBRemoves(completes);
   }

   // Return a tree of source nodes where they and their children are in the UNCHANGED or DELETE status
   public prune(source: ImpGeofootprintVar[], filterOp: (impProject: ImpGeofootprintVar) => boolean) : ImpGeofootprintVar[]
   {
      if (source == null || source.length === 0)
         return source;

      return source.filter(filterOp);
   }

   // Process all of the removes, ensuring that children of removes are also removed and optionally performing the post
   public performDBRemoves(removes: ImpGeofootprintVar[], doPost: boolean = true, mustRemove: boolean = false) : Observable<number>
   {
      if (mustRemove)
         this.remove(removes);

      if (doPost)
      {
         // Clone the parents as a base for the payload
         let removesPayload: ImpGeofootprintVar[] = JSON.parse(JSON.stringify(removes));

         // Prune out just the deletes and unchanged from the parents and children
         removesPayload = this.prune(removesPayload, ta => ta.baseStatus == DAOBaseStatus.DELETE || ta.baseStatus === DAOBaseStatus.UNCHANGED);

         return Observable.create(observer => {
            this.postDBRemoves('Targeting', 'ImpGeofootprintVar', 'v1', removesPayload)
               .subscribe(postResultCode => {
                     console.log('post completed, calling completeDBRemoves');
                     this.completeDBRemoves(removes);
                     observer.next(postResultCode);
                     observer.complete();
                  });
         });
      }
      else
         return EMPTY;
   }
}
