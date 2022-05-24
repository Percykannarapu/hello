/** A TARGETING domain data service representing the table: IMPOWER.IMP_GEOFOOTPRINT_GEOS
 **
 ** This class contains code operates against data in its data store.
 ** See the contents of val-modules/common/services/datastore.service.ts to see built in
 ** methods that all data services have.
 **
 ** ImpGeofootprintGeo.service.ts generated from VAL_ENTITY_GEN - v2.0
 **/
import { Injectable } from '@angular/core';
import { Dictionary } from '@ngrx/entity';
import { Store } from '@ngrx/store';
import { isEmpty, isNil, isString } from '@val/common';
import { EsriQueryService } from '@val/esri';
import { ErrorNotification, WarningNotification } from '@val/messaging';
import { AppConfig } from 'app/app.config';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { DynamicVariable } from 'app/impower-datastore/state/transient/dynamic-variable.model';
import { MustCoverRollDownGeos, RollDownGeosComplete } from 'app/state/data-shim/data-shim.actions';
import { asyncScheduler, BehaviorSubject, EMPTY, Observable, of, scheduled, throwError } from 'rxjs';
import { map, reduce, switchMap, tap } from 'rxjs/operators';
import { EsriConfigService } from '../../../../../../modules/esri/src/services/esri-config.service';
import { WorkerResponse, WorkerResult } from '../../../../worker-shared/common/core-interfaces';
import { DAOBaseStatus } from '../../../../worker-shared/data-model/impower.data-model.enums';
import {
  GeoFootprintExportFormats,
  GeoFootprintExportWorkerPayload,
  WorkerProcessReturnType
} from '../../../../worker-shared/export-workers/payloads';
import { MustCoverDataRow, mustCoverFileParser } from '../../../common/file-parsing-rules';
import { AnalysisLevel } from '../../../common/models/ui-enums';
import { PrettyGeoSort, RankGeoSort } from '../../../common/valassis-sorters';
import { WorkerFactory } from '../../../common/worker-factory';
import { LocalAppState } from '../../../state/app.interfaces';
import { DataStore } from '../../common/services/datastore.service';
import { FileService, ParseResponse } from '../../common/services/file.service';
import { LoggingService } from '../../common/services/logging.service';
import { RestDataService } from '../../common/services/restdata.service';
import { TransactionManager } from '../../common/services/TransactionManager.service';
import { ImpGeofootprintGeo } from '../models/ImpGeofootprintGeo';
import { ImpProject } from '../models/ImpProject';

interface CustomMCDefinition {
  Number: number;
  geocode: string;
}

const dataUrl = 'v1/targeting/base/impgeofootprintgeo/search?q=impGeofootprintGeo';

@Injectable({ providedIn: 'root' })
export class ImpGeofootprintGeoService extends DataStore<ImpGeofootprintGeo>
{
   private tempLocationId = 0;
   private tempTradeAreaId = 0;

   // this is intended to be a cache of the attributes and geos used for the geofootprint export
   public  currentMustCoverFileName: string;
   public  mustCovers: string[] = [];
   public  allMustCoverBS$ = new BehaviorSubject<string[]>([]);
   private allAudiencesBS$ = new BehaviorSubject<Audience[]>([]);
   private exportAudiencesBS$ = new BehaviorSubject<Audience[]>([]);
   private uploadFailuresSub: BehaviorSubject<CustomMCDefinition[]> = new BehaviorSubject<CustomMCDefinition[]>([]);
   public uploadFailuresObs$: Observable<CustomMCDefinition[]> = this.uploadFailuresSub.asObservable();
   public uploadFailures: CustomMCDefinition[] = [];
   public sharedGeos = new Map<string, string>();

   constructor(restDataService: RestDataService,
               projectTransactionManager: TransactionManager,
               private appConfig: AppConfig,
               private esriConfig: EsriConfigService,
               private esriQueryService: EsriQueryService,
               private store$: Store<LocalAppState>, logger: LoggingService)
   {
      super(restDataService, dataUrl, logger, projectTransactionManager, 'ImpGeofootprintGeo');
      this.store$.select(fromAudienceSelectors.allAudiences).subscribe(this.allAudiencesBS$);
      this.store$.select(fromAudienceSelectors.getAudiencesInFootprint).subscribe(this.exportAudiencesBS$);
    }

   load(items: ImpGeofootprintGeo[]) : void {
      this.tempTradeAreaId = 0;
      this.tempLocationId = 0;
      // fix up fields that aren't part of convertToModel()
      items.forEach(geo => {
        geo.impGeofootprintLocation = geo.impGeofootprintTradeArea.impGeofootprintLocation;
        geo.impGeofootprintMaster = geo.impGeofootprintLocation.impGeofootprintMaster;
        geo.impProject = geo.impGeofootprintMaster.impProject;
      });
      // load data store
      super.load(items);
   }

   // -----------------------------------------------------------
   // UTILITY METHODS
   // -----------------------------------------------------------
   public getFileName(analysisLevel: string, impProjectId?: Number)
   {
      try
      {
         const fmtDate: string = new Date().toISOString().replace(/\D/g, '').slice(0, 13);

         return 'GeoFootPrint' + '_' + ((impProjectId != null) ? impProjectId + '_' : '1') + '_' + ((analysisLevel != null) ? analysisLevel.toUpperCase() : '') + '_' + fmtDate + '.csv';
      }
      catch (e)
      {
         return 'GeoFootPrint.csv';
      }
   }

   public setActive(geocodes: string[], newIsActive?: boolean)
   {
     const updates = new Set(geocodes);
     const geos = this._storeSubject.getValue();
     for (const currenGeo of geos) {
       if (updates.has(currenGeo.geocode)) {
         currenGeo.isActive = newIsActive;
       }
     }
     this.makeDirty();
   }

   public deleteGeosById(ggIds: number[]) {
     const idsToDelete = new Set(ggIds);
     const allGeos = this._storeSubject.getValue();
     const geosToDelete: ImpGeofootprintGeo[] = [];
     for (const currenGeo of allGeos) {
       if (idsToDelete.has(currenGeo.ggId)) geosToDelete.push(currenGeo);
     }
     this.remove(geosToDelete);
   }

   // Get a count of DB removes from children of these parents
   public getTreeRemoveCount(impGeofootprintGeos: ImpGeofootprintGeo[]) : number {
      let count: number = 0;
      impGeofootprintGeos.forEach(impGeofootprintGeo => {
         count += this.dbRemoves.filter(remove => remove.ggId === impGeofootprintGeo.ggId).length;
      });
      return count;
   }

   // After DB removes have be executed, complete them by removing them from the data stores delete list
   public completeDBRemoves(completes: ImpGeofootprintGeo[]) {
      this.clearDBRemoves(completes);
   }

   // Return a tree of source nodes where they and their children are in the UNCHANGED or DELETE status
   public prune(source: ImpGeofootprintGeo[], filterOp: (impProject: ImpGeofootprintGeo) => boolean) : ImpGeofootprintGeo[]
   {
      if (source == null || source.length === 0)
         return source;

      return source.filter(filterOp);
   }

   // Process all of the removes, ensuring that children of removes are also removed and optionally performing the post
   public performDBRemoves(removes: ImpGeofootprintGeo[], doPost: boolean = true, mustRemove: boolean = false) : Observable<number>
   {
      if (mustRemove)
         this.remove(removes);

      if (doPost)
      {
         // Clone the parents as a base for the payload
         let removesPayload: ImpGeofootprintGeo[] = JSON.parse(JSON.stringify(removes));

         // Prune out just the deletes and unchanged from the parents and children
         removesPayload = this.prune(removesPayload, ta => ta.baseStatus == DAOBaseStatus.DELETE || ta.baseStatus === DAOBaseStatus.UNCHANGED);

         return new Observable(observer => {
            this.postDBRemoves('Targeting', 'ImpGeofootprintGeo', 'v1', removesPayload)
                .subscribe(postResultCode => {
                     this.logger.debug.log('post completed, calling completeDBRemoves');
                     this.completeDBRemoves(removes);
                     observer.next(postResultCode);
                     observer.complete();
                  });
         });
      }
      else
         return EMPTY;
   }

   private reportError(title: string, message: string, isError: Boolean = true) : void {
      if (isError)
         this.store$.dispatch(ErrorNotification({ message, notificationTitle: title}));
      else
         this.store$.dispatch(WarningNotification({ message, notificationTitle: title}));
   }

   public partitionGeos (p1: ImpGeofootprintGeo, p2: ImpGeofootprintGeo) : boolean
   {
      if (p1 == null || p2 == null)
      {
         return false;
      }

      // Partition within Geocode
      return (p1.geocode !== p2.geocode);
   }

   public invokePartitionBy(arr, index)
   {
      if (index >= arr.length - 1)
         return false;

      return arr[index].impGeofootprintLocation != arr[index + 1].impGeofootprintLocation;
   }

   public calculateGeoRanks()
   {
      const geos = this.get();

      this.logger.debug.log('Calculating geo ranks for ', this.length(), ' rows');
      this.denseRank(geos,  RankGeoSort, this.partitionGeos);
      this.logger.debug.log('Ranked ', this.length(), ' geos');

      for (const geo of geos) {
         if (isNil(geo.gtaId)) {
           if (isNil(geo.impGeofootprintTradeArea.gtaId)) {
             geo.impGeofootprintTradeArea.gtaId = --this.tempTradeAreaId;
           }
           geo.gtaId = geo.impGeofootprintTradeArea.gtaId;
         }
         if (isNil(geo.glId)) {
           if (isNil(geo.impGeofootprintLocation.glId)) {
             geo.impGeofootprintLocation.glId = --this.tempLocationId;
           }
           geo.glId = geo.impGeofootprintLocation.glId;
         }
         if (geo.rank === 0){
            geo.isDeduped = 1;
            if (geo.impGeofootprintTradeArea != null && geo.impGeofootprintTradeArea.impGeofootprintLocation != null)
               this.sharedGeos.set(geo.geocode, geo.impGeofootprintTradeArea.impGeofootprintLocation.locationNumber);
         }
         else
            geo.isDeduped = 0;
      }
      this.assignOwnerSite(geos);
   }

   private assignOwnerSite(geos: ImpGeofootprintGeo[]){
      if (this.sharedGeos != null && this.sharedGeos.size > 0){
      for (const geo of geos){
            geo.ownerSite = this.sharedGeos.get(geo.geocode);
         }
      }
   }

  public exportStore(filename: string, exportFormat: GeoFootprintExportFormats, project: ImpProject, geoVars: Dictionary<DynamicVariable>, selectedOnly: boolean) : Observable<WorkerResult> {
    this.logger.debug.log('ImpGeofootprintGeo.service.exportStore - fired - dataStore.length: ' + this.length());
    if (this.length() === 0) {
      return throwError('You must add sites and select geographies prior to exporting the geofootprint');
    } else {
      const currentGeos = this.get();
      if (isEmpty(filename)) filename = this.getFileName(project.methAnalysis, project.projectId);
      const worker = WorkerFactory.createGeoExportWorker();
      return scheduled(of(currentGeos), asyncScheduler).pipe(
        tap(geos => geos.sort(PrettyGeoSort)),
        map(geos => ({
          rows: geos,
          format: exportFormat,
          activeOnly: selectedOnly,
          outputType: WorkerProcessReturnType.BlobUrl,
          analysisLevel: project.methAnalysis,
          audienceData: geoVars,
          mustCovers: this.mustCovers,
          allAudiences: this.allAudiencesBS$.getValue(),
          exportedAudiences: this.exportAudiencesBS$.getValue(),
          locations: project.getImpGeofootprintLocations().map(loc => ({ ...loc, impGeofootprintTradeAreas: [] })),
          tradeAreas: project.getImpGeofootprintTradeAreas().map(ta => ({ ...ta, impGeofootprintLocation: null, impGeofootprintGeos: [], impGeofootprintMaster: null, impProject: null }))
        } as GeoFootprintExportWorkerPayload)),
        switchMap(payload => worker.start(payload)),
        tap((result: WorkerResponse<string>) => {
          this.logger.debug.log('Location Export response received from Web Worker: ', result);
          if (result.rowsProcessed > 0) FileService.downloadUrl(result.value, filename);
        })
      );
    }
  }

   // -----------------------------------------------------------
   // MUST COVER METHODS
   // -----------------------------------------------------------
   public parseMustCoverFile(dataBuffer: string | string[], fileName: string, analysisLevel: string, isResubmit: boolean, fileAnalysisLevel: string = null) : Observable<any> {
    //console.debug("### parseMustCoverFile fired");
    const rows: string[] = isString(dataBuffer) ?  dataBuffer.split(/\r\n|\n|\r/) : dataBuffer;
    const header: string = rows.shift();
    const errorTitle: string = fileName === 'manual' ? 'Must Cover Geographies Manually Add' : 'Must Cover Geographies Upload' ;

    //const currentAnalysisLevel = this.stateService.analysisLevel$.getValue();

    try {
       // Parse the file data
       const data: ParseResponse<MustCoverDataRow> = FileService.parseDelimitedData(header, rows, mustCoverFileParser);
       // Gather metrics about the upload
       const failCount = data.failedRows.length;
       const successCount = data.parsedData.length;

       // If there was a problem in the upload file, notify the user
       if (failCount > 0) {
          this.logger.error.log('There were errors parsing the following rows in the CSV: ', data.failedRows);
          this.reportError(errorTitle, `There ${failCount > 1 ? 'were' : 'was'} ${failCount} row${failCount > 1 ? 's' : ''} in the uploaded file that could not be read.`);
       }

       // If the file did have some correct rows, begin processing them
       if (successCount > 0) {
          // Reduce the list of geographies down to the distinct list
          const uniqueGeos = new Set(data.parsedData.map(d => d.geocode));

          if (uniqueGeos.size !== data.parsedData.length) {
               if (fileName === 'manual')
                   this.store$.dispatch(WarningNotification({message: 'Manually added geos contain duplicate geocodes. Processing will continue, though you may want to re-evaluate the geos in the manual add section.',
                                                           notificationTitle: 'Must Cover Manual'}));
               else
                    this.store$.dispatch(WarningNotification({message: 'The upload file contains duplicate geocodes. Processing will continue, though you may want to re-evaluate the upload file.',
                                                            notificationTitle: 'Must Cover Upload'}));
             //this.reportError(errorTitle, 'Warning: The upload file did contain duplicate geocodes. Processing will continue, but consider evaluating and resubmiting the file.');
          }

          const outfields = ['geocode', 'latitude', 'longitude'];
          const queryResult = new Set<string>();
          const queryResultMap = new Map<string, {latitude: number, longitude: number}>();
          if (fileAnalysisLevel === 'ZIP' || fileAnalysisLevel === 'ATZ' || fileAnalysisLevel === 'PCR' || fileAnalysisLevel === 'Digital ATZ'){
            const effectiveAnalysisLevel = AnalysisLevel.parse(fileAnalysisLevel ?? analysisLevel);
            const layerUrl = this.esriConfig.getAnalysisBoundaryUrl(effectiveAnalysisLevel, false);

            return this.esriQueryService.queryAttributeIn(layerUrl, 'geocode', Array.from(uniqueGeos), false, outfields).pipe(
               map(graphics => graphics.map(g => g.attributes)),
               reduce((acc, result) => acc.concat(result), []),
               map(attrs => {
                 attrs.forEach(r => {
                    queryResultMap.set(r.geocode, { latitude: r.latitude, longitude: r.longitude });
                    queryResult.add(r.geocode);
                 });

                //  if (analysisLevel !== fileAnalysisLevel){
                     this.store$.dispatch(new MustCoverRollDownGeos({geos: Array.from(queryResult), queryResult: queryResultMap,
                                                                     fileAnalysisLevel: fileAnalysisLevel, fileName: fileName,
                                                                     uploadedGeos: data.parsedData, isResubmit: isResubmit}));
                 // }
                  /*else{
                     this.validateMustCoverGeos(Array.from(uniqueGeos), queryResult, fileName, isResubmit);
                  }*/
               })
            );
         }
         else {
            this.store$.dispatch(new MustCoverRollDownGeos({geos: Array.from(uniqueGeos),
                                                            queryResult: queryResultMap, fileAnalysisLevel: fileAnalysisLevel,
                                                            fileName: fileName, uploadedGeos: data.parsedData, isResubmit: isResubmit}));
         }
       }
      }
      catch (e) {
        this.store$.dispatch(ErrorNotification({ message: 'Geocode is a required column in the upload file', notificationTitle: 'Must Cover Upload' }));
      }
      return EMPTY;
    }

   public parseMustCoverString(mustCoverCsv: string) : string[] {
      try
      {
         if (mustCoverCsv != null && mustCoverCsv != '')
         {
            return mustCoverCsv.split(new RegExp('\\s*,\\s*'));

            // Split out the string into an array
            //this.mustCovers = mustCoverCsv.split(new RegExp('\\s*,\\s*'));

            // // Alert subscribers that we have a new list of must covers
            // this.allMustCoverBS$.next(this.mustCovers);
         }
      }
      catch (e) {
         this.logger.error.log('ERROR Parsing must cover string: ' + mustCoverCsv);
         this.logger.error.log(e);
         return [];
      }
   }

   public clearMustCovers() {
      //console.debug("### clearMustCovers");
      this.mustCovers = [];
     // this.uploadFailures = [];
      // Alert subscribers that we have a new list of must covers
      this.allMustCoverBS$.next(this.mustCovers);
   }

   public setMustCovers(newMustCovers: string[], append: boolean = false) {
      this.logger.debug.log('setMustCovers Fired - ' + (newMustCovers != null ? newMustCovers.length : null) + ' new must covers');
      if (newMustCovers != null && newMustCovers.length != 0)
      {
         // Reduce the list of geographies down to the distinct list
         const uniqueGeos = (append) ? new Set([...this.mustCovers, ...newMustCovers]) : new Set(newMustCovers);

         //console.debug("### setMustCovers to " + uniqueGeos.size + " new mustcovers" + ((append === true) ? " (" + newMustCovers.length + " appended)":""));
         this.mustCovers = this.mustCovers = Array.from(uniqueGeos);

         // Alert subscribers that we have a new list of must covers
         //console.debug("### setMustCovers alerting subscribers of " + this.mustCovers.length + " mustcovers");
         this.allMustCoverBS$.next(this.mustCovers);
      }
   }

   public validateMustCoverGeos(uniqueGeos: string[], queryResult: Set<string>, fileName: string, isResubmit: boolean){
      const successGeo = [];
      const errorGeo: CustomMCDefinition[] = [];
      let i = this.uploadFailures.length > 0 ? Math.max(...this.uploadFailures.map(geo => geo.Number)) + 1 : 0;
      uniqueGeos.forEach(geo => {
      const customMc: CustomMCDefinition = { Number: i++, geocode: geo };
      queryResult.has(geo) ? successGeo.push(geo) : errorGeo.push(customMc);        });

      this.uploadFailuresSub.next(errorGeo);
                  // Keep track of the current must cover upload filename
      this.currentMustCoverFileName = fileName;
      this.setMustCovers(successGeo, true);
      this.store$.dispatch(new RollDownGeosComplete({failedGeos: this.uploadFailures.map(row => row.geocode), isResubmit: isResubmit, rollDownType: 'MUSTCOVER'}));
   }

   public persistMustCoverRollDownGeos(payload: any[], failedGeos: any[], fileName: string){
      const successGeo = [];
      const errorGeo: CustomMCDefinition[] = [];
      let i = this.uploadFailures.length > 0 ? Math.max(...this.uploadFailures.map(geo => geo.Number)) + 1 : 0;
      //let i = 0;
      payload.forEach(record => successGeo.push(record.geocode));
      failedGeos.forEach(geo => {
         const customMc: CustomMCDefinition = { Number: i++, geocode: geo.geocode };
         errorGeo.push(customMc);
      });
      this.uploadFailuresSub.next(errorGeo);
      this.currentMustCoverFileName = fileName;
      this.setMustCovers(successGeo, true);
      this.logger.debug.log ('Uploaded ', this.mustCovers.length, ' must cover geographies');
      return errorGeo.map(geo => geo.geocode);
   }

}
