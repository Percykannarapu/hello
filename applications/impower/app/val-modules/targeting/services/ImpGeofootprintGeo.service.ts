/** A TARGETING domain data service representing the table: IMPOWER.IMP_GEOFOOTPRINT_GEOS
 **
 ** This class contains code operates against data in its data store.
 ** See the contents of val-modules/common/services/datastore.service.ts to see built in
 ** methods that all data services have.
 **
 ** NOTE: This class is generated only once and may be updated by developers.
 **
 ** ImpGeofootprintGeo.service.ts generated from VAL_ENTITY_GEN - v2.0
 **/
import { GeoAttribute } from '../../../impower-datastore/state/geo-attributes/geo-attributes.model';
import { selectGeoAttributeEntities } from '../../../impower-datastore/state/impower-datastore.selectors';
import { TransactionManager } from '../../common/services/TransactionManager.service';
import { ImpGeofootprintGeo } from '../models/ImpGeofootprintGeo';
import { RestDataService } from '../../common/services/restdata.service';
import { ColumnDefinition, DataStore } from '../../common/services/datastore.service';
import { Injectable } from '@angular/core';
import { EMPTY, Observable, BehaviorSubject } from 'rxjs';
import { TradeAreaTypeCodes } from '../targeting.enums';
import { ImpGeofootprintVar } from '../models/ImpGeofootprintVar';
import { DAOBaseStatus } from '../../api/models/BaseModel';
import { ImpProjectVar } from '../models/ImpProjectVar';
import { select, Store } from '@ngrx/store';
import { LocalAppState } from '../../../state/app.interfaces';
import { ErrorNotification, WarningNotification, SuccessNotification } from '@val/messaging';
import { FileService, Parser, ParseResponse } from '../../../val-modules/common/services/file.service';
import { groupBy, roundTo, mapArrayToEntity, safe } from '@val/common';

const dataUrl = 'v1/targeting/base/impgeofootprintgeo/search?q=impGeofootprintGeo';

export enum EXPORT_FORMAT_IMPGEOFOOTPRINTGEO {
   default,
   alteryx,
   custom
}

interface UploadMustCoverData {
   geocode: string;
}

const mustCoverUpload: Parser<UploadMustCoverData> = {
   columnParsers: [
      { headerIdentifier: ['GEO', 'ATZ', 'PCR', 'ZIP', 'DIG', 'ROUTE', 'GEOCODE', 'GEOGRAPHY'], outputFieldName: 'geocode', required: true}
   ]
};

@Injectable()
export class ImpGeofootprintGeoService extends DataStore<ImpGeofootprintGeo>
{
   private analysisLevelForExport: string;

   // this is intended to be a cache of the attributes and geos used for the geofootprint export
   private attributeCache: { [geocode: string] : GeoAttribute } = {};
   private varCache: Map<string, ImpGeofootprintVar[]> = new Map<string, ImpGeofootprintVar[]>();

   public  currentMustCoverFileName: string;
   public  mustCovers: string[] = [];
   public  allMustCoverBS$ = new BehaviorSubject<string[]>([]);


   constructor(restDataService: RestDataService,
               projectTransactionManager: TransactionManager,
               private store$: Store<LocalAppState>)
   {
      super(restDataService, dataUrl, projectTransactionManager, 'ImpGeofootprintGeo');
      this.store$.pipe(select(selectGeoAttributeEntities)).subscribe(attributes => this.attributeCache = attributes);
   }

   load(items: ImpGeofootprintGeo[]) : void {
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

   // TODO: David come back to this - check all in header will call this
   public setActive(setActiveData: ImpGeofootprintGeo | ImpGeofootprintGeo[] | ReadonlyArray<ImpGeofootprintGeo>, newIsActive: boolean)
   {
      if (Array.isArray(setActiveData))
         for (const geo of setActiveData)
            geo.isActive = newIsActive;
      else
         setActiveData.isActive = newIsActive;
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

         return Observable.create(observer => {
            this.postDBRemoves('Targeting', 'ImpGeofootprintGeo', 'v1', removesPayload)
                .subscribe(postResultCode => {
                     console.log('post completed, calling completeDBRemoves');
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
         this.store$.dispatch(new ErrorNotification({ message, notificationTitle: title}));
      else
         this.store$.dispatch(new WarningNotification({ message, notificationTitle: title}));
   }

   // -----------------------------------------------------------
   // EXPORT COLUMN HANDLER METHODS
   // -----------------------------------------------------------
   public exportVarGeoHeader(state: ImpGeofootprintGeoService)
   {
   // console.log('exportVar handler for #V-GEOHEADER fired');
      const analysisLevel = (state.analysisLevelForExport != null) ? state.analysisLevelForExport.toUpperCase() : 'ATZ';

      let varValue: any;

      switch (analysisLevel)
      {
         case 'ATZ':         varValue = 'VALATZ'; break;
         case 'ZIP':         varValue = 'VALZI';  break;
         case 'PCR':         varValue = 'VALCR';  break;
         case 'DIGITAL ATZ': varValue = 'VALDIG'; break;
      }
      if (varValue == null)
         console.error ('Couldn\'t set varValue for analysisLevel: ' + analysisLevel);

      return varValue;
   }

   public rank(arr, f) {
      return arr
      .map((x, i) => [x, i])
      .sort((a, b) => f(a[0], b[0]))
      .reduce((a, x, i, s) => (a[x[1]] = i > 0 && f(s[i - 1][0], x[0]) === 0 ? a[s[i - 1][1]] : i + 1, a), []);
   }

   public defaultSort (a: ImpGeofootprintGeo, b: ImpGeofootprintGeo) : number
   {
      if (a == null || b == null || a.impGeofootprintLocation == null || b.impGeofootprintLocation == null)
      {
         console.warn('sort criteria is null - a:', a, ', b: ', b);
         return 0;
      }

      if (a.impGeofootprintLocation.locationNumber === b.impGeofootprintLocation.locationNumber)
      {
         if (a.distance === b.distance)
         {
            if (a.hhc === b.hhc)
                  // We need a tie breaker at this point, look to the address it belongs to next
                if (a.impGeofootprintLocation.locAddress === b.impGeofootprintLocation.locAddress)
                   return 0;
                else {
                   if (a.impGeofootprintLocation.locAddress > b.impGeofootprintLocation.locAddress)
                      return 1;
                   else
                      return -1;
                }

            else
               if (a.hhc > b.hhc)
                  return -1;
               else
                  return  1;
         }
         else {
            if (a.distance > b.distance)
               return 1;
            else
               return -1;
         }
      }
      else
         if (a.impGeofootprintLocation.locationNumber > b.impGeofootprintLocation.locationNumber)
            return 1;
         else
            return -1;
   }


   // This is written deliberately verbose as I want to eventually genericize this
   public sortGeos (a: ImpGeofootprintGeo, b: ImpGeofootprintGeo) : number
   {
      if (a == null || b == null || a.impGeofootprintLocation == null || b.impGeofootprintLocation == null)
      {
         console.warn('sort criteria is null - a:', a, ', b: ', b);
         return 0;
      }

      if (a.geocode === b.geocode)
      {
         const isHomeGeoA: boolean = (a.geocode === a.impGeofootprintLocation.homeGeocode);
         const isHomeGeoB: boolean = (b.geocode === b.impGeofootprintLocation.homeGeocode);

         // If both a and b are home geos or both are not, disregard homegeo for comparison
         if ((isHomeGeoA && isHomeGeoB) || (!isHomeGeoA  && !isHomeGeoB))
         {
            if (roundTo(a.distance, 2) === roundTo(b.distance, 2))
            {
               if (a.hhc === b.hhc)
               {
                  if (a.impGeofootprintLocation != null && b.impGeofootprintLocation != null)
                  {
                     // We need a tie breaker at this point, look to the address it belongs to next
                     if (a.impGeofootprintLocation.locationNumber === b.impGeofootprintLocation.locationNumber)
                        return 0;
                     else
                     {
                        if (a.impGeofootprintLocation.locationNumber > b.impGeofootprintLocation.locationNumber)
                           return 1;
                        else
                           return -1;
                     }
                  }
                  else
                     return 0;
               }
               else
                  if (a.hhc > b.hhc)
                     return -1;
                  else
                     return  1;
            }
            else
            {
               if (a.distance > b.distance)
                  return 1;
               else
                  return -1;
            }
         }
         else
            // Either a or b is a home geo, but not both
            if (isHomeGeoA)
               return -1;
            else
               return  1;
      }
      else
         if (a.geocode > b.geocode)
            return 1;
         else
            return -1;
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

   public pl(msg) {
      console.log(msg);
      return msg;
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

      console.log('Calculating geo ranks for ', (geos != null) ? geos.length : 0, ' rows');
      this.denseRank(geos,  this.sortGeos, this.partitionGeos);
      console.log('Ranked ', (geos != null) ? geos.length : 0, ' geos');

      for (const geo of geos) {
         if (geo.rank === 0)
            geo.isDeduped = 1;
         else
            geo.isDeduped = 0;
      }
   }

   public sort(comparatorMethod)
   {
     return this.get().sort((a, b) => comparatorMethod(a, b));
   }

  public exportMustCoverFlag(state: ImpGeofootprintGeoService, geo: ImpGeofootprintGeo) {
    return  (state.mustCovers != null && state.mustCovers.includes(geo.geocode)) ? '1' : '0' ;
  }

  public exportVarStreetAddress(state: ImpGeofootprintGeoService, geo: ImpGeofootprintGeo)
   {
      let varValue: any;
      const truncZip = (geo.impGeofootprintLocation != null && geo.impGeofootprintLocation.locZip != null) ? geo.impGeofootprintLocation.locZip.slice(0, 5) : ' ';
      varValue = (geo != null && geo.impGeofootprintLocation != null)
                  ? '"' + geo.impGeofootprintLocation.locAddress + ', ' +
                          geo.impGeofootprintLocation.locCity    + ', ' +
                          geo.impGeofootprintLocation.locState   + ' ' +
                          truncZip + '"'
                  : null;
      return varValue;
   }

   public exportVarTruncateZip(state: ImpGeofootprintGeoService, geo: ImpGeofootprintGeo)
   {
      return (geo.impGeofootprintLocation != null && geo.impGeofootprintLocation.locZip != null) ? geo.impGeofootprintLocation.locZip.slice(0, 5) : null;
   }

   public exportVarIsHomeGeocode(state: ImpGeofootprintGeoService, geo: ImpGeofootprintGeo)
   {
      return (geo.impGeofootprintLocation != null && geo.geocode === geo.impGeofootprintLocation.homeGeocode) ? 1 : 0;
   }

   public exportVarOwnerTradeArea(state: ImpGeofootprintGeoService, geo: ImpGeofootprintGeo)
   {
      let varValue: any;

      if (geo != null && geo.impGeofootprintTradeArea != null)
      {
        switch (geo.impGeofootprintTradeArea.taType)
        {
          case 'RADIUS':
            varValue = 'Trade Area ' + geo.impGeofootprintTradeArea.taNumber;
            break;
          case 'HOMEGEO':
            varValue = 'Forced Home Geo';
            break;
          case 'AUDIENCE':
            varValue = 'Audience Trade Area';
            break;
          default:
            varValue = 'Custom';
        }
      }
      else
         return null;
      return varValue;
   }

   public exportVarAttributes(state: ImpGeofootprintGeoService, geo: ImpGeofootprintGeo, header: string) {
      let result = '';
      const currentAttribute = state.attributeCache[geo.geocode];
      if (currentAttribute != null) {
         const value = currentAttribute[header];
         result = value == null ? '' : value.toString();
      }
      const projectVarsDict = mapArrayToEntity(geo.impGeofootprintLocation.impProject.impProjectVars,  v => v.varPk);

      if (result === '' && state.varCache.has(geo.geocode)) {
        const vars: ImpGeofootprintVar[] = state.varCache.get(geo.geocode);
        const currentVar = vars.find(v => (projectVarsDict[v.varPk]||safe).fieldname === header && v.impGeofootprintTradeArea.impGeofootprintLocation === geo.impGeofootprintLocation);
        if (currentVar != null && currentVar.value != null) {
          // if (currentVar.isString) result = currentVar.valueString;
          // if (currentVar.isNumber) result = currentVar.valueNumber.toString();
          // We no longer have isString/isNumber, so use the field that has a value as only one will.
          result = currentVar.value.toString(); //currentVar.valueNumber != null ? currentVar.valueNumber.toString() : currentVar.valueString;
        }
      }
      if (!result || result == 'null') result = '';
      return result;
   }

   public addAdditionalExportColumns(exportColumns: ColumnDefinition<ImpGeofootprintGeo>[], insertAtPos: number)
   {
      const aGeo = this.get()[0];
      if (aGeo == null) return;
      const currentProject = aGeo.impGeofootprintLocation.impProject;  //DEFECT FIX : export feature - accessing project details from GeoFootPrintLocation
      const orderColumnNames = [];
      currentProject.impProjectVars.forEach(impVar => orderColumnNames[impVar.sortOrder] = impVar.fieldname);
      const projectVarsDict = mapArrayToEntity(currentProject.impProjectVars,  v => v.varPk);
      const usableGeoVars = currentProject.getImpGeofootprintVars().filter(gv => projectVarsDict[gv.varPk] != null && projectVarsDict[gv.varPk].isIncludedInGeofootprint);
      usableGeoVars.sort((a, b) => this.sortVars(a, b));
      this.varCache = groupBy(usableGeoVars, 'geocode');
      const columnSet = new Set(usableGeoVars.map(gv => (projectVarsDict[gv.varPk] || safe).fieldname));
      const attributeNames = Array.from(columnSet);
      attributeNames.sort((a, b) => {
        return orderColumnNames.indexOf(a) - orderColumnNames.indexOf(b);
      });
      attributeNames.forEach(name => {
        exportColumns.splice(insertAtPos++, 0, { header: name, row: this.exportVarAttributes});
      });
   }

   private sortVars(a, b) {
      if (a.varPosition > b.varPosition) {
        return 1;
      }
      if (a.varPosition < b.varPosition) {
        return -1;
      }
      return 0;
    }

   // -----------------------------------------------------------
   // EXPORT METHODS
   // -----------------------------------------------------------
   public exportStore(filename: string, exportFormat: EXPORT_FORMAT_IMPGEOFOOTPRINTGEO, analysisLevel: string, filter?: (geo: ImpGeofootprintGeo) => boolean)
   {
      this.analysisLevelForExport = analysisLevel;
      console.log('ImpGeofootprintGeo.service.exportStore - fired - dataStore.length: ' + this.length());
      let geos: ImpGeofootprintGeo[] = this.get();
      if (filter != null) geos = geos.filter(filter);
      // DE1742: display an error message if attempting to export an empty data store
      if (geos.length === 0) {
         this.store$.dispatch(new ErrorNotification({ message: 'You must add sites and select geographies prior to exporting the geofootprint', notificationTitle: 'Error Exporting Geofootprint' }));
         return; // need to return here so we don't create an invalid usage metric later in the function since the export failed
      }

      const exportColumns: ColumnDefinition<ImpGeofootprintGeo>[] = this.getExportFormat (exportFormat);

      // TODO make this a part of the getExportFormat
      this.addAdditionalExportColumns(exportColumns, 17);

      if (filename == null)
         filename = this.getFileName(analysisLevel);

      // This is for now, it replaces the data store with a sorted / ranked version
      this.calculateGeoRanks();
      geos.sort((a, b) => {
            const aOwner: any = a.impGeofootprintLocation.locationNumber;
            const bOwner: any = b.impGeofootprintLocation.locationNumber;
            return  aOwner - bOwner || a.distance - b.distance;
      });

      this.downloadExport(filename, this.prepareCSV(exportColumns, geos));
   }

   private getExportFormat (exportFormat: EXPORT_FORMAT_IMPGEOFOOTPRINTGEO) : ColumnDefinition<ImpGeofootprintGeo>[]
   {
      const exportColumns: ColumnDefinition<ImpGeofootprintGeo>[] = [];

      switch (exportFormat)
      {
         case EXPORT_FORMAT_IMPGEOFOOTPRINTGEO.alteryx:
            console.log ('setExportFormat - alteryx');
            exportColumns.push({ header: this.exportVarGeoHeader(this),  row: (state, data) => data.geocode});
            exportColumns.push({ header: 'Site Name',                    row: (state, data) => data.impGeofootprintLocation.locationName});
            exportColumns.push({ header: 'Site Description',             row: (state, data) => data.impGeofootprintLocation.description});
            exportColumns.push({ header: 'Site Street',                  row: (state, data) => data.impGeofootprintLocation.locAddress});
            exportColumns.push({ header: 'Site City',                    row: (state, data) => data.impGeofootprintLocation.locCity});
            exportColumns.push({ header: 'Site State',                   row: (state, data) => data.impGeofootprintLocation.locState});
            exportColumns.push({ header: 'Zip',                          row: this.exportVarTruncateZip});
            exportColumns.push({ header: 'Site Address',                 row: this.exportVarStreetAddress});
            exportColumns.push({ header: 'Market',                       row: (state, data) => data.impGeofootprintLocation.marketName});
            exportColumns.push({ header: 'Market Code',                  row: (state, data) => data.impGeofootprintLocation.marketCode});
            exportColumns.push({ header: 'Group Name',                   row: (state, data) => data.impGeofootprintLocation.groupName});
            exportColumns.push({ header: 'Passes Filter',                row: 1});
            exportColumns.push({ header: 'Distance',                     row: (state, data) => +data.distance.toFixed(2)});
            exportColumns.push({ header: 'Is User Home Geocode',         row: this.exportVarIsHomeGeocode});
            exportColumns.push({ header: 'Is Final Home Geocode',        row: this.exportVarIsHomeGeocode});
            exportColumns.push({ header: 'Is Must Cover',                row: this.exportMustCoverFlag});
            exportColumns.push({ header: 'Owner Trade Area',             row: this.exportVarOwnerTradeArea});
            exportColumns.push({ header: 'Owner Site',                   row: (state, data) => data.impGeofootprintLocation.locationNumber});
            exportColumns.push({ header: 'Include in Deduped Footprint', row: (state, data) => data.isDeduped}); // 1});
            exportColumns.push({ header: 'Base Count',                   row: null});
            exportColumns.push({ header: 'Is Selected?',                 row: (state, data) => data.isActive === true ? 1 : 0});

         break;

         // No format specified, derive from the object  TODO: IMPLEMENT
         default:
            console.log ('setExportFormat - default');
            exportColumns.push({ header: this.exportVarGeoHeader(this),  row: (state, data) => data.geocode});
            exportColumns.push({ header: 'Site Name',                    row: (state, data) => data.impGeofootprintLocation.locationName});
            exportColumns.push({ header: 'Site Description',             row: (state, data) => data.impGeofootprintLocation.description});
            exportColumns.push({ header: 'Site Street',                  row: (state, data) => data.impGeofootprintLocation.locAddress});
            exportColumns.push({ header: 'Site City',                    row: (state, data) => data.impGeofootprintLocation.locCity});
            exportColumns.push({ header: 'Site State',                   row: (state, data) => data.impGeofootprintLocation.locState});
            exportColumns.push({ header: 'Zip',                          row: this.exportVarTruncateZip});
            exportColumns.push({ header: 'Base Count',                   row: null});
            exportColumns.push({ header: 'Is Selected?',                 row: (state, data) => data.isActive});
            break;
      }
      return exportColumns;
   }

   // -----------------------------------------------------------
   // MUST COVER METHODS
   // -----------------------------------------------------------
   public parseMustCoverFile(dataBuffer: string, fileName: string) : string[] {
      //console.debug("### parseMustCoverFile fired");
      const rows: string[] = dataBuffer.split(/\r\n|\n/);
      const header: string = rows.shift();
      const errorTitle: string = 'Must Cover Geographies Upload';
      //const currentAnalysisLevel = this.stateService.analysisLevel$.getValue();

      try {
         // Parse the file data
         const data: ParseResponse<UploadMustCoverData> = FileService.parseDelimitedData(header, rows, mustCoverUpload);

         // Gather metrics about the upload
         const failCount = data.failedRows.length;
         const successCount = data.parsedData.length;

         // If there was a problem in the upload file, notify the user
         if (failCount > 0) {
            console.error('There were errors parsing the following rows in the CSV: ', data.failedRows);
            this.reportError(errorTitle, `There ${failCount > 1 ? 'were' : 'was'} ${failCount} row${failCount > 1 ? 's' : ''} in the uploaded file that could not be read.`);
         }

         // If the file did have some correct rows, begin processing them
         if (successCount > 0) {
            // Reduce the list of geographies down to the distinct list
            const uniqueGeos = new Set(data.parsedData.map(d => d.geocode));

            if (uniqueGeos.size !== data.parsedData.length) {
               this.reportError(errorTitle, 'Warning: The upload file did contain duplicate geocodes. Processing will continue, but consider evaluating and resubmiting the file.');
            }

            // Keep track of the current must cover upload filename
            this.currentMustCoverFileName = fileName;

            // // Create an array of must cover geographies
            // this.mustCovers = Array.from(uniqueGeos);

            // // Alert subscribers that we have a new list of must covers
            // this.allMustCoverBS$.next(this.mustCovers);

            this.setMustCovers(Array.from(uniqueGeos), true);

            console.log ('Uploaded ', this.mustCovers.length, ' must cover geographies');

            this.store$.dispatch(new SuccessNotification({ message: 'Upload Complete', notificationTitle: 'Must Cover Upload'}));

            return Array.from(uniqueGeos);
         }
      }
      catch (e) {
         this.reportError(errorTitle, `${e}`);
      }
      return [];
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
         console.error('### ERROR Parsing must cover string: ' + mustCoverCsv);
         console.error(e);
         return [];
      }
   }

   public clearMustCovers() {
      //console.debug("### clearMustCovers");
      this.mustCovers = [];
      // Alert subscribers that we have a new list of must covers
      this.allMustCoverBS$.next(this.mustCovers);
   }

   public setMustCovers(newMustCovers: string[], append: boolean = false)
   {
      console.log('setMustCovers Fired - ' + (newMustCovers != null ? newMustCovers.length : null) + ' new must covers');
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

}
