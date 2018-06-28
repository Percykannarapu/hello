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
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';


const restUrl = 'v1/targeting/base/impproject/';
const dataUrl = restUrl + 'load';

@Injectable()
export class ImpProjectService extends DataStore<ImpProject>
{
   constructor(public appConfig: AppConfig,
               public userService: UserService,
               public transactionManager: TransactionManager,
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

   saveProject()
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
            })
         }
         else
            console.log('project did not save');
      });
   }
}
