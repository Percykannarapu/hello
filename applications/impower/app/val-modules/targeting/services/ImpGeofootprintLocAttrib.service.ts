/** An IMPTARGETING domain data service representing the table: IMPOWER.IMP_GEOFOOTPRINT_LOC_ATTRIBS
 **
 ** This class contains code operates against data in its data store.
 ** See the contents of val-modules/common/services/datastore.service.ts to see built in
 ** methods that all data services have.
 **
 ** NOTE: This class is generated only once and may be updated by developers.
 **
 ** ImpGeofootprintLocAttrib.service.ts generated from VAL_BASE_GEN - v1.04
 **/
import { Injectable } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { DAOBaseStatus } from '../../../../worker-shared/data-model/impower.data-model.enums';
import { DataStore } from '../../common/services/datastore.service';
import { LoggingService } from '../../common/services/logging.service';
import { RestDataService } from '../../common/services/restdata.service';
import { TransactionManager } from '../../common/services/TransactionManager.service';
import { ImpGeofootprintLocAttrib } from '../models/ImpGeofootprintLocAttrib';

const dataUrl = 'v1/targeting/base/impgeofootprintlocattrib/search?q=impGeofootprintLocAttrib';

@Injectable({ providedIn: 'root' })
export class ImpGeofootprintLocAttribService extends DataStore<ImpGeofootprintLocAttrib>
{
   constructor(transactionManager: TransactionManager,
               restDataService: RestDataService,
               logger: LoggingService)
   {
      super(restDataService, dataUrl, logger, transactionManager, 'ImpGeofootprintLocAttrib');
   }

   load(items: ImpGeofootprintLocAttrib[]) : void {

      items.forEach(item => {
      if (item.attributeCode === 'Home PCR') item.attributeCode = 'Home Carrier Route';
      if (item.attributeCode === 'Home ZIP') item.attributeCode = 'Home Zip Code';
     });
      super.load(items);
   }

   // Get a count of DB removes from children of these parents
   public getTreeRemoveCount(impGeofootprintLocAttribs: ImpGeofootprintLocAttrib[]) : number {
      let count: number = 0;
      impGeofootprintLocAttribs.forEach(impGeofootprintLocAttrib => {
         count += this.dbRemoves.filter(remove => remove.locAttributeId === impGeofootprintLocAttrib.locAttributeId).length;
      });
      return count;
   }

   // After DB removes have be executed, complete them by removing them from the data stores delete list
   public completeDBRemoves(completes: ImpGeofootprintLocAttrib[]) {
      this.clearDBRemoves(completes);
   }

   // Return a tree of source nodes where they and their children are in the UNCHANGED or DELETE status
   public prune(source: ImpGeofootprintLocAttrib[], filterOp: (impProject: ImpGeofootprintLocAttrib) => boolean) : ImpGeofootprintLocAttrib[]
   {
      if (source == null || source.length === 0)
         return source;

      return source.filter(filterOp);
   }

   // Process all of the removes, ensuring that children of removes are also removed and optionally performing the post
   public performDBRemoves(removes: ImpGeofootprintLocAttrib[], doPost: boolean = true, mustRemove: boolean = false) : Observable<number>
   {
      if (mustRemove)
         this.remove(removes);

      if (doPost)
      {
         // Clone the parents as a base for the payload
         let removesPayload: ImpGeofootprintLocAttrib[] = JSON.parse(JSON.stringify(removes));

         // Prune out just the deletes and unchanged from the parents and children
         removesPayload = this.prune(removesPayload, ta => ta.baseStatus == DAOBaseStatus.DELETE || ta.baseStatus === DAOBaseStatus.UNCHANGED);

         return Observable.create(observer => {
            this.postDBRemoves('Targeting', 'ImpGeofootprintLocAttrib', 'v1', removesPayload)
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

   public sort (a: ImpGeofootprintLocAttrib, b: ImpGeofootprintLocAttrib) : number
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

   public partition (p1: ImpGeofootprintLocAttrib, p2: ImpGeofootprintLocAttrib) : boolean
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
}
