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
import { TransactionManager } from '../../common/services/TransactionManager.service';
import { AppConfig } from '../../../app.config';
import { ImpProject } from '../models/ImpProject';
import { RestDataService } from '../../common/services/restdata.service';
import { DataStore } from '../../common/services/datastore.service';
import { Injectable } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { Observable, EMPTY } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { DAOBaseStatus } from '../../api/models/BaseModel';
import { ImpProjectPrefService } from './ImpProjectPref.service';
import { ImpGeofootprintMasterService } from './ImpGeofootprintMaster.service';
import { ImpProjectVarService } from './ImpProjectVar.service';
import { simpleFlatten } from '@val/common';

const restUrl = 'v1/targeting/base/impproject/';
const dataUrl = restUrl + 'load';

@Injectable()
export class ImpProjectService extends DataStore<ImpProject>
{
   constructor(transactionManager: TransactionManager,
               restDataService: RestDataService,
               private appConfig: AppConfig,
               private userService: UserService,
               private impProjectPrefService: ImpProjectPrefService,
               private impProjectVarService: ImpProjectVarService,
               private impGeofootprintMasterService: ImpGeofootprintMasterService)
   {
      super(restDataService, dataUrl, transactionManager, 'ImpProject');
   }

   load(items: ImpProject[]) : void {
     // load the data stores
     super.load(items);
     this.impProjectVarService.load(simpleFlatten(items.map(p => p.impProjectVars)));
     this.impProjectPrefService.load(simpleFlatten(items.map(p => p.impProjectPrefs)));
     this.impGeofootprintMasterService.load(simpleFlatten(items.map(p => p.impGeofootprintMasters)));
   }

   loadFromServer(id: number) : Observable<number> {
     if (id == null) return EMPTY;
     return Observable.create(observer => {
       const loadCache: ImpProject[] = [];
       this.rest.get(`${dataUrl}/${id}`).subscribe(
         response => loadCache.push(new ImpProject(response.payload)),
         err => observer.error(err),
         () => {
           loadCache.forEach(p => {
             p.convertToModel();
             // as long as we're deleting everything prior to a save, everything has to be
             // tagged as 'UPDATE' (for existing entities) or 'INSERT' (for new entities)
             p.setTreeProperty('baseStatus', DAOBaseStatus.UPDATE);
           });
           this.load(loadCache);
           observer.next(id);
           observer.complete();
         }
       );
     });
   }

   // Get a count of DB removes from children of these parents
   public getTreeRemoveCount(impProjects: ImpProject[]) : number {
      let count: number = 0;
      impProjects.forEach(impProject => {
         count += this.dbRemoves.filter(remove => remove.projectId === impProject.projectId).length;
         count += this.impProjectPrefService.getTreeRemoveCount(this.impProjectPrefService.get().filter(pref => pref.projectId === impProject.projectId).concat
                                                               (this.impProjectPrefService.dbRemoves.filter(pref => pref.projectId === impProject.projectId)));
         count += this.impGeofootprintMasterService.getTreeRemoveCount(this.impGeofootprintMasterService.get().filter(ma => ma.projectId === impProject.projectId).concat
                                                                      (this.impGeofootprintMasterService.dbRemoves.filter(ma => ma.projectId === impProject.projectId)));
      });
      return count;
   }

   // After DB removes have be executed, complete them by removing them from the data stores delete list
   public completeDBRemoves(completes: ImpProject[]) {
      completes.forEach(complete => {
         this.impProjectPrefService.completeDBRemoves(this.impProjectPrefService.get().filter(pref => pref.projectId === complete.projectId));
         this.impGeofootprintMasterService.completeDBRemoves(this.impGeofootprintMasterService.get().filter(ma => ma.projectId === complete.projectId));
      });

      this.clearDBRemoves(completes);
   }

   // Return a tree of source nodes where they and their children are in the UNCHANGED or DELETE status
   public prune(source: ImpProject[], filterOp: (impProject: ImpProject) => boolean) : ImpProject[]
   {
      if (source == null || source.length === 0)
         return source;

      const result: ImpProject[] = source.filter(filterOp).filter(tree => this.getTreeRemoveCount([tree]) > 0);

      // TODO: Pretty sure I can use the filterOp below
      result.forEach (project => {
         project.impGeofootprintMasters = this.impGeofootprintMasterService.prune(project.impGeofootprintMasters, master => master.projectId === project.projectId && (master.baseStatus === DAOBaseStatus.UNCHANGED || master.baseStatus === DAOBaseStatus.DELETE));
      });

      return result;
   }

   // Process all of the removes, ensuring that children of removes are also removed and optionally performing the post
   public performDBRemoves(removes: ImpProject[], doPost: boolean = true, mustRemove: boolean = false) : Observable<number>
   {
      let impProjectRemoves:      ImpProject[] = [];

      // Prepare database removes for all children
      removes.forEach(project => {
         // If a root level removal or if a direct parent was removed, flag this object for removal
         if (mustRemove)
            this.remove(project);

         // Determine if the parent is already in the remove list
         const parentRemove: boolean = this.dbRemoves.includes(project);

         // Parent gets added to removes even if not being deleted to act as a container
         if (parentRemove)
            impProjectRemoves = impProjectRemoves.concat(this.dbRemoves.filter(removeProject => removeProject.projectId === project.projectId));
         else
            impProjectRemoves.push(project);

         // Parent is being removed, all children must be removed as well
         if (parentRemove)
         {
            this.impProjectPrefService.performDBRemoves(this.impProjectPrefService.get().filter(pref => pref.projectId === project.projectId), false, true);
            this.impGeofootprintMasterService.performDBRemoves(this.impGeofootprintMasterService.get().filter(ma => ma.projectId === project.projectId), false, true);
         }
         else
         // Parent is not being removed, only children already marked for removal will be deleted
         {
            this.impProjectPrefService.performDBRemoves       (this.impProjectPrefService.filterBy       (pref => pref.projectId === project.projectId, (pref) => this.impProjectPrefService.getTreeRemoveCount(pref),      false, true, true), false, false);
            this.impGeofootprintMasterService.performDBRemoves(this.impGeofootprintMasterService.filterBy(ma   => ma.projectId   === project.projectId, (ma)   => this.impGeofootprintMasterService.getTreeRemoveCount(ma), false, true, true), false, false);
         }
      });

      if (doPost)
      {
         // Clone the parents as a base for the payload
         let removesPayload: ImpProject[] = JSON.parse(JSON.stringify(impProjectRemoves));

         // Prune out just the deletes and unchanged from the parents and children
         removesPayload = this.prune(removesPayload, ta => ta.baseStatus == DAOBaseStatus.DELETE || ta.baseStatus === DAOBaseStatus.UNCHANGED);

         return Observable.create(observer => {
            this.postDBRemoves('Targeting', 'ImpProject', 'v1', removesPayload)
               .subscribe(postResultCode => {
                  console.log('post completed, calling completeDBRemoves');
                  this.completeDBRemoves(impProjectRemoves);
                  observer.next(postResultCode);
               }
               , err => observer.error(err)
               , ()  => observer.complete());
         });
      }
      else
         return EMPTY;
   }

   public postDelete(projectId: number, apiVersion: string = 'v1') : Observable<number>
   {
      console.log(this.storeName + '.service.postDelete - fired');

      if (projectId == null || projectId === 0) {
         console.log('Cannot delete an invalid project_id: ', projectId);
         return EMPTY;
      }

      const postUrl: string = apiVersion.toLowerCase() + '/targeting/base/impproject/delete/';

      let resultObs: Observable<number>;
      try
      {
         console.log('Deleting projectId: ', projectId, ' url: ' + postUrl);

         resultObs = this.rest.delete(postUrl, projectId)
                              .pipe(tap(restResponse => {
                                       console.log (projectId + ' delete response:', restResponse, ' (', ((restResponse.returnCode === 200) ? 'success' : 'failure') , ')');
                                    })
                                    , map(restResponse => restResponse.returnCode)
                                    );
     }
     catch (error)
     {
        console.error(this.storeName, '.service.postDelete - Error: ', error);
        this.transactionManager.stopTransaction();
        // resultObs = throwError(error);
     }

     return resultObs;
   }

}
