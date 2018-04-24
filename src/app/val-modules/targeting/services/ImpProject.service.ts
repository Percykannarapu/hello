import { ImpGeofootprintMaster } from './../models/ImpGeofootprintMaster';
import { ImpGeofootprintLocation } from '../models/ImpGeofootprintLocation';
import { ImpGeofootprintLocationService } from './ImpGeofootprintLocation.service';
import { ImpGeofootprintLocAttrib } from './../models/ImpGeofootprintLocAttrib';
import { ImpGeofootprintLocAttribService } from './ImpGeofootprintLocAttrib.service';
import { ImpGeofootprintTradeArea } from './../models/ImpGeofootprintTradeArea';
import { ImpGeofootprintTradeAreaService } from './ImpGeofootprintTradeArea.service';
import { ImpGeofootprintGeo } from './../models/ImpGeofootprintGeo';
import { ImpGeofootprintGeoService } from './ImpGeofootprintGeo.service';
import { ImpGeofootprintVar } from '../models/ImpGeofootprintVar';
import { ImpGeofootprintVarService } from './ImpGeofootprintVar.service';
import { TransactionManager } from './../../common/services/TransactionManager.service';
import { InTransaction } from './../../common/services/datastore.service'
import { AppMessagingService } from './../../../services/app-messaging.service';
import { ImpGeofootprintMasterService } from './ImpGeofootprintMaster.service';
import { ImpClientLocationType } from './../../client/models/ImpClientLocationType';
import { ImpClientLocation } from './../../client/models/ImpClientLocation';
//import { ImpDiscoveryService } from './../../../services/ImpDiscoveryUI.service';
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
import { AppConfig } from '../../../app.config';
import { ImpProject } from '../models/ImpProject';
import { RestDataService } from './../../common/services/restdata.service';
import { DataStore } from '../../common/services/datastore.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { DAOBaseStatus } from '../../api/models/BaseModel';
import { UserService } from '../../../services/user.service';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { RestResponse } from '../../../models/RestResponse';
//import { ImpDiscoveryUI } from '../../../models/ImpDiscoveryUI';
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
               public impGeofootprintLocAttribService: ImpGeofootprintLocAttribService,
               public impGeofootprintTradeAreaService: ImpGeofootprintTradeAreaService,
               public impGeofootprintGeoService: ImpGeofootprintGeoService,
               public impGeofootprintVarService: ImpGeofootprintVarService,
//               public impDiscoveryService: ImpDiscoveryService,
               public userService: UserService,
               public appConfig: AppConfig,
               private http: HttpClient,
               private restDataService: RestDataService,
               private projectTransactionManager: TransactionManager,
               private appMessagingService: AppMessagingService) {super(restDataService, dataUrl, projectTransactionManager); }

   private handleError(error: Response)
   {
      const errorMsg = `Status code: ${error.status} on url ${error.url}`;
      console.error(errorMsg);
      return Observable.throw(errorMsg);
   }

   loadProject(projectId: number, clearStore: boolean = false)
   {
      // Prevent a load of a null projectId
      if (projectId == null)
         return;

      console.log('ImpProject.service.loadProject - fired');
      this.projectTransactionManager.startTransaction();
      this.debugLogStore('PROJECTS');

      // Indicate to the user that the project is loading
      this.appMessagingService.startSpinnerDialog('PROJECTLOAD', 'Loading project ' + projectId);
      this.dataUrl = restUrl + 'load/' + projectId;

      // Clear out the decentralized data stores
      this.impGeofootprintVarService.clearAll(false);
      this.impGeofootprintGeoService.clearAll(false);
      this.impGeofootprintTradeAreaService.clearAll(false);
      this.impGeofootprintLocAttribService.clearAll(false);
      this.impGeofootprintLocationService.clearAll(false);
      this.impGeofootprintMasterService.clearAll(false);
      
      let project: ImpProject = this.get()[0];

      if (project != null && project.impGeofootprintMasters != null)
      {
         project.impGeofootprintMasters[0].impGeofootprintLocations = null;
         project.impGeofootprintMasters = null;
      }

      this.get(true, true, InTransaction.false).subscribe(res => {
         this.populateDataStores(res);
         this.appMessagingService.stopSpinnerDialog('PROJECTLOAD');
         this.appMessagingService.showGrowlSuccess('Project Load', 'Project ' + projectId + ' loaded successfully!');

         // Debug print the data stores
         this.impGeofootprintVarService.debugLogStore('LOADED VARS');
         this.impGeofootprintGeoService.debugLogStore('LOADED GEOS');
         this.impGeofootprintTradeAreaService.debugLogStore('LOADED TRADE AREAS');
         this.impGeofootprintLocAttribService.debugLogStore('LOADED LOCATION ATTRIBUTES');
         this.impGeofootprintLocationService.debugLogStore('LOADED LOCATIONS');
         this.impGeofootprintMasterService.debugLogStore('LOADED MASTERS');

         this.projectTransactionManager.stopTransaction();         
      },
      err =>
      {
         // Clear all data stores
         this.impGeofootprintVarService.clearAll(false);
         this.impGeofootprintGeoService.clearAll(false);
         this.impGeofootprintTradeAreaService.clearAll(false);
         this.impGeofootprintLocAttribService.clearAll(false);
         this.impGeofootprintLocationService.clearAll(false);
         this.impGeofootprintMasterService.clearAll(false);
         
         // Alert the user to the failed load
         this.appMessagingService.showGrowlError('Project Load', 'Project failed to load.');
         this.appMessagingService.stopSpinnerDialog('PROJECTLOAD');
         this.projectTransactionManager.stopTransaction();
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

   /**
    * Performed after a load to rehydrate the decentralized data stores
    * 
    * @param projects Projects to rehydrate the data stores with
    */
   populateDataStores(projects: ImpProject[]) //: ImpProject[]
   {
      if (projects != null && projects.length > 0)
      {
         console.log('ImpProject.service.populateLocations - fired', projects);

         // Populate the geofootprint master
         this.impGeofootprintMasterService.add(projects[0].impGeofootprintMasters);

         // Populate the locations data store
         this.impGeofootprintLocationService.add(projects[0].impGeofootprintMasters[0].impGeofootprintLocations);

         if (projects[0].impGeofootprintMasters != null && projects[0].impGeofootprintMasters.length > 0
         &&  projects[0].impGeofootprintMasters[0].impGeofootprintLocations != null && projects[0].impGeofootprintMasters[0].impGeofootprintLocations.length > 0)
         {
            // Populate the trade areas data store
            projects[0].impGeofootprintMasters[0].impGeofootprintLocations.forEach(location =>
            {
               // Set reverse hierarchy (Remove after refactor)
               if (location.impGeofootprintLocAttribs != null)
                  location.impGeofootprintLocAttribs.forEach(attrib =>
                  {
                     attrib.impGeofootprintLocation = location;
                     attrib.impGeofootprintMaster = projects[0].impGeofootprintMasters[0];
                     attrib.impProject = projects[0];
                  });

               // Populate the location Attributes
               this.impGeofootprintLocAttribService.add(location.impGeofootprintLocAttribs);

               // Set reverse hierarchy (Remove after refactor)
               if (location.impGeofootprintTradeAreas != null)
                  location.impGeofootprintTradeAreas.forEach(ta =>
                  {
                     ta.impGeofootprintLocation = location;
                     ta.impGeofootprintMaster = projects[0].impGeofootprintMasters[0];
                     ta.impProject = projects[0];
                  });
               // Populate the trade areas data store
               this.impGeofootprintTradeAreaService.add(location.impGeofootprintTradeAreas);

               // Populate the geos and vars data stores
               if (location.impGeofootprintTradeAreas != null)
               {
                  location.impGeofootprintTradeAreas.forEach(tradeArea =>
                  {
                     // Set reverse hierarchy (Remove after refactor)
                     if (tradeArea.impGeofootprintGeos != null)
                        tradeArea.impGeofootprintGeos.forEach(geo =>
                        {
                           geo.impGeofootprintTradeArea = tradeArea;
                           geo.impGeofootprintLocation = tradeArea.impGeofootprintLocation;
                           geo.impGeofootprintMaster = tradeArea.impGeofootprintMaster;
                           geo.impProject = projects[0];
                        });

                     // Populate the geos data store
                     this.impGeofootprintGeoService.add(tradeArea.impGeofootprintGeos);
                  
                     // Set reverse hierarchy (Remove after refactor)
                     if (tradeArea.impGeofootprintVars != null)
                        tradeArea.impGeofootprintVars.forEach(geoVar =>
                        {
                           geoVar.impGeofootprintTradeArea = tradeArea;
                           geoVar.impGeofootprintLocation = tradeArea.impGeofootprintLocation;
                           geoVar.impGeofootprintMaster = tradeArea.impGeofootprintMaster;
                           geoVar.impProject = projects[0];
                        });
                     // Populate the vars data store
                     this.impGeofootprintVarService.add(tradeArea.impGeofootprintVars);
                  });
               }
            });
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

   saveProject()
   {
      console.log('ImpProject.service.saveProject fired');
      
      this.projectTransactionManager.startTransaction();
      try
      {
         // Retrieve the project from the datastore (Right now assuming only 1)
         let impProject: ImpProject = this.get()[0];
         console.log ('Saving project: ', impProject.toString());

         // Retrieve the discovery data
//         let impDiscoveryUI: ImpDiscoveryUI =  this.impDiscoveryService.get()[0];

         // Create Geofootprint Array if needed
         console.log('ImpProject.service.saveProject - populating geofootprint master');
         if (!impProject.impGeofootprintMasters)
            impProject.impGeofootprintMasters = new Array<ImpGeofootprintMaster>();

         // Create ImpGeofootprintMaster if needed
         if (impProject.impGeofootprintMasters.length === 0)
         {
            let newCGM: ImpGeofootprintMaster = new ImpGeofootprintMaster();
            newCGM.dirty = true;
            newCGM.baseStatus = (impProject.projectId != null) ? DAOBaseStatus.UPDATE : DAOBaseStatus.INSERT;
//            newCGM.methAnalysis = (impDiscoveryUI.analysisLevel) ? impDiscoveryUI.analysisLevel : 'ZIP';  // Mandatory field
            newCGM.methAnalysis = (impProject.methAnalysis != null) ? impProject.methAnalysis : 'ZIP'; // Mandatory field
            newCGM.status = 'SUCCESS';
            newCGM.summaryInd = 0;
            newCGM.createdDate = new Date(Date.now());
            newCGM.isMarketBased = false;
            newCGM.isActive = true;
            newCGM.impGeofootprintLocations = new Array<ImpGeofootprintLocation>();
            impProject.impGeofootprintMasters.push(newCGM);
         }

         console.log('ImpProject.service.saveProject - Adding locations to the geofootprint master');
         impProject.impGeofootprintMasters[0].impGeofootprintLocations = this.impGeofootprintLocationService.get();

         const impGeofootprintLocAttribs: Array<ImpGeofootprintLocAttrib> = this.impGeofootprintLocAttribService.get().filter(attrib => attrib.attributeValue != null
                                                                                                                                     && attrib.attributeValue != "");
         const impGeofootprintTradeAreas: Array<ImpGeofootprintTradeArea> = this.impGeofootprintTradeAreaService.get();
         const impGeofootprintGeos:       Array<ImpGeofootprintGeo>       = this.impGeofootprintGeoService.get();
         const impGeofootprintVars:       Array<ImpGeofootprintVar>       = this.impGeofootprintVarService.get();
console.log('ImpProject.service.saveProject - impGeofootprintGeos: ', impGeofootprintGeos.toString());
         // Dedupe the location attributes
         this.denseRank(impGeofootprintLocAttribs,  this.impGeofootprintLocAttribService.sort, this.impGeofootprintLocAttribService.partition);
         
//         this.impGeofootprintLocAttribService.debugLogStore('Location Attributes');
/*          
         for (let locationAttrib of impGeofootprintLocAttribs)
         {
            // filter out loc attributes that are null
//            let location = impProject.impGeofootprintMasters[0].impGeofootprintLocations.filter(l => l == locationAttrib.impGeofootprintLocation && locationAttrib.attributeValue != null)
            let location: ImpGeofootprintLocation[] = impProject.impGeofootprintMasters[0].impGeofootprintLocations.filter(l => l.locationNumber == locationAttrib.impGeofootprintLocation.locationNumber && locationAttrib.attributeValue != null)
         }
*/
         // TODO: This should be coming from the ImpGeofootprintTradeAreaService
         if (impProject == null)
            console.error ('impProject is null');
         else
            if (impProject.impGeofootprintMasters == null)
               console.error ('impProject.impGeofootprintMasters is null');
         
         // Loop through locations, setting missing mandatory fields and setting baseStatus
         for (let impLocation of impProject.impGeofootprintMasters[0].impGeofootprintLocations)
         {
            // Get the attributes for the current location
//            location.impGeofootprintLocAttribs = impGeofootprintLocAttribs.filter(l => l.impGeofootprintLocation == location);
            try
            {
               console.log('processing location: ', location);
               impLocation.impGeofootprintLocAttribs = impGeofootprintLocAttribs;
               impLocation.impGeofootprintLocAttribs = impGeofootprintLocAttribs.filter(attrib => attrib.impGeofootprintLocation != null
                                                                                               && attrib.impGeofootprintLocation == impLocation
                                                                                               && attrib.attributeValue != null
                                                                                               && attrib['rank'] === 0);

               if (impLocation.impGeofootprintLocAttribs != null)
               {
                  // Remove the circular references and stub mandatory fields
                  impLocation.impGeofootprintLocAttribs.forEach(attrib => {
                     delete attrib["impGeofootprintLocation"];
                     delete attrib["impGeofootprintMaster"];
                     delete attrib["impProject"];
                     attrib.dirty = true;
                     attrib.baseStatus    = (attrib.locAttributeId == null) ? DAOBaseStatus.INSERT : DAOBaseStatus.UPDATE;
                     attrib.createUser    = this.userService.getUser().userId;
                     attrib.createDate    = (attrib.createDate == null) ? new Date(Date.now()) : attrib.createDate;
                     attrib.modifyUser    = this.userService.getUser().userId;
                     attrib.modifyDate    = new Date(Date.now());
                     attrib.attributeType = 'PUMPKIN_SPICE_LATTE'
                     attrib.formatMask	   = null;
                     attrib.isActive      = 1;
                  });
               }
               else
                  console.log('location: ', impLocation.locationNumber, ' did not have any attributes');

               // Map in Trade Areas
               impLocation.impGeofootprintTradeAreas = impGeofootprintTradeAreas.filter(tradeArea => tradeArea.impGeofootprintLocation != null
                                                                                                  && tradeArea.impGeofootprintLocation == impLocation);

               if (impLocation.impGeofootprintTradeAreas != null)
               {
                  console.log('location: ', impLocation.locationNumber, ' has ', impLocation.impGeofootprintTradeAreas.length, ' trade areas');
                  // Remove the circular references and stub mandatory fields
                  impLocation.impGeofootprintTradeAreas.forEach(tradeArea =>
                  {
                     delete tradeArea["impGeofootprintLocation"];  
                     delete tradeArea["impGeofootprintMaster"];  
                     delete tradeArea["impProject"];                                       
                     tradeArea.dirty = true;

                     // Remove stubbed gtaIds
                     if (tradeArea.gtaId < 1000)
                        tradeArea.gtaId = null;

                     tradeArea.baseStatus = (tradeArea.gtaId == null) ? DAOBaseStatus.INSERT : DAOBaseStatus.UPDATE;
                     tradeArea.isActive   = 1;

                     // Map in geos
                     tradeArea.impGeofootprintGeos = impGeofootprintGeos.filter(geo => geo.impGeofootprintTradeArea != null
                                                                                    && geo.impGeofootprintTradeArea == tradeArea);

                     tradeArea.impGeofootprintGeos.forEach(geo =>
                     {
                        delete geo["impGeofootprintLocation"];
                        delete geo["impGeofootprintMaster"];
                        delete geo["impGeofootprintTradeArea"];
                        delete geo["impProject"];
                                             
                        geo.dirty = true;
   
                        // Remove stubbed ggIds
                        if (geo.ggId < 1000)
                           geo.ggId = null;
   
                        geo.baseStatus = (geo.ggId == null) ? DAOBaseStatus.INSERT : DAOBaseStatus.UPDATE;
                        geo.isActive   = 1;                        
                     });
/*
                     // Map in vars
                     tradeArea.impGeofootprintVars = impGeofootprintVars.filter(geoVar => geoVar.impGeofootprintTradeArea != null
                                                                                       && geoVar.impGeofootprintTradeArea == tradeArea);

                     tradeArea.impGeofootprintVars.forEach(geoVar =>
                     {
                        delete geoVar["impGeofootprintLocation"];
                        delete geoVar["impGeofootprintMaster"];
                        delete geoVar["impGeofootprintTradeArea"];
                        delete geoVar["impProject"];

                        geoVar.dirty = true;

                        // Remove stubbed ggIds
                        if (geoVar.gvId < 1000)
                           geoVar.gvId = null;

                        geoVar.baseStatus = (geoVar.gvId == null) ? DAOBaseStatus.INSERT : DAOBaseStatus.UPDATE;
                        geoVar.isActive   = 1;                        
                     });*/
                  });
               }
               else
                  console.log('location: ', impLocation.locationNumber, ' has no trade areas');
            }
            catch(err)
            {
               console.log('ERROR: ', err);
            }

            console.log('location: ', impLocation.locationNumber, ' setting baseStatus to: ', (impLocation.glId != null) ? DAOBaseStatus.UPDATE : DAOBaseStatus.INSERT);
            impLocation.baseStatus = (impLocation.glId != null) ? DAOBaseStatus.UPDATE : DAOBaseStatus.INSERT;
   //       location.isActive = true;
   //       impLocation.locationNumber = locNumber++;            // Mandatory field, stubbing
            impLocation.clientIdentifierId = impLocation.locationNumber; // Mandatory field, stubbing
            impLocation.clientLocationId = impLocation.locationNumber;   // Mandatory field, stubbing
            impLocation.marketName = (impLocation.marketName == null) ? 'Market ' + impLocation.locationNumber : impLocation.marketName; // Mandatory field, stubbing
            console.log('location: ', impLocation);
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

         // Set the base status
         impProject.baseStatus = (impProject.projectId != null) ? DAOBaseStatus.UPDATE : DAOBaseStatus.INSERT;

         // Convert the Typescript models into a JSON string
         const payload: string = JSON.stringify(impProject);
         console.log('ImpProject payload', payload);
         console.log('posting to: ', this.appConfig.valServiceBase, 'v1/targeting/base/impproject/save');

         // TODO: Need to implement save in the data store
   //    this.http.post<RestResponse>('https://servicesdev.valassislab.com/services/v1/targeting/base/impproject/save', payload, { headers: headers }).subscribe(result => {
         this.http.post<RestResponse>(this.appConfig.valServiceBase + 'v1/targeting/base/impproject/save', payload, { headers: headers }).subscribe(result => {
            console.log ('result: ', result);
            if (result.returnCode === 200)
            {
   //            if (impProject.projectId == null)
               {
                  impProject.projectId = result.payload;
                  console.log('saveProject - created new projectId: ' + impProject.projectId);

                  // Reload the project to pickup the newly created ids
                  this.clearAll(false);
                  this.setDataUrl ('load/' + impProject.projectId);
                  console.log('## RELOADING THE PROJECT');
                  this.get(true).subscribe(res => {
                     impProject = res[0];
                     console.log('Project ', impProject.projectId ,' Reloaded - Ok to save again: ');
                     this.debugLogStore('Project After Reload');
                     console.log('Project point in time: ', res[0].toString());
                     if (impProject != null && impProject.impGeofootprintMasters != null)
                     {
                        for (let location of impProject.impGeofootprintMasters[0].impGeofootprintLocations || [])
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
                     }
                     // Alert the user to the successful save
                     this.appMessagingService.showGrowlSuccess('Project Save', 'Project ' + impProject.projectId + ' saved successfully!');

                     this._storeSubject.next(this.get());
               //    this.projectTransactionManager.stopTransaction();
                  }, err =>
                  {
                     // Alert the user to the failed save
                     this.appMessagingService.showGrowlError('Project Save', 'Project failed to save.');
                     console.warn('Error loading project', err);
                     this.projectTransactionManager.stopTransaction();
                  });
               }
   //            else
   //               console.log('saveProject - updated projectId: ' + result.payload);
            }
         });
      }
      catch(error)
      {
         console.log('ImpProject.service.saveProject - Error saving project: ', error);
         this.transactionManager.stopTransaction();
      }
   }
}