import { Injectable } from '@angular/core';
import { DataStore } from '../val-modules/common/services/datastore.service';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { ImpClientLocationService } from '../val-modules/client/services/ImpClientLocation.service';
import { ImpProjectPrefService } from '../val-modules/targeting/services/ImpProjectPref.service';
import { ImpProjectVarService } from '../val-modules/targeting/services/ImpProjectVar.service';
import { ImpGeofootprintMasterService } from '../val-modules/targeting/services/ImpGeofootprintMaster.service';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocAttribService } from '../val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintVarService } from '../val-modules/targeting/services/ImpGeofootprintVar.service';
import { ImpGeofootprintVar } from '../val-modules/targeting/models/ImpGeofootprintVar';
import { UserService } from './user.service';
import { AppConfig } from '../app.config';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { TransactionManager } from '../val-modules/common/services/TransactionManager.service';
import { InTransaction } from '../val-modules/common/services/datastore.service';
import { AppMessagingService } from './app-messaging.service';
import { DAOBaseStatus } from '../val-modules/api/models/BaseModel';
import { ImpGeofootprintMaster } from '../val-modules/targeting/models/ImpGeofootprintMaster';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { RestResponse } from '../models/RestResponse';

import { ClientIdentifierType } from '../val-modules/mediaexpress/models/ClientIdentifierType';
import { ImpClientLocationType } from '../val-modules/client/models/ImpClientLocationType';
import { Observable, EMPTY, BehaviorSubject } from 'rxjs';
import { finalize, catchError, tap, concatMap } from 'rxjs/operators';

const restUrl = 'v1/targeting/base/impproject/';
const dataUrl = restUrl + 'load';

@Injectable()
export class AppProjectService extends DataStore<ImpProject>
{
   public ngDialog: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

   constructor(public impClientLocationService: ImpClientLocationService,
               public impProjectPrefService: ImpProjectPrefService,
               public impProjectVarService: ImpProjectVarService,
               public impGeofootprintMasterService: ImpGeofootprintMasterService,
               public impGeofootprintLocationService: ImpGeofootprintLocationService,
               public impGeofootprintLocAttribService: ImpGeofootprintLocAttribService,
               public impGeofootprintTradeAreaService: ImpGeofootprintTradeAreaService,
               public impGeofootprintGeoService: ImpGeofootprintGeoService,
               public impGeofootprintVarService: ImpGeofootprintVarService,
               public userService: UserService,
               public appConfig: AppConfig,
               private http: HttpClient,
               private restDataService: RestDataService,
               private projectTransactionManager: TransactionManager,
               private appMessagingService: AppMessagingService,
               private projectVarService: ImpProjectVarService)
   {
      super(restDataService, dataUrl, projectTransactionManager, 'AppProject');
   }

   public setDataUrl (newDataUrl: string)
   {
      this.dataUrl = restUrl + newDataUrl;
   }

   public clearProject(notifySubscribers = true, inTransaction: InTransaction = InTransaction.true)
   {
      this.impGeofootprintVarService.clearAll(notifySubscribers, inTransaction);
      this.impGeofootprintGeoService.clearAll(notifySubscribers, inTransaction);
      this.impGeofootprintTradeAreaService.clearAll(notifySubscribers, inTransaction);
      this.impGeofootprintLocAttribService.clearAll(notifySubscribers, inTransaction);
      this.impGeofootprintLocationService.clearAll(notifySubscribers, inTransaction);
      this.impClientLocationService.clearAll(notifySubscribers, inTransaction);
      this.impGeofootprintMasterService.clearAll(notifySubscribers, inTransaction);
      this.impProjectPrefService.clearAll(notifySubscribers, inTransaction);
      this.impProjectVarService.clearAll(notifySubscribers, inTransaction);
   }

   // WIP
   public getDbRemoves(impProject: ImpProject)
   {
      //const impGeofootprintMasterRemoves = impProject.impGeofootprintMasters.forEach(impGeofootprintMaster => getDbRemoves(impGeofootprintMaster));
   }

   // public addAllDbRemoves(impProject: ImpProject)
   // {
   //    impProject.impGeofootprintMasters.addAllDbRemoves(impProject.impGeofootprintMasters);
   //    this.dbRemoves

   //    if (this.dbRemoves != null && this.dbRemoves.length > 0)
   //    {
   //       console.log('Removing ' + this.dbRemoves.length + ' ImpProjects');
   //       impProject.
   //       for (const removeTA of this.impGeofootprintTradeAreaService.dbRemoves)
   //       {
   //          console.log('TA Removal: ', removeTA);
   //          impGeofootprintTradeAreas.unshift(removeTA);
   //       }
   //    }
   //    else
   //       console.log('impGeofootprintTradeAreaService had no database removes');

   // }

   public debugLogStores(headerText: string)
   {
      // this.impGeofootprintVarService.debugLogStore('LOADED VARS');
      // this.impGeofootprintGeoService.debugLogStore('LOADED GEOS');
      // this.impGeofootprintTradeAreaService.debugLogStore('LOADED TRADE AREAS');
      // this.impGeofootprintLocAttribService.debugLogStore('LOADED LOCATION ATTRIBUTES');
      // this.impGeofootprintLocationService.debugLogStore('LOADED LOCATIONS');
      // this.impGeofootprintMasterService.debugLogStore('LOADED MASTERS');
      this.impGeofootprintVarService.debugLogStore(headerText);
      this.impGeofootprintGeoService.debugLogStore(headerText);
      this.impGeofootprintTradeAreaService.debugLogStore(headerText);
      this.impGeofootprintLocAttribService.debugLogStore(headerText);
      this.impGeofootprintLocationService.debugLogStore(headerText);
      this.impClientLocationService.debugLogStore(headerText);
      this.impGeofootprintMasterService.debugLogStore(headerText);
      this.impProjectPrefService.debugLogStore(headerText);
      this.impProjectVarService.debugLogStore(headerText);
   }

   public debugLogStoreCounts()
   {
      console.log('impGeofootprintVars:       ', this.impGeofootprintVarService.storeLength);
      console.log('impGeofootprintGeos:       ', this.impGeofootprintGeoService.storeLength);
      console.log('impGeofootprintTradeAreas: ', this.impGeofootprintTradeAreaService.storeLength);
      console.log('impGeofootprintLocAttribs: ', this.impGeofootprintLocAttribService.storeLength);
      console.log('impGeofootprintLocations:  ', this.impGeofootprintLocationService.storeLength);
      console.log('impClientLocations:        ', this.impClientLocationService.storeLength);
      console.log('impGeofootprintMasters:    ', this.impGeofootprintMasterService.storeLength);
      console.log('impProjectPrefs:           ', this.impProjectPrefService.storeLength);
      console.log('impProjectVarService:      ', this.impProjectVarService.storeLength);
   }

   reloadProject(project: ImpProject, clearStore: boolean, silent: boolean = false) : Observable<ImpProject[]>
   {
      console.log('AppProject.service.reloadProject fired - ', project);
      this.clearProject(false, InTransaction.true);
      return this.loadProject(project.projectId, clearStore, silent);
   }

   loadProject(projectId: number, clearStore: boolean, silent: boolean = false) : Observable<ImpProject[]>
   {
     const inExistingTransaction: boolean = this.projectTransactionManager.inTransaction();

     const loadObservable = new Observable<ImpProject[]>((observer) =>
     {
       console.log('AppProject.service.loadProject - fired -' + projectId);
       // Prevent a load of a null projectId
       if (projectId == null) observer.complete();

       this.dataUrl = restUrl + 'load/' + projectId;

       // Indicate to the user that the project is loading
       if (!silent) this.appMessagingService.startSpinnerDialog('PROJECTLOAD', 'Loading project ' + projectId);

       if (!inExistingTransaction) this.projectTransactionManager.startTransaction();

       this.debugLogStoreCounts();
       const results: ImpProject[] = [];
       this.clearProject(false, InTransaction.true);
       this.restDataService.get(this.dataUrl).subscribe(res => {
           console.log ('loadProject - observer.next');
           results.push(res.payload);
         },
         err =>
         {
           // Clear all data stores
           this.clearProject(false, InTransaction.true);
           // Alert the user to the failed load
           if (!silent)
           {
             this.appMessagingService.stopSpinnerDialog('PROJECTLOAD');
             this.appMessagingService.showGrowlError('Project Load', 'Project failed to load.');
           }
           if (!inExistingTransaction) this.projectTransactionManager.stopTransaction();
           console.warn('Error loading project', err);
           observer.error(err);
         }, () => {
           if (!silent) {
             this.appMessagingService.stopSpinnerDialog('PROJECTLOAD');
             this.appMessagingService.showGrowlSuccess('Project Load', 'Project ' + projectId + ' loaded successfully.');
           }

           const loadedProject: ImpProject = new ImpProject(results[0]);

           //          loadedProject.getImpGeofootprintTradeAreas().forEach(ta => {
           //            ta.impGeofootprintMaster = ta.impGeofootprintLocation.impGeofootprintMaster;
           //          });
           
            loadedProject.convertToModel();
            
            // Associate the geo with location grandparent
            loadedProject.getImpGeofootprintGeos().forEach(geo => {
               geo.impGeofootprintLocation = geo.impGeofootprintTradeArea.impGeofootprintLocation;
            });
           
           if (!inExistingTransaction) this.projectTransactionManager.stopTransaction();           
           console.log ('loadProject - observer.complete');
           observer.next([loadedProject]);
           observer.complete();
         });
     });
     return loadObservable;
   }

   /**
    * Performed after a load to rehydrate the decentralized data stores
    *
    * @param project The Project to rehydrate the data stores with
    */
   populateDataStores(project: ImpProject)
   {
      if (project != null)
      {
         console.log('ImpProject.service.populateDataStores - fired', project);
         // Populate the immediate child data stores
         this.impGeofootprintMasterService.add(project.impGeofootprintMasters);
         this.impProjectPrefService.add(project.impProjectPrefs);
         this.impProjectVarService.add(project.impProjectVars);
         // Populate the grand+child data stores
         this.impGeofootprintLocationService.add(project.getImpGeofootprintLocations());
         this.impGeofootprintLocAttribService.add(project.getImpGeofootprintLocAttribs());
         this.impGeofootprintTradeAreaService.add(project.getImpGeofootprintTradeAreas());
         this.impGeofootprintVarService.add(project.getImpGeofootprintVars());
         this.impGeofootprintGeoService.add(project.getImpGeofootprintGeos());
      }
   }

   saveProject(impProject: ImpProject) : Observable<ImpProject[]>
   {
      console.log('AppProject.service.saveProject fired');
      const saveObservable = new Observable<ImpProject[]>((subject) =>
      {
         if (impProject == null)
         {
            console.log ('AppProject.saveProject cannot save a null project');
            return null;
         }

         this.appMessagingService.startSpinnerDialog('PROJECTSAVE', 'Saving project');

   //      const saveObservable = new Observable<ImpProject[]>((observer) =>
         {
            this.projectTransactionManager.startTransaction();
            try
            {
               // Retrieve the project from the datastore (Right now assuming only 1)
               console.log ('Saving project: ', (impProject != null) ? impProject.projectId : 'new project');

               // populate project vars
               impProject.impProjectVars = this.projectVarService.get();
               if (this.projectVarService.dbRemoves && this.projectVarService.dbRemoves.length > 0) {
                 for (const dbRemove of this.projectVarService.dbRemoves) {
                   this.projectVarService.add([dbRemove]);
                 }
               }

               // Create Geofootprint Array if needed
               console.log('ImpProject.service.saveProject - populating geofootprint master');
               if (!impProject.impGeofootprintMasters)
                  impProject.impGeofootprintMasters = new Array<ImpGeofootprintMaster>();

               // Create ImpGeofootprintMaster if needed
               if (impProject.impGeofootprintMasters.length === 0)
               {
                  const newCGM: ImpGeofootprintMaster = new ImpGeofootprintMaster();
                  newCGM.dirty = true;
                  newCGM.baseStatus = (impProject.projectId == null) ? DAOBaseStatus.INSERT : DAOBaseStatus.UPDATE;
                  newCGM.methAnalysis = (impProject.methAnalysis != null) ? impProject.methAnalysis : 'ZIP'; // Mandatory field
                  newCGM.methSeason = null;
                  newCGM.status = 'SUCCESS';
                  newCGM.summaryInd = 0;
                  newCGM.createdDate = new Date(Date.now());
                  newCGM.isMarketBased = false;
                  newCGM.isActive = true;
                  newCGM.impGeofootprintLocations = new Array<ImpGeofootprintLocation>();
                  impProject.impGeofootprintMasters.push(newCGM);
               } else {
                 const currentCGM: ImpGeofootprintMaster = impProject.impGeofootprintMasters[0];
                 currentCGM.dirty = true;
                 currentCGM.baseStatus = (impProject.projectId == null) ? DAOBaseStatus.INSERT : DAOBaseStatus.UPDATE;
                 currentCGM.methAnalysis = (impProject.methAnalysis != null) ? impProject.methAnalysis : 'ZIP'; // Mandatory field
                 currentCGM.methSeason = currentCGM.methSeason.substring(0, 1).toUpperCase();
                 currentCGM.status = 'SUCCESS';
                 currentCGM.summaryInd = 0;
                 currentCGM.createdDate = new Date(Date.now());
                 currentCGM.isMarketBased = false;
                 currentCGM.isActive = true;
               }

               //console.log('ImpProject.service.saveProject - Adding locations to the geofootprint master');
               //impProject.impGeofootprintMasters[0].impGeofootprintLocations = this.impGeofootprintLocationService.get();

               //console.log('ImpProject.service.saveProject - Getting location attributes');
               //const impGeofootprintLocAttribs: Array<ImpGeofootprintLocAttrib> = this.impGeofootprintLocAttribService.get().filter(attrib => attrib.attributeValue != null
               //                                                                                                                            && attrib.attributeValue != '');
               // console.log('ImpProject.service.saveProject - Getting trade areas');
               // const impGeofootprintTradeAreas: Array<ImpGeofootprintTradeArea> = this.impGeofootprintTradeAreaService.get();
               // console.log('ImpProject.service.saveProject - Getting geos');
               // const impGeofootprintGeos:       Array<ImpGeofootprintGeo>       = this.impGeofootprintGeoService.get();
               // console.log('ImpProject.service.saveProject - Getting vars');
               const impGeofootprintVars:       Array<ImpGeofootprintVar>       = this.impGeofootprintVarService.get();
               //
               // console.log('ImpProject.service.saveProject - Deduping location attributes');

               impProject.impGeofootprintMasters[0].impGeofootprintLocations.forEach(location => {
                  // Dedupe the location attributes
                  this.denseRank(location.impGeofootprintLocAttribs,  this.impGeofootprintLocAttribService.sort, this.impGeofootprintLocAttribService.partition);

                  // Filter out location attributes that are null
                  location.impGeofootprintLocAttribs = location.impGeofootprintLocAttribs.filter(locationAttrib => locationAttrib.attributeValue != null && locationAttrib['rank'] === 0);
               });

      //         // Dedupe the location attributes
      //         this.denseRank(impProject.impGeofootprintLocAttribs,  this.impGeofootprintLocAttribService.sort, this.impGeofootprintLocAttribService.partition);

      //         this.impGeofootprintLocAttribService.debugLogStore('Location Attributes');

      //          for (let locationAttrib of impGeofootprintLocAttribs)
      //          {
      //             // filter out loc attributes that are null
      // //            let location = impProject.impGeofootprintMasters[0].impGeofootprintLocations.filter(l => l == locationAttrib.impGeofootprintLocation && locationAttrib.attributeValue != null)
      //             let location: ImpGeofootprintLocation[] = impProject.impGeofootprintMasters[0].impGeofootprintLocations.filter(l => l.locationNumber == locationAttrib.impGeofootprintLocation.locationNumber && locationAttrib.attributeValue != null)
      //          }

               // TODO: This should be coming from the ImpGeofootprintTradeAreaService
               if (impProject == null)
                  console.error ('impProject is null');
               else
                  if (impProject.impGeofootprintMasters == null)
                     console.error ('impProject.impGeofootprintMasters is null');

               // Loop through locations, setting missing mandatory fields and setting baseStatus
               for (const impLocation of impProject.impGeofootprintMasters[0].impGeofootprintLocations)
               {
                  // Get the attributes for the current location
      //            location.impGeofootprintLocAttribs = impGeofootprintLocAttribs.filter(l => l.impGeofootprintLocation == location);
                  try
                  {
                     console.log('processing location: ', JSON.stringify(location));
                  //    impLocation.impGeofootprintLocAttribs = impGeofootprintLocAttribs;

                     // impLocation.impGeofootprintLocAttribs = impGeofootprintLocAttribs.filter(attrib => attrib.impGeofootprintLocation != null
                     //                                                                                 && attrib.impGeofootprintLocation == impLocation
                     //                                                                                 && attrib.attributeValue != null
                     //                                                                                 && attrib['rank'] === 0);

                     if (impLocation.impGeofootprintLocAttribs != null)
                     {
                        // Remove the circular references and stub mandatory fields
                        impLocation.impGeofootprintLocAttribs.forEach(attrib => {
                           delete attrib['impGeofootprintLocation'];
                           delete attrib['impGeofootprintMaster'];
                           delete attrib['impProject'];
                           attrib.dirty = true;
                           attrib.baseStatus    = (attrib.locAttributeId == null) ? DAOBaseStatus.INSERT : (attrib.baseStatus === DAOBaseStatus.DELETE) ? DAOBaseStatus.DELETE : DAOBaseStatus.UPDATE;
                           attrib.createUser    = this.userService.getUser().userId;
                           attrib.createDate    = (attrib.createDate == null) ? new Date(Date.now()) : attrib.createDate;
                           attrib.modifyUser    = this.userService.getUser().userId;
                           attrib.modifyDate    = new Date(Date.now());
                           attrib.attributeType = 'PUMPKIN_SPICE_LATTE';
                           attrib.formatMask	   = null;
                           attrib.isActive      = true;
                        });
                     }
                     else
                        console.log('location: ', impLocation.locationNumber, ' did not have any attributes');

                     // Add database removals
                     // if (this.impGeofootprintTradeAreaService.dbRemoves != null && this.impGeofootprintTradeAreaService.dbRemoves.length > 0)
                     // {
                     //    console.log('impGeofootprintTradeAreaService has ' + this.impGeofootprintTradeAreaService.dbRemoves.length + ' removes');
                     //    for (const removeTA of this.impGeofootprintTradeAreaService.dbRemoves)
                     //    {
                     //       console.log('TA Removal: ', removeTA);
                     //       impGeofootprintTradeAreas.unshift(removeTA);
                     //    }
                     // }
                     // else
                     //    console.log('impGeofootprintTradeAreaService had no database removes');

                     // Map in Trade Areas
                     // impLocation.impGeofootprintTradeAreas = impGeofootprintTradeAreas.filter(tradeArea => tradeArea.impGeofootprintLocation != null
                     //                                                                                    && tradeArea.impGeofootprintLocation == impLocation);

                     if (impLocation.impGeofootprintTradeAreas != null)
                     {
                        console.log('location: ', impLocation.locationNumber, ' has ', impLocation.impGeofootprintTradeAreas.length, ' trade areas');
                        // Remove the circular references and stub mandatory fields
                        impLocation.impGeofootprintTradeAreas.forEach(tradeArea =>
                        {
                           delete tradeArea['impGeofootprintLocation'];
                           delete tradeArea['impGeofootprintMaster'];
                           delete tradeArea['impProject'];
                           tradeArea.dirty = true;

                           // Remove stubbed gtaIds
                           if (tradeArea.gtaId < 1000)
                              tradeArea.gtaId = null;

                           tradeArea.baseStatus = (tradeArea.gtaId == null) ? DAOBaseStatus.INSERT : (tradeArea.baseStatus === DAOBaseStatus.DELETE) ? DAOBaseStatus.DELETE : DAOBaseStatus.UPDATE;
                           tradeArea.isActive   = true;

                           // Map in geos
                           // tradeArea.impGeofootprintGeos = impGeofootprintGeos.filter(geo => geo.impGeofootprintTradeArea != null
                           //                                                                && geo.impGeofootprintTradeArea == tradeArea);

                           tradeArea.impGeofootprintGeos.forEach(geo =>
                           {
                              delete geo['impGeofootprintLocation'];
                              delete geo['impGeofootprintMaster'];
                              delete geo['impGeofootprintTradeArea'];
                              delete geo['impProject'];

                              geo.dirty = true;

                              // Remove stubbed ggIds
                              if (geo.ggId < 1000)
                                 geo.ggId = null;

                              geo.baseStatus = (geo.ggId == null) ? DAOBaseStatus.INSERT : (geo.baseStatus === DAOBaseStatus.DELETE) ? DAOBaseStatus.DELETE : DAOBaseStatus.UPDATE;
                              //geo.isActive   = true;
                           });

                           // // Map in vars
                           // tradeArea.impGeofootprintVars = impGeofootprintVars.filter(geoVar => geoVar.impGeofootprintTradeArea != null
                           //                                                                   && geoVar.impGeofootprintTradeArea == tradeArea);

                           tradeArea.impGeofootprintVars.forEach(geoVar =>
                           {
                              delete geoVar['impGeofootprintLocation'];
                              delete geoVar['impGeofootprintMaster'];
                              delete geoVar['impGeofootprintTradeArea'];
                              delete geoVar['impProject'];

                              geoVar.dirty = true;

                              // Remove stubbed ggIds
                              if (geoVar.gvId < 1000)
                                 geoVar.gvId = null;

                              geoVar.baseStatus = (geoVar.gvId == null) ? DAOBaseStatus.INSERT : DAOBaseStatus.UPDATE;
                              geoVar.isActive   = true;
                           });
                        });
                     }
                     else
                        console.log('location: ', impLocation.locationNumber, ' has no trade areas');
                  }
                  catch (err)
                  {
                     console.log('ERROR: ', err);
                  }

                  impLocation.baseStatus = (impLocation.glId == null) ? DAOBaseStatus.INSERT : (impLocation.baseStatus === DAOBaseStatus.DELETE) ? DAOBaseStatus.DELETE : DAOBaseStatus.UPDATE;
                  console.log('location: ', impLocation.locationNumber, ' set baseStatus to: ', impLocation.baseStatus);
         //       location.isActive = true;
         //       impLocation.locationNumber = locNumber++;            // Mandatory field, stubbing
                  impLocation.clientIdentifierId = 123; // Mandatory field, stubbing
                  impLocation.clientLocationId = 123;   // Mandatory field, stubbing
//                impLocation.marketName = (impLocation.marketName == null) ? 'Market ' + impLocation.locationNumber : impLocation.marketName; // Mandatory field, stubbing
                  console.log('location: ', impLocation);
               }

               // Add database removals
               // if (this.impGeofootprintLocationService.dbRemoves != null && this.impGeofootprintLocationService.dbRemoves.length > 0)
               // {
               //    console.log('impGeofootprintLocationService has ' + this.impGeofootprintLocationService.dbRemoves.length + ' removes');
               //    for (const removeLocation of this.impGeofootprintLocationService.dbRemoves)
               //       impProject.impGeofootprintMasters[0].impGeofootprintLocations.push(removeLocation);
               // }
               // else
               //    console.log('impGeofootprintLocationService had no database removes');

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
               const clientIdentifierType = new ClientIdentifierType({clientIdentifierTypeCode: 'PROJECT_ID'
                                                                  , createUser:               -1
                                                                  , createDate:               new Date(Date.now())
                                                                  , modifyUser:               -1
                                                                  , modifyDate:               new Date(Date.now())
                                                                  , clientIdentifierType:     'Project ID'
                                                                  , description:              'Project Id'
                                                                  , sortOrder:                2
                                                                  , isActive:                 1
                                                                  });
               const impClientLocationType = new ImpClientLocationType({clientLocationTypeCode: 'Site'
                                                                     , createUser:             -1
                                                                     , createDate:             new Date(Date.now())
                                                                     , modifyUser:             -1
                                                                     , modifyDate:             new Date(Date.now())
                                                                     , clientLocationType:     'Site'
                                                                     , sortOrder:              1
                                                                     , isDefault:              1
                                                                     , isActive:               1
                                                                     });

         //  Reinstate with constraint IMP_GEOFOOTPRINT_LOCATIONS_U01

         //       // We know we are creating client locations every time.  This is temporary
         //       let clientLocations = new Array<ImpClientLocation>();
         //       for (let location of impProject.impGeofootprintMasters[0].impGeofootprintLocations)
         //       {
         //          clientLocations.push (new ImpClientLocation({dirty: true
         //                                                    ,baseStatus: DAOBaseStatus.INSERT
         //                                                    ,clientLocationId:      null
         //                                                    ,clientIdentifierId:    location.locationNumber
         //                                                    ,clientIdentifierType:  clientIdentifierType
         //                                                    ,impClientLocationType: impClientLocationType
         //                                                    }));
         //       }

         // //      this._createClientLocations(clientLocations)

         //       // TEMPORARY: Create a ImpClientLocation row
         //       for (let location of impProject.impGeofootprintMasters[0].impGeofootprintLocations)
         //       {
         //          if (location.clientLocationId == null)
         //          {
         //             // ({fieldA: 'xyz', fieldB: 123});
         //             // let clientLocation = new ImpClientLocation({
         //             //    clientLocationId:      null
         //             //   ,clientIdentifierId:    location.locationNumber
         //             //   ,clientIdentifierType:  clientIdentifierType
         //             //   ,impClientLocationType: impClientLocationType
         //             // });

         //             //     return this.httpClient.post<RegistrationResponse>(this.config.oAuthParams.registerUrl, registrationPayload, { headers: headers })
         //             //      .map(res => this.parseRegistrationResponse(res))
         //             //      .mergeMap(tokenHeaders => this.httpClient.post<TokenResponse>(this.config.oAuthParams.tokenUrl, tokenParams, { headers: tokenHeaders }));
         //             this._createClientLocation(location.locationNumber, clientIdentifierType, impClientLocationType).subscribe(res =>
         //             {
         //                // Assign clientLocation ids to the location

         //                // Persist the project
         //                this._createProject(impProject).subscribe(res =>
         //                {
         //                   // Load the project to get the IDs

         //                }
         //                ,err => {
         //                   console.warn('Error clientLocation ', clientLocation);
         //                });
         //             }
         //             ,err => {
         //                console.warn('Error clientLocation ', clientLocation);
         //             });
         //          }
         //          else
         //          // Handle case where client location exists, but need to persist the locations / project
         //          {

         //          }
         //       }
         //       console.log('ImpProject.service - pushing new geofootprint');
         //

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
               console.log('posting to: ' + this.appConfig.valServiceBase + 'v1/targeting/base/impproject/save');

               // TODO: Need to implement save in the data store
               this.http.post<RestResponse>(this.appConfig.valServiceBase + 'v1/targeting/base/impproject/save', payload, { headers: headers })
                        .pipe(tap(result => {
                              console.log ('Save post result: ', result);
                              if (result.returnCode === 200)
                              {
                                 impProject.projectId = result.payload;
                                 console.log('success response');
                              }
                              else
                              {
                                 impProject.projectId = null;
                                 console.log('failure response');
                              }
                              subject.next([impProject]);
                           }))
                           .subscribe(result => {
                                       subject.complete();
                                    }
                           , err => {
                              // Alert the user to the failed save
                              this.appMessagingService.stopSpinnerDialog('PROJECTSAVE');
                              this.appMessagingService.showGrowlError('Project Save', 'Project failed to save.');
                              console.warn('Error Saving project', err);
                              this.projectTransactionManager.stopTransaction();
                              subject.error('Project failed to save.'); // Error in subsequent catch
                           });
            }
            catch (error)
            {
               this.appMessagingService.stopSpinnerDialog('PROJECTSAVE');
               this.appMessagingService.showGrowlError('Project Save', 'Project failed to save.');
               console.error('ImpProject.service.saveProject - Error saving project: ', error);
               this.transactionManager.stopTransaction();
               subject.error(error); // Error in subsequent catch
            }
         }//);
         //return null;
      });

//      const loadObservable = this.reloadProject(impProject, true, true);

      let success: boolean = true;

      return saveObservable.pipe(concatMap(result => {
            console.log('saveObservable - result: ', result);
            return this.reloadProject(result[0], true, true);
         }),
         tap(next => console.log('tap next', next),
             error => console.log('tap error ', error),
             () => { console.log('tap complete'); }),
         catchError((err) => {
            console.warn('Error loading project', err);
            this.appMessagingService.showGrowlError('Project Save', 'Project failed to reload after save.');
            success = false; // Let the finalize know that the process failed
            return EMPTY;  // is same as subject.complete() this way because don't have access to a subject
         }),
         finalize<ImpProject[]>(() => {
            console.log('AppProjectService.saveProject - Reload from AppProject finished');
            this.projectTransactionManager.stopTransaction();
            this.appMessagingService.stopSpinnerDialog('PROJECTSAVE');
            // Alert the user to the successful save
            if (success)
            {
               this.appMessagingService.showGrowlSuccess('Project Save', 'Project ' + impProject.projectId + ' saved successfully.');
               console.log('Project ' + impProject.projectId + ' saved successfully.  Should have seen a growl');
            }
         })
      );
   }

  public getngDialogObs() : Observable<boolean> {
      return this.ngDialog.asObservable();
   }
}

