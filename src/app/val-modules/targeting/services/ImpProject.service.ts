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
import { filter } from 'rxjs/operators';
import { AppProjectService } from './../../../services/app-project.service';
import { TransactionManager } from './../../common/services/TransactionManager.service';
import { InTransaction } from './../../common/services/datastore.service'
import { AppMessagingService } from './../../../services/app-messaging.service';
import { AppConfig } from '../../../app.config';
import { ImpProject } from '../models/ImpProject';
import { RestDataService } from './../../common/services/restdata.service';
import { DataStore } from '../../common/services/datastore.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserService } from '../../../services/user.service';
import { HttpClient } from '@angular/common/http';

let restUrl = 'v1/targeting/base/impproject/';
let dataUrl = restUrl + 'load';

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

   public trackerId: string;

   private handleError(error: Response)
   {
      const errorMsg = `Status code: ${error.status} on url ${error.url}`;
      console.error(errorMsg);
      return Observable.throw(errorMsg);
   }

   loadProject(projectId: number, clearStore: boolean = false)
   {
      this.appProjectService.loadProject(projectId, clearStore).subscribe((projects: ImpProject[]) => {
         console.log('ImpProject.service.loadProject - load from AppProjectService finished');
         const loadedProject = new ImpProject(projects[0]);
         loadedProject.convertToModel();

         /* EXAMPLES OF HOW TO USE THE NEW TRANSIENTS
         console.log("project geos:", loadedProject.impGeofootprintGeos);
         console.log("project impGeofootprintLocations: ", loadedProject.impGeofootprintLocations);
         console.log("project impGeofootprintLocAttribs: ", loadedProject.impGeofootprintLocAttribs);
         console.log("project impGeofootprintTradeAreas: ", loadedProject.impGeofootprintTradeAreas);
         console.log("master impGeofootprintTradeAreas", loadedProject.impGeofootprintMasters[0].impGeofootprintTradeAreas);
         console.log("master impGeofootprintGeos: ", loadedProject.impGeofootprintMasters[0].impGeofootprintGeos);
         console.log("master transient parent: ", loadedProject.impGeofootprintMasters[0].impProject);
         console.log("geo transient parent: ", loadedProject.impGeofootprintMasters[0].impGeofootprintLocations[0].impGeofootprintTradeAreas[0].impGeofootprintGeos[0].impGeofootprintTradeArea); */
         this.replace([loadedProject]);

         if (projects[0].projectTrackerId != null)
             this.trackerId = projects[0].projectTrackerId.toString();
         this.replace(projects);
      });
   }

   saveProject()
   {
      console.log('ImpProject.service.saveProject fired');
      console.log('BEFORE SAVE');
      this.appProjectService.debugLogStoreCounts();
      this.appProjectService.saveProject(this.get()[0]).subscribe(savedProject => {
         if (savedProject != null)
         {
            console.log('project saved', savedProject);
            console.log('BEFORE REPLACE STORE FROM SAVE');
            this.appProjectService.debugLogStoreCounts();
            this.replace(savedProject);
            console.log('AFTER SAVE');
            this.appProjectService.debugLogStoreCounts();
         }
         else
            console.log('project did not save');
      });
   }
}