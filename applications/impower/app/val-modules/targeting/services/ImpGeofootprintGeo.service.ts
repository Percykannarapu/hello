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

import { select, Store } from '@ngrx/store';
import { roundTo } from '@val/common';
import { EsriQueryService } from '@val/esri';

import { ErrorNotification, WarningNotification } from '@val/messaging';
import { AppConfig } from 'app/app.config';

import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';

import { selectGeoAttributeEntities } from 'app/impower-datastore/state/transient/geo-attributes/geo-attributes.selectors';
import { GeoVar } from 'app/impower-datastore/state/transient/geo-vars/geo-vars.model';
import * as fromGeoVarSelectors from 'app/impower-datastore/state/transient/geo-vars/geo-vars.selectors';
import { MustCoverRollDownGeos, RollDownGeosComplete } from 'app/state/data-shim/data-shim.actions';

import { BehaviorSubject, EMPTY, Observable } from 'rxjs';

import { map } from 'rxjs/operators';
import { FieldContentTypeCodes } from '../../../impower-datastore/state/models/impower-model.enums';
import { GeoAttribute } from '../../../impower-datastore/state/transient/geo-attributes/geo-attributes.model';
import { LocalAppState } from '../../../state/app.interfaces';
import { DAOBaseStatus } from '../../api/models/BaseModel';
import { ColumnDefinition, DataStore } from '../../common/services/datastore.service';
import { FileService, Parser, ParseResponse, ParseRule } from '../../common/services/file.service';
import { LoggingService } from '../../common/services/logging.service';
import { RestDataService } from '../../common/services/restdata.service';
import { TransactionManager } from '../../common/services/TransactionManager.service';

import { ImpGeofootprintGeo } from '../models/ImpGeofootprintGeo';
import { ImpGeofootprintVar } from '../models/ImpGeofootprintVar';

interface CustomMCDefinition {
  Number: number;
  geocode: string;
}

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
   ],
   createNullParser: (header: string, isUnique?: boolean) : ParseRule => {
      return { headerIdentifier: '', outputFieldName: header, dataProcess: data => data};
    }
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
   private allAudiencesBS$ = new BehaviorSubject<Audience[]>([]);
   private exportAudiencesBS$ = new BehaviorSubject<Audience[]>([]);
   private geoVarsBS$ = new BehaviorSubject<Dictionary<GeoVar>>({});
   private uploadFailuresSub: BehaviorSubject<CustomMCDefinition[]> = new BehaviorSubject<CustomMCDefinition[]>([]);
   public uploadFailuresObs$: Observable<CustomMCDefinition[]> = this.uploadFailuresSub.asObservable();
   public uploadFailures: CustomMCDefinition[] = [];
   private isMarket: boolean = true;


   constructor(restDataService: RestDataService,
               projectTransactionManager: TransactionManager,
               private appConfig: AppConfig,
               private esriQueryService: EsriQueryService,
              // private appProjectPrefService: AppProjectPrefService,
               private store$: Store<LocalAppState>, logger: LoggingService)
   {
      super(restDataService, dataUrl, logger, projectTransactionManager, 'ImpGeofootprintGeo');
      this.store$.pipe(select(selectGeoAttributeEntities)).subscribe(attributes => this.attributeCache = attributes);
      this.store$.select(fromAudienceSelectors.getAllAudiences).subscribe(this.allAudiencesBS$);
      this.store$.select(fromAudienceSelectors.getAudiencesInFootprint).subscribe(this.exportAudiencesBS$);
      this.store$.select(fromGeoVarSelectors.getGeoVarEntities).subscribe(this.geoVarsBS$);
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
         this.store$.dispatch(new ErrorNotification({ message, notificationTitle: title}));
      else
         this.store$.dispatch(new WarningNotification({ message, notificationTitle: title}));
   }

   // -----------------------------------------------------------
   // EXPORT COLUMN HANDLER METHODS
   // -----------------------------------------------------------
   public exportVarGeoHeader(state: ImpGeofootprintGeoService)
   {
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
         this.logger.error.log ('Couldn\'t set varValue for analysisLevel: ' + analysisLevel);

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
         this.logger.warn.log('sort criteria is null - a:', a, ', b: ', b);
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
         this.logger.warn.log('sort criteria is null - a:', a, ', b: ', b);
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
      this.logger.debug.log(msg);
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

      this.logger.debug.log('Calculating geo ranks for ', (geos != null) ? geos.length : 0, ' rows');
      this.denseRank(geos,  this.sortGeos, this.partitionGeos);
      this.logger.debug.log('Ranked ', (geos != null) ? geos.length : 0, ' geos');

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
         if (geo.impGeofootprintLocation != null && geo.geocode === geo.impGeofootprintLocation.homeGeocode && (geo.impGeofootprintTradeArea.taType === 'RADIUS' || geo.impGeofootprintTradeArea.taType === 'HOMEGEO'))
         {
            varValue = 'Trade Area 1';
         }
         else
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
               case 'MANUAL':
                  varValue = 'Manual Trade Area';
                  break;
               default:
                  varValue = 'Custom';
            }
         }
      }
      else
         return null;
      return varValue;
   }

  public exportVarAttributes(state: ImpGeofootprintGeoService, geo: ImpGeofootprintGeo, audience: Audience, header: string) {
    let result = '';
    const locNum = geo.impGeofootprintLocation.locationNumber;
    const currentAttribute = state.attributeCache[geo.geocode];
    if (currentAttribute != null) {
      const value = currentAttribute[header];
      if (value != null) {
        return value.toString();
      }
    }

    const exportAudiences = state.exportAudiencesBS$.getValue();

    if (audience != null) {
      const geoVar = state.geoVarsBS$.value[geo.geocode];
      if (geoVar != null) {
        if (geoVar[audience.audienceIdentifier] != null) {
          switch (audience.fieldconte) {
            case FieldContentTypeCodes.Char:
              result = geoVar[audience.audienceIdentifier].toString();
              break;

            case FieldContentTypeCodes.Percent:
            //   for (const aud in exportAudiences){
            //     if (exportAudiences[aud].isCombined && exportAudiences[aud].exportInGeoFootprint){
            //       geoVar[exportAudiences[aud].audienceIdentifier] = exportAudiences[aud].combinedAudiences.reduce((p, c) => {
            //         p += geoVar[c] as number;
            //         return p;
            //       }, 0);
            //       result = geoVar[exportAudiences[aud].audienceIdentifier].toString();
            //     }
            //   }
              result = geoVar[audience.audienceIdentifier].toString();
              break;
            case FieldContentTypeCodes.Ratio:
              result = Number.parseFloat(geoVar[audience.audienceIdentifier].toString()).toFixed(2);
              break;

            default:
              result = Number.parseFloat(geoVar[audience.audienceIdentifier].toString()).toFixed(0);
              break;
          }
        }
        else if (geoVar[`${locNum}:${audience.audienceIdentifier}`] != null){
          result = geoVar[`${locNum}:${audience.audienceIdentifier}`].toString();
        }
        else
          result = '';
      }
    }

    return result;
  }

   public addAdditionalExportColumns(exportColumns: ColumnDefinition<ImpGeofootprintGeo>[], insertAtPos: number)
   {
      const aGeo = this.get()[0];
      if (aGeo == null) return;
      // const currentProject = aGeo.impGeofootprintLocation.impProject;  //DEFECT FIX : export feature - accessing project details from GeoFootPrintLocation
      // const orderColumnNames = [];

      this.exportAudiencesBS$.value.forEach(impVar => {
        // If more than one variable has this audience name, add the source name to the header
        const dupeNameCount = (this.allAudiencesBS$.getValue() != null) ? this.allAudiencesBS$.getValue().filter(aud => aud.audienceName === impVar.audienceName).length : 0;
        const header = (dupeNameCount <= 1) ? impVar.audienceName : impVar.audienceName + ' (' + impVar.audienceSourceName + ')';
        const closure = (state: ImpGeofootprintGeoService, geo: ImpGeofootprintGeo, h: string) => this.exportVarAttributes(state, geo, impVar, h);
        exportColumns.splice(insertAtPos++, 0, { header: header, row: closure });
      });
   }

   // -----------------------------------------------------------
   // EXPORT METHODS
   // -----------------------------------------------------------
   public exportStore(filename: string, exportFormat: EXPORT_FORMAT_IMPGEOFOOTPRINTGEO, analysisLevel: string, filter?: (geo: ImpGeofootprintGeo) => boolean)
   {
      this.analysisLevelForExport = analysisLevel;
      this.logger.debug.log('ImpGeofootprintGeo.service.exportStore - fired - dataStore.length: ' + this.length());
      let geos: ImpGeofootprintGeo[] = this.get();
      if (filter != null) geos = geos.filter(filter);

      if (geos.length === 0) {
         this.store$.dispatch(new ErrorNotification({ message: 'You must add sites and select geographies prior to exporting the geofootprint', notificationTitle: 'Error Exporting Geofootprint' }));
         return; // need to return here so we don't create an invalid usage metric later in the function since the export failed
      }

      this.isMarket = this.get().some(geo => (geo.impGeofootprintLocation.marketName != null && geo.impGeofootprintLocation.marketName !== '') || (geo.impGeofootprintLocation.marketCode != null &&  geo.impGeofootprintLocation.marketCode !== ''));

      const exportColumns: ColumnDefinition<ImpGeofootprintGeo>[] = this.getExportFormat (exportFormat);

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
            this.logger.debug.log ('setExportFormat - alteryx');
            exportColumns.push({ header: this.exportVarGeoHeader(this),  row: (state, data) => data.geocode});
            exportColumns.push({ header: 'Site Name',                    row: (state, data) => data.impGeofootprintLocation.locationName});
            exportColumns.push({ header: 'Site Description',             row: (state, data) => data.impGeofootprintLocation.description});
            exportColumns.push({ header: 'Site Street',                  row: (state, data) => data.impGeofootprintLocation.locAddress});
            exportColumns.push({ header: 'Site City',                    row: (state, data) => data.impGeofootprintLocation.locCity});
            exportColumns.push({ header: 'Site State',                   row: (state, data) => data.impGeofootprintLocation.locState});
            exportColumns.push({ header: 'Zip',                          row: this.exportVarTruncateZip});
            exportColumns.push({ header: 'Site Address',                 row: this.exportVarStreetAddress});
            exportColumns.push({ header: 'Market',                       row: (state, data) => (this.isMarket) ? data.impGeofootprintLocation.marketName : 
                                                                                                data.impGeofootprintLocation.impGeofootprintLocAttribs.filter(attr => attr.attributeCode === 'Home DMA Name')[0].attributeValue});
            exportColumns.push({ header: 'Market Code',                  row: (state, data) => (this.isMarket) ? data.impGeofootprintLocation.marketCode : 
                                                                                                data.impGeofootprintLocation.impGeofootprintLocAttribs.filter(attr => attr.attributeCode === 'Home DMA')[0].attributeValue});
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

         // No format specified, derive from the object - IMPLEMENT (Will eventually have an export from NgRx)
         default:
            this.logger.debug.log ('setExportFormat - default');
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
   public parseMustCoverFile(dataBuffer: string, fileName: string, analysisLevel: string, isResubmit: boolean, fileAnalysisLevel: string = null) : Observable<any> {
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
          this.logger.error.log('There were errors parsing the following rows in the CSV: ', data.failedRows);
          this.reportError(errorTitle, `There ${failCount > 1 ? 'were' : 'was'} ${failCount} row${failCount > 1 ? 's' : ''} in the uploaded file that could not be read.`);
       }

       // If the file did have some correct rows, begin processing them
       if (successCount > 0) {
          // Reduce the list of geographies down to the distinct list
          const uniqueGeos = new Set(data.parsedData.map(d => d.geocode));

          if (uniqueGeos.size !== data.parsedData.length) {
             this.store$.dispatch(new WarningNotification({message: 'The upload file contains duplicate geocodes. Processing will continue, though you may want to re-evaluate the upload file.',
                                                           notificationTitle: 'Must Cover Upload'}));
             //this.reportError(errorTitle, 'Warning: The upload file did contain duplicate geocodes. Processing will continue, but consider evaluating and resubmiting the file.');
          }

          const outfields = ['geocode', 'latitude', 'longitude'];
          const queryResult = new Set<string>();
          const queryResultMap = new Map<string, {latitude: number, longitude: number}>();
          if (fileAnalysisLevel === 'ZIP' || fileAnalysisLevel === 'ATZ' || fileAnalysisLevel === 'PCR' || fileAnalysisLevel === 'Digital ATZ'){
            const portalLayerId = fileAnalysisLevel === analysisLevel ? this.appConfig.getLayerIdForAnalysisLevel(analysisLevel) : this.appConfig.getLayerIdForAnalysisLevel(fileAnalysisLevel);

            return this.esriQueryService.queryAttributeIn(portalLayerId, 'geocode', Array.from(uniqueGeos), false, outfields).pipe(
               map(graphics => graphics.map(g => g.attributes)),
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
        this.store$.dispatch(new ErrorNotification({ message: 'Geocode is a required column in the upload file', notificationTitle: 'Must Cover Upload' }));
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

   public setMustCovers(newMustCovers: string[], append: boolean = false)
   {
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
