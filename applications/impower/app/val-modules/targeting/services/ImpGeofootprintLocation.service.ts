/** A TARGETING domain data service representing the table: IMPOWER.IMP_GEOFOOTPRINT_LOCATIONS
 **
 ** This class contains code operates against data in its data store.
 ** See the contents of val-modules/common/services/datastore.service.ts to see built in
 ** methods that all data services have.
 **
 ** NOTE: This class is generated only once and may be updated by developers.
 **
 ** ImpGeofootprintLocation.service.ts generated from VAL_ENTITY_GEN - v2.0
 **/
import { Injectable } from '@angular/core';
import { Action, Store } from '@ngrx/store';
import { isEmpty, isString, simpleFlatten } from '@val/common';
import { ErrorNotification, SuccessNotification } from '@val/messaging';
import { LocationBySiteNum } from 'app/common/valassis-sorters';
import { EMPTY, Observable, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WorkerResponse, WorkerResult } from '../../../../worker-shared/common/core-interfaces';
import { DAOBaseStatus, SuccessfulLocationTypeCodes } from '../../../../worker-shared/data-model/impower.data-model.enums';
import { LocationExportFormats, LocationExportWorkerPayload, WorkerProcessReturnType } from '../../../../worker-shared/export-workers/payloads';
import { WorkerFactory } from '../../../common/worker-factory';
import { LocalAppState } from '../../../state/app.interfaces';
import { callbackElementType, callbackSuccessType, DataStore, InTransaction } from '../../common/services/datastore.service';
import { FileService } from '../../common/services/file.service';
import { LoggingService } from '../../common/services/logging.service';
import { RestDataService } from '../../common/services/restdata.service';
import { TransactionManager } from '../../common/services/TransactionManager.service';
import { ImpGeofootprintLocation } from '../models/ImpGeofootprintLocation';
import { ImpProject } from '../models/ImpProject';
import { ImpGeofootprintLocAttribService } from './ImpGeofootprintLocAttrib.service';
import { ImpGeofootprintTradeAreaService } from './ImpGeofootprintTradeArea.service';

const dataUrl = 'v1/targeting/base/impgeofootprintlocation/search?q=impGeofootprintLocation';

@Injectable()
export class ImpGeofootprintLocationService extends DataStore<ImpGeofootprintLocation>
{
   public  removes: ImpGeofootprintLocation[];

   constructor(restDataService: RestDataService,
               projectTransactionManager: TransactionManager,
               private impGeofootprintTradeAreaService: ImpGeofootprintTradeAreaService,
               private impGeoFootprintLocAttribService: ImpGeofootprintLocAttribService,
               private store$: Store<LocalAppState>,
               logger: LoggingService)
    {
      super(restDataService, dataUrl, logger, projectTransactionManager, 'ImpGeofootprintLocation');
    }

    load(items: ImpGeofootprintLocation[]) : void {
      // fixup fields that aren't part of convertToModel()
      items.forEach(loc => {
        loc.impProject = loc.impGeofootprintMaster.impProject;
      });
      // load data stores
      this.impGeoFootprintLocAttribService.load(simpleFlatten(items.map(l => l.impGeofootprintLocAttribs)));
      this.impGeofootprintTradeAreaService.load(simpleFlatten(items.map(l => l.impGeofootprintTradeAreas)));
      super.load(items);
    }

  public add(
    dataArray: ImpGeofootprintLocation[] | ReadonlyArray<ImpGeofootprintLocation>,
    preOperation?: callbackElementType<ImpGeofootprintLocation>,
    postOperation?: callbackSuccessType<ImpGeofootprintLocation>,
    inTransaction: InTransaction = InTransaction.true) {
     this.logger.debug.log('Adding data to location datastore', dataArray.length);
    super.add(dataArray, preOperation, postOperation, inTransaction);
  }

   // -----------------------------------------------------------
   // UTILITY METHODS
   // -----------------------------------------------------------

   // Get a count of DB removes from children of these parents
   public getTreeRemoveCount(impGeofootprintLocations: ImpGeofootprintLocation[]) : number {
      let count: number = 0;
      impGeofootprintLocations.forEach(impGeofootprintLocation => {
         count += this.dbRemoves.filter(remove => remove.glId === impGeofootprintLocation.glId).length;
         count += this.impGeoFootprintLocAttribService.getTreeRemoveCount(this.impGeoFootprintLocAttribService.get().filter(attrib => attrib.glId  === impGeofootprintLocation.glId).concat
                                                                         (this.impGeoFootprintLocAttribService.dbRemoves.filter(attrib => attrib.glId  === impGeofootprintLocation.glId)));
         count += this.impGeofootprintTradeAreaService.getTreeRemoveCount(this.impGeofootprintTradeAreaService.get().filter(ta => ta.glId === impGeofootprintLocation.glId).concat
                                                                         (this.impGeofootprintTradeAreaService.dbRemoves.filter(ta => ta.glId === impGeofootprintLocation.glId)));
      });
      return count;
   }

   // After DB removes have be executed, complete them by removing them from the data stores delete list
   public completeDBRemoves(completes: ImpGeofootprintLocation[]) {
      completes.forEach(complete => {
         this.impGeoFootprintLocAttribService.completeDBRemoves(this.impGeoFootprintLocAttribService.get().filter(attrib => attrib.glId  === complete.glId));
         this.impGeofootprintTradeAreaService.completeDBRemoves(this.impGeofootprintTradeAreaService.get().filter(ta => ta.glId === complete.glId));
      });
      this.clearDBRemoves(completes);
   }

   // Return a tree of source nodes where they and their children are in the UNCHANGED or DELETE status
   public prune(source: ImpGeofootprintLocation[], filterOp: (impGeofootprintLocation: ImpGeofootprintLocation) => boolean) : ImpGeofootprintLocation[]
   {
      if (source == null || source.length === 0)
         return source;

      const result: ImpGeofootprintLocation[] = source.filter(filterOp).filter(tree => this.getTreeRemoveCount([tree]) > 0);

      result.forEach (loc => {
         loc.impGeofootprintLocAttribs = this.impGeoFootprintLocAttribService.prune(loc.impGeofootprintLocAttribs, locAttr => locAttr.glId === loc.glId && (locAttr.baseStatus === DAOBaseStatus.UNCHANGED || locAttr.baseStatus === DAOBaseStatus.DELETE));
         loc.impGeofootprintTradeAreas = this.impGeofootprintTradeAreaService.prune(loc.impGeofootprintTradeAreas, ta => ta.glId === loc.glId && (ta.baseStatus === DAOBaseStatus.UNCHANGED || ta.baseStatus === DAOBaseStatus.DELETE));
      });

      return result;
   }

   // Process all of the removes, ensuring that children of removes are also removed and optionally performing the post
   public performDBRemoves(removes: ImpGeofootprintLocation[], doPost: boolean = true, mustRemove: boolean = false) : Observable<number>
   {
      const impGeofootprintLocationRemoves:  ImpGeofootprintLocation[]  = [];

      // Prepare database removes for all parents in removes
      removes.forEach(loc => {
         // If a root level removal or if a direct parent was removed, flag this object for removal
         if (mustRemove)
            this.remove(loc);

         const hasRemoves: boolean = this.getTreeRemoveCount([loc]) > 0;

         if (hasRemoves)
         {
            // Determine if the parent is already in the remove list
            const parentRemove: boolean = this.dbRemoves.includes(loc);

            // Parent gets added to removes even if not being deleted to act as a container
            if (parentRemove)
               impGeofootprintLocationRemoves.push(loc);

            // Parent is being removed, all children must be removed as well
            if (parentRemove)
            {
               this.impGeoFootprintLocAttribService.performDBRemoves(this.impGeoFootprintLocAttribService.get().filter(attrib => attrib.glId === loc.glId), false, true);
               this.impGeofootprintTradeAreaService.performDBRemoves(this.impGeofootprintTradeAreaService.get().filter(ta => ta.glId === loc.glId), false, true);
            }
            else
            // Parent is not being removed, only children already marked for removal will be deleted
            {
               this.impGeoFootprintLocAttribService.performDBRemoves(
                 this.impGeoFootprintLocAttribService.filterBy(attrib => attrib.glId === loc.glId  && attrib.baseStatus === DAOBaseStatus.DELETE, (attrib) => this.impGeoFootprintLocAttribService.getTreeRemoveCount(attrib), false, true, true),
                 false, false);
               this.impGeofootprintTradeAreaService.performDBRemoves(
                 this.impGeofootprintTradeAreaService.filterBy(ta => ta.glId === loc.glId          && ta.baseStatus     === DAOBaseStatus.DELETE, (ta)     => this.impGeofootprintTradeAreaService.getTreeRemoveCount(ta),     false, true, true),
                 false, false);
            }
         }
      });

      if (doPost)
      {
         // Clone the parents as a base for the payload
         let removesPayload: ImpGeofootprintLocation[] = JSON.parse(JSON.stringify(impGeofootprintLocationRemoves));

         // Prune out just the deletes and unchanged from the parents and children
         removesPayload = this.prune(removesPayload, ta => ta.baseStatus == DAOBaseStatus.DELETE || ta.baseStatus === DAOBaseStatus.UNCHANGED);

         return new Observable(observer => {
            this.postDBRemoves('Targeting', 'ImpGeofootprintLocation', 'v1', removesPayload)
                .subscribe(postResultCode => {
                     console.log('post completed, calling completeDBRemoves');
                     this.completeDBRemoves(impGeofootprintLocationRemoves);
                     observer.next(postResultCode);
                     observer.complete();
                  });
         });
      }
      else
         return EMPTY;
   }

   public getFileName(impProjectId: number, siteType: string)
   {
      try
      {
         const fmtDate: string = new Date().toISOString().replace(/\D/g, '').slice(0, 13);
         return `${siteType}_${impProjectId ?? 1}_${fmtDate}.csv`;
      }
      catch (e)
      {
         return 'Locations.csv';
      }
   }

   public getNextLocationNumber() : number
   {
      return this.getNextStoreId();
   }

    public exportStore(filename: string, exportFormat: LocationExportFormats, project: ImpProject, siteType: SuccessfulLocationTypeCodes) : Observable<WorkerResult> {
      this.logger.debug.log('ImpGeofootprintGeo.service.exportStore - fired - dataStore.length: ' + this.length());
      if (this.length() === 0) {
        return throwError('You must add sites or competitors prior to exporting');
      } else {
        const payload: LocationExportWorkerPayload = {
          rows: this.get().sort(LocationBySiteNum),
          format: exportFormat,
          siteType: siteType,
          currentProject: {
            ...project,
            impGeofootprintMasters: [],
            impProjectPrefs: [],
            impProjectVars: []
          } as any,
          activeOnly: false,
          includeAllAttributes: exportFormat === LocationExportFormats.alteryx,
          outputType: exportFormat === LocationExportFormats.digital ? WorkerProcessReturnType.OutputData : WorkerProcessReturnType.BlobUrl
        };
        const pluralType = `${siteType}s`;
        if (isEmpty(filename)) filename = this.getFileName(project.projectId, pluralType);
        const worker = WorkerFactory.createLocationExportWorker();
        return worker.start(payload).pipe(
          tap((result: WorkerResponse<string | string[]>) => {
            this.logger.debug.log('Location Export response received from Web Worker: ', result);
            if (result.rowsProcessed > 0) this.processResponse(result.value, filename, exportFormat, project);
          })
        );
      }
    }

  private processResponse(result: string | string[], filename: string, exportFormat: LocationExportFormats, project: ImpProject) {
    if (isString(result)) {
      FileService.downloadUrl(result, filename);
    } else {
      const dataString = FileService.downloadDelimitedFile(filename, result);
      if (exportFormat === LocationExportFormats.digital) {
        this.uploadVlhData(dataString, filename, project, result.length - 1); // -1 for the header
      }
    }
  }

   private uploadVlhData(dataString: string, filename: string, project: ImpProject, recordCount: number) {
     const serviceUrl = `v1/targeting/base/vlh?fileName=${filename}`;
     this.rest.postCSV(serviceUrl, dataString).subscribe(res => {
       this.logger.debug.log('Response from vlh', res);
       const notificationTitle = 'Send Custom Sites';
       let notification: Action;
       const site = recordCount > 1 ? 'sites' : 'site';
       if (res.returnCode === 200) {
         notification = new SuccessNotification({ notificationTitle, message: `Sent ${recordCount} ${site} to Valassis Digital successfully for ${project.clientIdentifierName.trim()}. \n
                ◼ Data will be returned by 9:00 AM tomorrow if submitted by 5:00 PM ET.
                ◼ Custom VLH data will be removed 90 days after submit date`});
       } else {
         notification = new ErrorNotification({ notificationTitle, message: `Error sending ${recordCount} ${site} to Valassis Digital for ${project.clientIdentifierName.trim()}`});
       }
       this.store$.dispatch(notification);
     });
   }
}
