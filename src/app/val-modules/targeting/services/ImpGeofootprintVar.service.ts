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

import { ImpGeofootprintVar } from '../models/ImpGeofootprintVar';
import { AppConfig } from '../../../app.config';
import { RestDataService } from './../../common/services/restdata.service';
import { DataStore } from '../../common/services/datastore.service';
import { TransactionManager } from './../../common/services/TransactionManager.service';
import { InTransaction } from './../../common/services/datastore.service'
import { UserService } from '../../../services/user.service';
import { Injectable } from '@angular/core';
import { Observable, EMPTY } from 'rxjs';
import { DAOBaseStatus } from '../../api/models/BaseModel';

const dataUrl = 'v1/targeting/base/impgeofootprintvar/load';

@Injectable()
export class ImpGeofootprintVarService extends DataStore<ImpGeofootprintVar>
{
   constructor(public appConfig: AppConfig,
               public userService: UserService,
               public transactionManager: TransactionManager,
               private restDataService: RestDataService)
   {
      super(restDataService, dataUrl, transactionManager, 'ImpGeofootprintVar');
   }

   // Get a count of DB removes from children of these parents
   public getTreeRemoveCount(impGeofootprintVars: ImpGeofootprintVar[]): number {
      let count: number = 0;
      impGeofootprintVars.forEach(impGeofootprintVar => {
         count += this.dbRemoves.filter(remove => remove.gvId === impGeofootprintVar.gvId).length;
      });
      return count;
   }
   
   // After DB removes have be executed, complete them by removing them from the data stores delete list
   public completeDBRemoves(completes: ImpGeofootprintVar[]) {
      this.clearDBRemoves(completes);
   }

   // Return a tree of source nodes where they and their children are in the UNCHANGED or DELETE status
   public prune(source: ImpGeofootprintVar[], filterOp: (impProject: ImpGeofootprintVar) => boolean): ImpGeofootprintVar[]
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

         let performDBRemoves$ = Observable.create(observer => {
            this.postDBRemoves("Targeting", "ImpGeofootprintVar", "v1", removesPayload)
               .subscribe(postResultCode => {
                     console.log("post completed, calling completeDBRemoves");
                     this.completeDBRemoves(removes);
                     observer.next(postResultCode);
                     observer.complete();
                  });
         });

         return performDBRemoves$;
      }
      else
         return EMPTY;
   }

   private handleError(error: Response)
   {
      const errorMsg = `Status code: ${error.status} on url ${error.url}`;
      console.error(errorMsg);
      return Observable.throw(errorMsg);
   }
}
