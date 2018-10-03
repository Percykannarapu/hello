/** An IMPTARGETING domain data service representing the table: IMPOWER.IMP_GEOFOOTPRINT_TRADE_AREAS
 **
 ** This class contains code operates against data in its data store.
 ** See the contents of val-modules/common/services/datastore.service.ts to see built in
 ** methods that all data services have.
 **
 ** NOTE: This class is generated only once and may be updated by developers.
 **
 ** ImpGeofootprintTradeArea.service.ts generated from VAL_BASE_GEN - v1.04
 **/

import { ImpGeofootprintTradeArea } from '../models/ImpGeofootprintTradeArea';
import { RestDataService } from '../../common/services/restdata.service';
import { DataStore } from '../../common/services/datastore.service';
import { TransactionManager } from '../../common/services/TransactionManager.service';
import { Injectable } from '@angular/core';
import { ImpGeofootprintGeoService } from './ImpGeofootprintGeo.service';
import { ImpGeofootprintVarService } from './ImpGeofootprintVar.service';
import { DAOBaseStatus } from '../../api/models/BaseModel';
import { EMPTY, Observable } from 'rxjs';
import { simpleFlatten } from '../../common/common.utils';

const dataUrl = 'v1/targeting/base/impgeofootprinttradearea/load';

@Injectable()
export class ImpGeofootprintTradeAreaService extends DataStore<ImpGeofootprintTradeArea>
{
   constructor(transactionManager: TransactionManager,
               restDataService: RestDataService,
               public impGeofootprintGeoService: ImpGeofootprintGeoService,
               public impGeofootprintVarService: ImpGeofootprintVarService)
   {
      super(restDataService, dataUrl, transactionManager, 'ImpGeofootprintTradeArea');
   }

    load(items: ImpGeofootprintTradeArea[]) : void {
      // fixup fields that aren't part of convertToModel()
      items.forEach(ta => {
        ta['isComplete'] = true;
      });
      // load data stores
      super.load(items);
      this.impGeofootprintVarService.load(simpleFlatten(items.map(ta => ta.impGeofootprintVars)));
      this.impGeofootprintGeoService.load(simpleFlatten(items.map(ta => ta.impGeofootprintGeos)));
    }

   // Get a count of DB removes from children of these parents
   public getTreeRemoveCount(impGeofootprintTradeAreas: ImpGeofootprintTradeArea[]) : number {
      let count: number = 0;
      impGeofootprintTradeAreas.forEach(impGeofootprintTradeArea => {
         count += this.dbRemoves.filter(remove => remove.gtaId === impGeofootprintTradeArea.gtaId).length;
         count += this.impGeofootprintGeoService.getTreeRemoveCount(this.impGeofootprintGeoService.get().filter(geo  => geo.gtaId  === impGeofootprintTradeArea.gtaId).concat
                                                                   (this.impGeofootprintGeoService.dbRemoves.filter(geo  => geo.gtaId  === impGeofootprintTradeArea.gtaId)));
         count += this.impGeofootprintVarService.getTreeRemoveCount(this.impGeofootprintVarService.get().filter(gvar => gvar.gtaId === impGeofootprintTradeArea.gtaId).concat
                                                                   (this.impGeofootprintVarService.dbRemoves.filter(gvar => gvar.gtaId === impGeofootprintTradeArea.gtaId)));
      });
      return count;
   }

   // After DB removes have be executed, complete them by removing them from the data stores delete list
   public completeDBRemoves(completes: ImpGeofootprintTradeArea[]) {
      completes.forEach(complete => {
         this.impGeofootprintGeoService.completeDBRemoves(this.impGeofootprintGeoService.get().filter(geo  => geo.gtaId  === complete.gtaId));
         this.impGeofootprintVarService.completeDBRemoves(this.impGeofootprintVarService.get().filter(gvar => gvar.gtaId === complete.gtaId));
      });
      this.clearDBRemoves(completes);
   }

   // Return a tree of source nodes where they and their children are in the UNCHANGED or DELETE status
   public prune(source: ImpGeofootprintTradeArea[], filterOp: (impProject: ImpGeofootprintTradeArea) => boolean) : ImpGeofootprintTradeArea[]
   {
      if (source == null || source.length === 0)
         return source;

      const result: ImpGeofootprintTradeArea[] = source.filter(filterOp).filter(tree => this.getTreeRemoveCount([tree]) > 0);
      
      // TODO: Pretty sure I can use the filterOp below
      result.forEach (ta => {
         ta.impGeofootprintGeos = this.impGeofootprintGeoService.prune(ta.impGeofootprintGeos, geo => geo.gtaId === ta.gtaId && (geo.baseStatus === DAOBaseStatus.UNCHANGED || geo.baseStatus === DAOBaseStatus.DELETE));
         ta.impGeofootprintVars = this.impGeofootprintVarService.prune(ta.impGeofootprintVars, geo => geo.gtaId === ta.gtaId && (geo.baseStatus === DAOBaseStatus.UNCHANGED || geo.baseStatus === DAOBaseStatus.DELETE));
      });

      return result;
   }

   // Process all of the removes, ensuring that children of removes are also removed and optionally performing the post
   public performDBRemoves(removes: ImpGeofootprintTradeArea[], doPost: boolean = true, mustRemove: boolean = false) : Observable<number>
   {
      console.log('ImpGeofootprintTradeArea.service.performDBRemoves - ' + removes.length + ' removes');
      const impGeofootprintTradeAreaRemoves: ImpGeofootprintTradeArea[] = [];

      // Prepare database removes for all parents in removes
      removes.forEach(ta => {
         // If a root level removal or if a direct parent was removed, flag this object for removal
         if (mustRemove)
            this.remove(ta);

         // Determine if the parent is already in the remove list
         const parentRemove: boolean = this.dbRemoves.includes(ta);

         // Parent gets added to removes even if not being deleted to act as a container
         impGeofootprintTradeAreaRemoves.push(ta);

         // Parent is being removed, all children must be removed as well
         if (parentRemove)
         {
            this.impGeofootprintGeoService.performDBRemoves(this.impGeofootprintGeoService.get().filter(geo  => geo.gtaId  === ta.gtaId), false, true);
            this.impGeofootprintVarService.performDBRemoves(this.impGeofootprintVarService.get().filter(gvar => gvar.gtaId === ta.gtaId), false, true);
         }
         else
         {
            this.impGeofootprintGeoService.performDBRemoves(this.impGeofootprintGeoService.filterBy (geo  => geo.gtaId  === geo.gtaId  && geo['baseStatus']  === DAOBaseStatus.DELETE, (geo)    => this.impGeofootprintGeoService.getTreeRemoveCount(geo),    false, true, true), false, false);
            this.impGeofootprintVarService.performDBRemoves(this.impGeofootprintVarService.filterBy (gvar => gvar.gtaId === gvar.gtaId && gvar['baseStatus'] === DAOBaseStatus.DELETE, (geoVar) => this.impGeofootprintVarService.getTreeRemoveCount(geoVar), false, true, true), false, false);
         }
/*
         // DEBUG: Get the list of children to remove.
         impGeofootprintGeoRemoves = this.impGeofootprintGeoService.dbRemoves.filter(geo  => geo.gtaId  === ta.gtaId);
         impGeofootprintVarRemoves = this.impGeofootprintVarService.dbRemoves.filter(gvar => gvar.gtaId === ta.gtaId);
         console.log("impGeofootprintTradeAreaRemoves removes: ", impGeofootprintTradeAreaRemoves);
         console.log("impGeofootprintGeo removes: ", impGeofootprintGeoRemoves);
         console.log("impGeofootprintVar removes: ", impGeofootprintVarRemoves);*/
      });

      if (doPost)
      {
         // Clone the parents as a base for the payload
         let removesPayload: ImpGeofootprintTradeArea[] = JSON.parse(JSON.stringify(impGeofootprintTradeAreaRemoves));

         // Prune out just the deletes and unchanged from the parents and children
         removesPayload = this.prune(removesPayload, ta => ta.baseStatus == DAOBaseStatus.DELETE || ta.baseStatus === DAOBaseStatus.UNCHANGED);

         return Observable.create(observer => {
            this.postDBRemoves('Targeting', 'ImpGeofootprintTradeArea', 'v1', removesPayload) // impGeofootprintTradeAreaRemoves)
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
