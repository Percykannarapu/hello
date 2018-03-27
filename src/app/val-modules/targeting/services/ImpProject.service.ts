import { ImpDiscoveryService } from './../../../services/ImpDiscoveryUI.service';
import { ImpProjectPrefService } from './ImpProjectPref.service';
import { ImpClientLocationService } from './../../client/services/ImpClientLocation.service';
/** A TARGETING domain data service representing the table: IMPOWER.IMP_PROJECTS
 **
 ** This class contains code operates against data in its data store.
 ** See the contents of val-modules/common/services/datastore.service.ts to see built in
 ** methods that all data services have.
 **
 ** NOTE: This class is generated only once and may be updated by developers.
 **
 ** ImpProject.service.ts generated from VAL_ENTITY_GEN - v2.0
 **/

import { ImpProject } from '../models/ImpProject';
import { RestDataService } from './../../common/services/restdata.service';
import { DataStore } from '../../common/services/datastore.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { DAOBaseStatus } from '../../api/models/BaseModel';
import { UserService } from '../../../services/user.service';
import { ImpGeofootprintMaster } from '../models/ImpGeofootprintMaster';
import { ImpGeofootprintLocation } from '../models/ImpGeofootprintLocation';
import { ImpGeofootprintLocationService } from './ImpGeofootprintLocation.service';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { RestResponse } from '../../../models/RestResponse';
import { ImpDiscoveryUI } from '../../../models/ImpDiscoveryUI';

let restUrl = 'v1/targeting/base/impproject/'; 
let dataUrl = restUrl + 'search?q=impProject';

@Injectable()
export class ImpProjectService extends DataStore<ImpProject>
{
   constructor(public impClientLocationService: ImpClientLocationService,
               public impProjectPrefService: ImpProjectPrefService,
               public impGeofootprintLocationService: ImpGeofootprintLocationService,
               public impDiscoveryService: ImpDiscoveryService,
               public userService: UserService,
               private http: HttpClient,               
               private restDataService: RestDataService) {super(restDataService, dataUrl); }

   private handleError(error: Response)
   {
      const errorMsg = `Status code: ${error.status} on url ${error.url}`;
      console.error(errorMsg);
      return Observable.throw(errorMsg);
   }

   loadProject(projectId: number, clearStore: boolean = false)
   {
      console.log('ImpProject.service.loadProject - fired');
      this.debugLogStore('PROJECTS');
      
      this.dataUrl = restUrl + 'load/' + projectId;
//      this.dataUrl = restUrl + 'search?q=impProject&projectId=' + projectId;
      this.get(true,true, p => this.onBeforeLoadProject(p), p => this.populateLocations(p));

      //      console.log ('ImpProject.service.loadProject - dataUrl: ' + dataUrl);
//      this.impGeofootprintLocationService.debugLogStore("RIGHT AFTER GET", true);
//      this.debugLogStore('LOCATIONS', true);

      // Alternate solution
      // this.storeObservable.subscribe(projectData => this.populateLocations(projectData));
   }

   onBeforeLoadProject(projects: ImpProject[]): boolean
   {
      console.log('########  ImpProject.service.onBeforeLoadProjectFired', projects);
      return true;
   }

   populateLocations(projects: ImpProject[]) //: ImpProject[]
   {
      if (projects && projects.length > 0)
      {
         console.log('#######  ImpProject.service.populateLocations - fired', projects);
//         console.log('projects = ' + JSON.stringify(projects));
         console.log('projects = null: ' + (projects) ? true : false);
         console.log('projects.length = ' + projects.length);
         console.log('ImpProject.service.populateLocations - Project loaded successfully');
         // const impProject: ImpProject = this.get(true,true)[0];

         // // Put the locations into the location service
         console.log('projects == null: ' + (projects == null) ? true : false);
         console.log('projects.length = ', projects.length);
//         console.log('projects[0] = ', JSON.stringify(projects[0]));
//         console.log('projects[0].impGeofootprintMasters = ', JSON.stringify(projects[0].impGeofootprintMasters));
//         console.log('projects[0].impGeofootprintMasters.locations = ', JSON.stringify(projects[0].impGeofootprintMasters[0].impGeofootprintLocations));
//         console.log('###### About to print data store');
         if (this == null)
            console.log('this is null');
         else
         {
            if (this.impGeofootprintLocationService == null)
               console.log('this.impGeofootprintLocationService is null');
            else
               console.log('Apparently, nothing is null');
//            this.impGeofootprintLocationService.replace(projects[0].impGeofootprintMasters[0].impGeofootprintLocations);
               this.impGeofootprintLocationService.add(projects[0].impGeofootprintMasters[0].impGeofootprintLocations);
            }
         return projects;
      }
      else
         return projects;
   }

   // Test Persisting the Project
   //   This is just proving out converting the typescript models
   //   to a JSON string and posting to the back end save endpoint
   //   will persist to the database
   // TODO: if we allow for more than one project loaded, specify the project to save
   saveProject()
   {
      console.log('discovery-input-component - saveProject fired');

      // Retrieve the project from the datastore (Right now assuming only 1)
      let impProject: ImpProject = this.get()[0];
      console.log ('Saving project: ', impProject.toString());

      // Retrieve the discovery data
      let impDiscoveryUI: ImpDiscoveryUI =  this.impDiscoveryService.get()[0];

      // Geofootprint
      // TODO: We really do not want to create a new CGM each time
      console.log('ImpProject.service - populating geofootprint master');
      if (!impProject.impGeofootprintMasters)
         impProject.impGeofootprintMasters = new Array<ImpGeofootprintMaster>();

      if (impProject.impGeofootprintMasters.length === 0)
      {
         let newCGM: ImpGeofootprintMaster = new ImpGeofootprintMaster();
         newCGM.dirty = true;
         newCGM.baseStatus = (impProject.projectId) ? DAOBaseStatus.UPDATE : DAOBaseStatus.INSERT;
         newCGM.methAnalysis = (impDiscoveryUI.analysisLevel) ? impDiscoveryUI.analysisLevel : 'ZIP';  // Mandatory field
         newCGM.status = 'SUCCESS';
         newCGM.summaryInd = 0;
         newCGM.createdDate = new Date(Date.now());
         newCGM.isMarketBased = false;
         newCGM.isActive = true;
         newCGM.impGeofootprintLocations = new Array<ImpGeofootprintLocation>();
         impProject.impGeofootprintMasters.push(newCGM);
      }

      // TODO: Really the project service should be utilized and as locations are added, they become children of the project
      console.log('ImpProject.service - populating locations');
      impProject.impGeofootprintMasters[0].impGeofootprintLocations = this.impGeofootprintLocationService.get();

      // Problem is, we need trade areas under the locations
      // TODO: This should be coming from the ImpGeofootprintTradeAreaService

      let locNumber: number = 1000;
      for (let location of impProject.impGeofootprintMasters[0].impGeofootprintLocations)
      {
         location.baseStatus = (location.glId) ? DAOBaseStatus.UPDATE : DAOBaseStatus.INSERT;
//       location.isActive = true;
//       location.locationNumber = locNumber++;            // Mandatory field, stubbing
         location.clientIdentifierId = location.locationNumber; // Mandatory field, stubbing
         location.marketName = 'Test Market ' + locNumber; // Mandatory field, stubbing
         console.log('location: ', location);
      }
      console.log('ImpProject.service - pushing new geofootprint');

// TODO:
// We now know that the typescript model needs to mirror the base model if we expect to use JSON.stringify (We definitely want to)
// need to alter the typescript models to emit booleans for the "is" variables
// The Java Base DAOs need to be altered.  The mapToEntity is not mapping the other foreign keys
// from the parent.  ie. ImpGeofootprintGeos isn't getting cgmId, glId or projectId mapped.  Only its immediate parent, the gtaId is.
// See:  https://stackoverflow.com/questions/23412408/how-do-i-get-hibernate-spring-jpa-to-auto-update-the-id-of-a-new-entity
// But we are going to let that slide for now.   It will persist fine without these IDs, but NEED to fix down the road.
// Update: Can make base services request the pks explicitly, then they will transfer to the children

      // Convert the Typescript models into a JSON string
      console.log('discovery-input-component populating posting');
      const payload: string = JSON.stringify(impProject);
      console.log('payload', payload);

      // Prepare HTTP Headers
      const headers = new HttpHeaders()
     .set('Content-Type', 'application/json');

      // TODO: Need to implement save in the data store
      this.http.post<RestResponse>('https://servicesdev.valassislab.com/services/v1/targeting/base/impproject/save', payload, { headers: headers }).subscribe(result => {
         console.log ('result: ', result);
         if (result.returnCode === 200)
         {
            if (impProject.projectId == null)
            {
               impProject.projectId = result.payload;
               console.log('saveProject - created new projectId: ' + impProject.projectId);
            }
            else
               console.log('saveProject - updated projectId: ' + result.payload);
         }
      });
   }
   
}