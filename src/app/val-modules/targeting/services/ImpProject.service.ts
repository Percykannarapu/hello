import { AppMessagingService } from './../../../services/app-messaging.service';
import { ImpGeofootprintMasterService } from './ImpGeofootprintMaster.service';
import { ImpClientLocationType } from './../../client/models/ImpClientLocationType';
import { ImpClientLocation } from './../../client/models/ImpClientLocation';
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
import { ClientIdentifierType } from '../../mediaexpress/models/ClientIdentifierType';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/observable/forkJoin';

let restUrl = 'v1/targeting/base/impproject/'; 
let dataUrl = restUrl + 'load';
// let dataUrl = restUrl + 'search?q=impProject';

@Injectable()
export class ImpProjectService extends DataStore<ImpProject>
{
   constructor(public impClientLocationService: ImpClientLocationService,
               public impProjectPrefService: ImpProjectPrefService,
               public impGeofootprintMasterService: ImpGeofootprintMasterService,
               public impGeofootprintLocationService: ImpGeofootprintLocationService,
               public impDiscoveryService: ImpDiscoveryService,
               public userService: UserService,
               private http: HttpClient,
               private restDataService: RestDataService,
               private appMessagingService: AppMessagingService) {super(restDataService, dataUrl); }

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

      this.appMessagingService.startSpinnerDialog('PROJECTLOAD', 'Loading project ' + projectId);
      this.dataUrl = restUrl + 'load/' + projectId;

      // Clear out the decentralized data stores
      this.impGeofootprintLocationService.clearAll(true);
      this.impGeofootprintMasterService.clearAll(true);      

      this.get(true, true).subscribe(res => {
         this.populateLocations(res);
         this.appMessagingService.stopSpinnerDialog('PROJECTLOAD');
         this.appMessagingService.showGrowlSuccess('Project Load', 'Project ' + projectId + ' loaded successfully!');         
      }, err =>
      {
         // Alert the user to the failed load
         this.appMessagingService.showGrowlError('Project Load', 'Project failed to load.');
         this.appMessagingService.stopSpinnerDialog('PROJECTLOAD');
         console.warn('Error loading project', err);
      });

      // TODO: Should we handle onBeforeLoad?
      // this.get(true,true, p => this.onBeforeLoadProject(p), p => this.populateLocations(p));
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

   public setDataUrl (newDataUrl: string)
   {
      this.dataUrl = restUrl + newDataUrl;
   }

     /**
   * Parse the response from the registration request that was sent to the API gateway
   * @returns A HTTP Authorization header that can be used in the token request to the API gateway
   */
//   private parseRegistrationResponse(registrationResponse: RegistrationResponse) : HttpHeaders {
//       this.clientId = registrationResponse.clientId;
//       this.clientSecret = registrationResponse.clientSecret;
//       return new HttpHeaders().set('Authorization', 'Basic ' + btoa(registrationResponse.clientId + ':' + registrationResponse.clientSecret));
//    }

   private _createClientLocations(impClientLocations: Array<ImpClientLocation>) : Array<Observable<RestResponse>>
   {
      let observableArray = new Array<Observable<RestResponse>>();

      for (let clientLocation of impClientLocations)
         observableArray.push(this.restDataService.post('v1/client/base/impclientlocation/save', JSON.stringify(clientLocation)));

      return observableArray;
//      return this.restDataService.post('v1/client/base/impclientlocation/save', JSON.stringify(clientLocation));
//      this.http.post<RestResponse>('https://servicesdev.valassislab.com/services/v1/client/base/impclientlocation/save'
//      ,clientLocation, { headers: headers }).subscribe(result => {});
   }

//   private _createLocation(impGeofootprintLocation: ImpGeofootprintLocation) : Observable<RestResponse> {
//      return this.restDataService.post('v1/targeting/base/impGeofootprintlocation/save', JSON.stringify(impGeofootprintLocation));
//   }
   
   private _createProject(impProject: ImpProject) : Observable<RestResponse> {
      return this.restDataService.post('v1/targeting/base/impproject/save', JSON.stringify(impProject));
//    this.http.post<RestResponse>('https://servicesdev.valassislab.com/services/v1/targeting/base/impproject/save'
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

      // Create Geofootprint Array if needed
      console.log('ImpProject.service - populating geofootprint master');
      if (!impProject.impGeofootprintMasters)
         impProject.impGeofootprintMasters = new Array<ImpGeofootprintMaster>();

      // Create ImpGeofootprintMaster if needed
      if (impProject.impGeofootprintMasters.length === 0)
      {
         let newCGM: ImpGeofootprintMaster = new ImpGeofootprintMaster();
         newCGM.dirty = true;
         newCGM.baseStatus = (impProject.projectId != null) ? DAOBaseStatus.UPDATE : DAOBaseStatus.INSERT;
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

      // Loop through locations, setting missing mandatory fields and setting baseStatus
      let locNumber: number = 1000;
      for (let location of impProject.impGeofootprintMasters[0].impGeofootprintLocations)
      {
         console.log('location glId: ', location.glId, ' setting baseStatus to: ', (location.glId != null) ? DAOBaseStatus.UPDATE : DAOBaseStatus.INSERT);
         location.baseStatus = (location.glId != null) ? DAOBaseStatus.UPDATE : DAOBaseStatus.INSERT;
//       location.isActive = true;
//       location.locationNumber = locNumber++;            // Mandatory field, stubbing
         location.clientIdentifierId = location.locationNumber; // Mandatory field, stubbing
         location.clientLocationId = location.locationNumber;   // Mandatory field, stubbing
         location.marketName = 'Test Market ' + locNumber; // Mandatory field, stubbing
         console.log('location: ', location);
      }

      // Add database removals
      if (this.impGeofootprintLocationService.dbRemoves != null && this.impGeofootprintLocationService.dbRemoves.length > 0)
      {
         console.log('impGeofootprintLocationService has ' + this.impGeofootprintLocationService.dbRemoves.length + ' removes');
         for (let removeLocation of this.impGeofootprintLocationService.dbRemoves)
            impProject.impGeofootprintMasters[0].impGeofootprintLocations.push(removeLocation);
      }
      else
         console.log('impGeofootprintLocationService had no database removes');

// TODO:
// We now know that the typescript model needs to mirror the base model if we expect to use JSON.stringify (We definitely want to)
// need to alter the typescript models to emit booleans for the "is" variables
// The Java Base DAOs need to be altered.  The mapToEntity is not mapping the other foreign keys
// from the parent.  ie. ImpGeofootprintGeos isn't getting cgmId, glId or projectId mapped.  Only its immediate parent, the gtaId is.
// See:  https://stackoverflow.com/questions/23412408/how-do-i-get-hibernate-spring-jpa-to-auto-update-the-id-of-a-new-entity
// But we are going to let that slide for now.   It will persist fine without these IDs, but NEED to fix down the road.
// Update: Can make base services request the pks explicitly, then they will transfer to the children

      // Prepare HTTP Headers
      const headers = new HttpHeaders().set('Content-Type', 'application/json');

      // TODO: Create typescript versions of clientIdentifierType and clientLocationType as we don't use these yet, but they are mandatory
      let clientIdentifierType = new ClientIdentifierType({clientIdentifierTypeCode: 'PROJECT_ID'
                                                          ,createUser:               -1
                                                          ,createDate:               new Date(Date.now())
                                                          ,modifyUser:               -1
                                                          ,modifyDate:               new Date(Date.now())
                                                          ,clientIdentifierType:     'Project ID'
                                                          ,description:              'Project Id'
                                                          ,sortOrder:                2
                                                          ,isActive:                 1
                                                          });
      let impClientLocationType = new ImpClientLocationType({clientLocationTypeCode: 'Site'
                                                            ,createUser:             -1
                                                            ,createDate:             new Date(Date.now())
                                                            ,modifyUser:             -1
                                                            ,modifyDate:             new Date(Date.now())
                                                            ,clientLocationType:     'Site'
                                                            ,sortOrder:              1
                                                            ,isDefault:              1
                                                            ,isActive:               1
                                                            });

/* Reinstate with constraint IMP_GEOFOOTPRINT_LOCATIONS_U01

      // We know we are creating client locations every time.  This is temporary
      let clientLocations = new Array<ImpClientLocation>();
      for (let location of impProject.impGeofootprintMasters[0].impGeofootprintLocations)
      {
         clientLocations.push (new ImpClientLocation({dirty: true
                                                     ,baseStatus: DAOBaseStatus.INSERT
                                                     ,clientLocationId:      null
                                                     ,clientIdentifierId:    location.locationNumber
                                                     ,clientIdentifierType:  clientIdentifierType
                                                     ,impClientLocationType: impClientLocationType
                                                     }));
      }

//      this._createClientLocations(clientLocations)

      // TEMPORARY: Create a ImpClientLocation row
      for (let location of impProject.impGeofootprintMasters[0].impGeofootprintLocations)
      {
         if (location.clientLocationId == null)
         {
            // ({fieldA: 'xyz', fieldB: 123});
            // let clientLocation = new ImpClientLocation({
            //    clientLocationId:      null
            //   ,clientIdentifierId:    location.locationNumber
            //   ,clientIdentifierType:  clientIdentifierType
            //   ,impClientLocationType: impClientLocationType
            // });

            //     return this.httpClient.post<RegistrationResponse>(this.config.oAuthParams.registerUrl, registrationPayload, { headers: headers })      
            //      .map(res => this.parseRegistrationResponse(res))
            //      .mergeMap(tokenHeaders => this.httpClient.post<TokenResponse>(this.config.oAuthParams.tokenUrl, tokenParams, { headers: tokenHeaders }));
            this._createClientLocation(location.locationNumber, clientIdentifierType, impClientLocationType).subscribe(res =>
            {
               // Assign clientLocation ids to the location

               // Persist the project
               this._createProject(impProject).subscribe(res =>
               {
                  // Load the project to get the IDs

               }
               ,err => {
                  console.warn('Error clientLocation ', clientLocation);
               });                     
            }
            ,err => {
               console.warn('Error clientLocation ', clientLocation);
            });
         }
         else
         // Handle case where client location exists, but need to persist the locations / project
         {

         }
      }
      console.log('ImpProject.service - pushing new geofootprint');
*/

      // .map(res => {
      //    this.clientId = registrationResponse.clientId;
      //    this.clientSecret = registrationResponse.clientSecret;
      //    return new HttpHeaders().set('Authorization', 'Basic ' + btoa(registrationResponse.clientId + ':' + registrationResponse.clientSecret));
      //    }
      //    .mergeMap(tokenHeaders => this.httpClient.post<TokenResponse>(this.config.oAuthParams.tokenUrl, tokenParams, { headers: tokenHeaders }));

      // Convert the Typescript models into a JSON string
      const payload: string = JSON.stringify(impProject);
      console.log('ImpProject payload', payload);

      impProject.baseStatus = (impProject.projectId != null) ? DAOBaseStatus.UPDATE : DAOBaseStatus.INSERT;

      // TODO: Need to implement save in the data store
      this.http.post<RestResponse>('https://servicesdev.valassislab.com/services/v1/targeting/base/impproject/save', payload, { headers: headers }).subscribe(result => {
         console.log ('result: ', result);
         if (result.returnCode === 200)
         {
//            if (impProject.projectId == null)
            {
               impProject.projectId = result.payload;
               console.log('saveProject - created new projectId: ' + impProject.projectId);

               this.clearAll(false);
               this.setDataUrl ('load/' + impProject.projectId);
               console.log('## RELOADING THE PROJECT');
               this.get(true).subscribe(res => {
                  console.log('Project Reloaded - Ok to save again: ');
                  this.debugLogStore('After Reload');
                  console.log('project point in time: ', res[0].toString());
                  impProject = res[0];
                  for (let location of impProject.impGeofootprintMasters[0].impGeofootprintLocations)
                  {
                     location.baseStatus = (location.glId != null) ? DAOBaseStatus.UPDATE : DAOBaseStatus.INSERT;
                     console.log('location: ' + location.locationNumber + ', baseStatus: ', location.baseStatus);
                  }

                  console.log('loaded project: ', JSON.stringify(impProject));
                  console.log('Loaded masters: ', (impProject != null && impProject.impGeofootprintMasters != null) ? JSON.stringify(impProject.impGeofootprintMasters) : null);
                  console.log('Loaded locations: ', (impProject != null && impProject.impGeofootprintMasters != null && impProject.impGeofootprintMasters[0].impGeofootprintLocations != null) ? JSON.stringify(impProject.impGeofootprintMasters[0].impGeofootprintLocations) : null);

                  // Database removals are applied, clear the list
                  this.impGeofootprintLocationService.clearDbRemoves();

                  // Deconstruct the project data into the separate data stores
                  this.impGeofootprintMasterService.replace(impProject.impGeofootprintMasters);
                  this.impGeofootprintLocationService.replace(impProject.impGeofootprintMasters[0].impGeofootprintLocations);

                  // Alert the user to the successful save
                  this.appMessagingService.showGrowlSuccess('Project Save', 'Project ' + impProject.projectId + ' saved successfully!');

                  this._storeSubject.next(this.get());
                  // TODO: Need to update the ImpLocation subscribers that data has changed to pick up the ids                  
               }, err =>
               {
                  // Alert the user to the failed save
                  this.appMessagingService.showGrowlError('Project Save', 'Project failed to save.');
                  console.warn('Error loading project', err);
               });

            }
//            else
//               console.log('saveProject - updated projectId: ' + result.payload);
         }
      });
   }
   
}