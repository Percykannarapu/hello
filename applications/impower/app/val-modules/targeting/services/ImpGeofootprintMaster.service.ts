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
import { RestDataService } from '../../common/services/restdata.service';
import { DataStore } from '../../common/services/datastore.service';
import { TransactionManager } from '../../common/services/TransactionManager.service';
import { Injectable } from '@angular/core';
import { Observable, EMPTY } from 'rxjs';
import { ImpGeofootprintMaster } from '../models/ImpGeofootprintMaster';
import { ImpGeofootprintLocationService } from './ImpGeofootprintLocation.service';
import { DAOBaseStatus } from '../../api/models/BaseModel';
import { simpleFlatten } from '@val/common';

const dataUrl = 'v1/targeting/base/impgeofootprintmaster/load';

@Injectable()
export class ImpGeofootprintMasterService extends DataStore<ImpGeofootprintMaster>
{
   constructor(transactionManager: TransactionManager,
               restDataService: RestDataService,
               private impGeofootprintLocationService: ImpGeofootprintLocationService)
   {
      super(restDataService, dataUrl, transactionManager, 'ImpGeofootprintMaster');
   }

    load(items: ImpGeofootprintMaster[]) : void {
      this.impGeofootprintLocationService.load(simpleFlatten(items.map(m => m.impGeofootprintLocations)));
      super.load(items);
    }

   // Get a count of DB removes from children of these parents
   public getTreeRemoveCount(impGeofootprintMasters: ImpGeofootprintMaster[]) : number {
      let count: number = 0;
      impGeofootprintMasters.forEach(impGeofootprintMaster => {
         count += this.dbRemoves.filter(remove => remove.cgmId === impGeofootprintMaster.cgmId).length;
         count += this.impGeofootprintLocationService.getTreeRemoveCount(this.impGeofootprintLocationService.get().filter(loc => loc.cgmId === impGeofootprintMaster.cgmId).concat
                                                                        (this.impGeofootprintLocationService.dbRemoves.filter(loc => loc.cgmId === impGeofootprintMaster.cgmId)));
      });
      return count;
   }

   // After DB removes have be executed, complete them by removing them from the data stores delete list
   public completeDBRemoves(completes: ImpGeofootprintMaster[]) {
      completes.forEach(complete => {
         this.impGeofootprintLocationService.completeDBRemoves(this.impGeofootprintLocationService.get().filter(loc => loc.cgmId === complete.cgmId));
      });
      this.clearDBRemoves(completes);
   }

   // Return a tree of source nodes where they and their children are in the UNCHANGED or DELETE status
   public prune(source: ImpGeofootprintMaster[], filterOp: (impGeofootprintLocation: ImpGeofootprintMaster) => boolean) : ImpGeofootprintMaster[]
   {
      if (source == null || source.length === 0)
         return source;

      const result: ImpGeofootprintMaster[] = source.filter(filterOp).filter(tree => this.getTreeRemoveCount([tree]) > 0);
      
      // TODO: Pretty sure I can use the filterOp below
      result.forEach (master => {
         master.impGeofootprintLocations = this.impGeofootprintLocationService.prune(master.impGeofootprintLocations, loc => loc.cgmId === master.cgmId && (loc.baseStatus === DAOBaseStatus.UNCHANGED || loc.baseStatus === DAOBaseStatus.DELETE));
      });

      return result;
   }

   // Process all of the removes, ensuring that children of removes are also removed and optionally performing the post
   public performDBRemoves(removes: ImpGeofootprintMaster[], doPost: boolean = true, mustRemove: boolean = false) : Observable<number>
   {
      const impGeofootprintMasterRemoves:   ImpGeofootprintMaster[] = [];
      // Prepare database removes for all parents in removes
      removes.forEach(master => {
         // If a root level removal or if a direct parent was removed, flag this object for removal
         if (mustRemove)
            this.remove(master);

         const hasRemoves: boolean = this.getTreeRemoveCount([master]) > 0;

         if (hasRemoves)
         {
            // Determine if the parent is already in the remove list
            const parentRemove: boolean = this.dbRemoves.includes(master);

            // Parent gets added to removes even if not being deleted to act as a container
            if (parentRemove)
               impGeofootprintMasterRemoves.push(master);

            // Parent is being removed, all children must be removed as well
            if (parentRemove)
            {
               this.impGeofootprintLocationService.performDBRemoves(this.impGeofootprintLocationService.get().filter(loc => loc.cgmId === master.cgmId), false, true);
            }
            else
            // Parent is not being removed, only children already marked for removal will be deleted
            {
               const childRemovals = this.impGeofootprintLocationService.filterBy (loc => loc.cgmId === master.cgmId && loc.baseStatus === DAOBaseStatus.DELETE, (master) => this.impGeofootprintLocationService.getTreeRemoveCount(master), false, true, true);
               this.impGeofootprintLocationService.performDBRemoves(childRemovals, false, false);
            }
/*
            // DEBUG: Get the list of children to remove.
            console.log("impGeofootprintMaster   removes: ", impGeofootprintMasterRemoves);
            console.log("impGeofootprintLocation removes: ", impGeofootprintLocationRemoves);*/
         }
      });

      if (doPost)
      {
         // Clone the parents as a base for the payload
         let removesPayload: ImpGeofootprintMaster[] = JSON.parse(JSON.stringify(impGeofootprintMasterRemoves));

         // Prune out just the deletes and unchanged from the parents and children
         removesPayload = this.prune(removesPayload, ta => ta.baseStatus == DAOBaseStatus.DELETE || ta.baseStatus === DAOBaseStatus.UNCHANGED);

         return Observable.create(observer => {
            this.postDBRemoves('Targeting', 'ImpGeofootprintMaster', 'v1', removesPayload)
                .subscribe(postResultCode => {
                     console.log('post completed, calling completeDBRemoves');
                     this.completeDBRemoves(impGeofootprintMasterRemoves);
                     observer.next(postResultCode);
                     observer.complete();
                  });
         });
      }
      else
         return EMPTY;
   }
}
