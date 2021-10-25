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
import { Injectable } from '@angular/core';
import { simpleFlatten } from '@val/common';
import { EMPTY, Observable } from 'rxjs';
import { map, reduce, tap } from 'rxjs/operators';
import { RestResponse } from '../../../../worker-shared/data-model/core.interfaces';
import { DAOBaseStatus } from '../../../../worker-shared/data-model/impower.data-model.enums';
import { AppConfig } from '../../../app.config';
import { UserService } from '../../../services/user.service';
import { DataStore } from '../../common/services/datastore.service';
import { LoggingService } from '../../common/services/logging.service';
import { RestDataService } from '../../common/services/restdata.service';
import { TransactionManager } from '../../common/services/TransactionManager.service';
import { ImpProject } from '../models/ImpProject';
import { ImpGeofootprintMasterService } from './ImpGeofootprintMaster.service';
import { ImpProjectPrefService } from './ImpProjectPref.service';

const restUrl = 'v1/targeting/base/';
const dataUrl = restUrl + 'impproject/load';
const packUrl = restUrl + 'impprojectmsgpack/load';

@Injectable({ providedIn: 'root' })
export class ImpProjectService extends DataStore<ImpProject>
{
   constructor(transactionManager: TransactionManager,
               restDataService: RestDataService,
               private appConfig: AppConfig,
               private userService: UserService,
               private impProjectPrefService: ImpProjectPrefService,
               private impGeofootprintMasterService: ImpGeofootprintMasterService,
               logger: LoggingService) {
      super(restDataService, dataUrl, logger, transactionManager, 'ImpProject');
   }

   load(items: ImpProject[]) : void {
     // load the data stores
     this.transactionManager.startTransaction();
     super.load(items);
     this.impProjectPrefService.load(simpleFlatten(items.map(p => p.impProjectPrefs)));
     this.impGeofootprintMasterService.load(simpleFlatten(items.map(p => p.impGeofootprintMasters)));
     this.transactionManager.stopTransaction();
   }

   loadFromServer(id: number) : Observable<ImpProject> {
     if (id == null) return EMPTY;
     return this.loadPackedFromServer(id).pipe(
       map(response => new ImpProject(response.payload)),
       reduce((acc, curr) => [...acc, curr], [] as ImpProject[]),
       tap(payload => {
         payload.forEach(p => {
           p.convertToModel();
           // as long as we're deleting everything prior to a save, everything has to be
           // tagged as 'UPDATE' (for existing entities) or 'INSERT' (for new entities)
           p.setTreeProperty('baseStatus', DAOBaseStatus.UPDATE);
         });
         this.load(payload);
       }),
       map(payload => payload[0])
     );
   }

   private loadPackedFromServer(id: number) : Observable<RestResponse<ImpProject>> {
     return this.rest.getMessagePack<ImpProject>(`${packUrl}/${id}`);
   }

   private loadStringifiedFromServer(id: number) : Observable<RestResponse<ImpProject>> {
     return this.rest.get<ImpProject>(`${dataUrl}/${id}`);
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
         project.impGeofootprintMasters = this.impGeofootprintMasterService.prune(project.impGeofootprintMasters,
             master => master.projectId === project.projectId && (master.baseStatus === DAOBaseStatus.UNCHANGED || master.baseStatus === DAOBaseStatus.DELETE));
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

         return new Observable(observer => {
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
