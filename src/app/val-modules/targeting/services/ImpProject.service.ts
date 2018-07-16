import { ImpGeofootprintGeo } from './../models/ImpGeofootprintGeo';
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
import { AppProjectService } from '../../../services/app-project.service';
import { TransactionManager } from '../../common/services/TransactionManager.service';
import { AppConfig } from '../../../app.config';
import { ImpProject } from '../models/ImpProject';
import { RestDataService } from '../../common/services/restdata.service';
import { DataStore } from '../../common/services/datastore.service';
import { Injectable } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { Observable, EMPTY, Subject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ImpProjectPref } from '../models/ImpProjectPref';
import { DAOBaseStatus } from '../../api/models/BaseModel';
import { ImpProjectPrefService } from './ImpProjectPref.service';
import { ImpGeofootprintMasterService } from './ImpGeofootprintMaster.service';
import { ImpGeofootprintMaster } from './../models/ImpGeofootprintMaster';
import { simpleFlatten, completeFlatten } from '../../common/common.utils';

const restUrl = 'v1/targeting/base/impproject/';
const dataUrl = restUrl + 'load';

@Injectable()
export class ImpProjectService extends DataStore<ImpProject>
{
   constructor(public appConfig: AppConfig,
               public userService: UserService,
               public transactionManager: TransactionManager,
               public impProjectPrefService: ImpProjectPrefService,
               public impGeofootprintMasterService: ImpGeofootprintMasterService,
               private restDataService: RestDataService,
               private appProjectService: AppProjectService)
   {
      super(restDataService, dataUrl, transactionManager, 'ImpProject');
   }

   loadProject(projectId: number, clearStore: boolean = false) : Observable<ImpProject>
   {
      return this.appProjectService.loadProject(projectId, clearStore).pipe(
        map(projects => {
          console.log('ImpProject.service.loadProject - load from AppProjectService finished');
          this.replace(projects);
          this.appProjectService.populateDataStores(projects[0]);
          return projects[0];
        }),
        tap(project => console.log("loadProject complete") /*this.replace([project])*/)
      );
   }

  /* saveProject()
   {
      console.log('ImpProject.service.saveProject fired');
      this.appProjectService.debugLogStoreCounts();
      this.appProjectService.saveProject(this.get()[0]).subscribe(savedProject => {
         if (savedProject != null)
         {
            console.log('AFTER SAVE');
            this.appProjectService.debugLogStoreCounts();

            // TODO: Need to check app-project.service, reloadProject. Does the concatMap turn it into a hot observable?
            //       This is not ideal code, the app-project.service should be doing it.
            this.loadProject(savedProject[0].projectId, true).subscribe(saved_project => {
               console.log("Reloaded projectId: ", (savedProject != null && savedProject.length > 0) ? savedProject[0].projectId : null);
            });
         }
         else
            console.log('project did not save');
      });
   }*/

   saveProject() : Observable<ImpProject>
   {
      const  observer = new Subject<ImpProject>();
      console.log('ImpProject.service.saveProject fired');
      this.appProjectService.debugLogStoreCounts();
      this.appProjectService.saveProject(this.get()[0]).subscribe(savedProject => {
         if (savedProject != null)
         {
            console.log('AFTER SAVE');
            this.appProjectService.debugLogStoreCounts();

            // TODO: Need to check app-project.service, reloadProject. Does the concatMap turn it into a hot observable?
            //       This is not ideal code, the app-project.service should be doing it.
            this.loadProject(savedProject[0].projectId, true).subscribe(saved_project => {  
               console.log('Reloaded projectId: ', (savedProject != null && savedProject.length > 0) ? savedProject[0].projectId : null);
               observer.next(saved_project);
               observer.complete();
            });
         }
         else{
          console.log('project did not save');
          observer.error('Project did not save');
         }
          
      });

      return observer.asObservable();
   }

   saveProjectObs() : Observable<ImpProject[]> {
      const saveObservable = new Observable<ImpProject[]>((observer) =>
      {
         this.saveProject();
// TODO: Fix this to get projectId in the metric         observer.next([this.get()]);
         observer.complete();
      });
      return saveObservable;
   }

   public removeGeosFromHierarchy(removeGeos: ImpGeofootprintGeo[]) {
      console.log("Removing geos from the hierarchy", removeGeos);
      this.appProjectService.removeGeosFromHierarchy(this.get()[0], removeGeos);
   }

   // Get a count of DB removes from children of these parents
   public getTreeRemoveCount(impProjects: ImpProject[]): number {
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

      // Delete geos from the hierarchy
      completes.forEach(complete => {
         const geosToRemove: ImpGeofootprintGeo[] = completeFlatten(complete
            .impGeofootprintMasters
            .map(master   => master.impGeofootprintLocations
            .map(location => location.impGeofootprintTradeAreas
            .map(ta       => ta.impGeofootprintGeos = ta.impGeofootprintGeos
            .filter(geo   => geo.baseStatus === DAOBaseStatus.DELETE)))));      
         this.removeGeosFromHierarchy(geosToRemove);   
      });
   }

   // Return a tree of source nodes where they and their children are in the UNCHANGED or DELETE status
   public prune(source: ImpProject[], filterOp: (impProject: ImpProject) => boolean): ImpProject[]
   {
      if (source == null || source.length === 0)
         return source;

      let result: ImpProject[] = source.filter(filterOp).filter(tree => this.getTreeRemoveCount([tree]) > 0);

      // TODO: Pretty sure I can use the filterOp below
      result.forEach (project => {
         project.impGeofootprintMasters = this.impGeofootprintMasterService.prune(project.impGeofootprintMasters, master => master.projectId === project.projectId && (master.baseStatus === DAOBaseStatus.UNCHANGED || master.baseStatus === DAOBaseStatus.DELETE));
      })

      return result;
   }

   // Process all of the removes, ensuring that children of removes are also removed and optionally performing the post
   public performDBRemoves(removes: ImpProject[], doPost: boolean = true, mustRemove: boolean = false) : Observable<number>
   {
      let impProjectRemoves:      ImpProject[] = [];
      let impProjectPrefsRemoves: ImpProjectPref[] = [];
      let impMasterRemoves:       ImpGeofootprintMaster[] = [];

      // Prepare database removes for all children
      removes.forEach(project => {
         // If a root level removal or if a direct parent was removed, flag this object for removal
         if (mustRemove)
            this.remove(project);

         // Determine if the parent is already in the remove list
         let parentRemove: boolean = this.dbRemoves.includes(project);

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

/*
         // DEBUG: Get the list of children to remove.
         impProjectPrefsRemoves = this.impProjectPrefService.dbRemoves.filter(pref => pref.projectId === project.projectId);
         impMasterRemoves       = this.impGeofootprintMasterService.dbRemoves.filter(ma => ma.projectId === project.projectId);
         console.log("impProject             removes: ", impProjectRemoves);
         console.log("impProjectPrefsRemoves removes: ", impProjectPrefsRemoves);
         console.log("impMasterRemoves       removes: ", impMasterRemoves);*/
      });

      // const geosToRemovex = simpleFlatten(tradeAreas.map(ta => ta.impGeofootprintGeos));

      if (doPost)
      {
         // Clone the parents as a base for the payload
         let removesPayload: ImpProject[] = JSON.parse(JSON.stringify(impProjectRemoves));

         // Prune out just the deletes and unchanged from the parents and children
         removesPayload = this.prune(removesPayload, ta => ta.baseStatus == DAOBaseStatus.DELETE || ta.baseStatus === DAOBaseStatus.UNCHANGED);

         let performDBRemoves$ = Observable.create(observer => {
            this.postDBRemoves("Targeting", "ImpProject", "v1", removesPayload)
                .subscribe(postResultCode => {
                     console.log("post completed, calling completeDBRemoves");
                     this.completeDBRemoves(impProjectRemoves);
                     observer.next(postResultCode);
                     observer.complete();
                  });
         });

         return performDBRemoves$;
      }
      else
         return EMPTY;
   }   
}
