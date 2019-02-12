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
import { Observable, EMPTY } from 'rxjs';
import { TransactionManager } from '../../common/services/TransactionManager.service';
import { ColumnDefinition, DataStore } from '../../common/services/datastore.service';
import { ImpGeofootprintLocation } from '../models/ImpGeofootprintLocation';
import { ImpProject } from '../models/ImpProject';
import { RestDataService } from '../../common/services/restdata.service';
import { ImpGeofootprintLocAttribService } from './ImpGeofootprintLocAttrib.service';
import { ImpGeofootprintTradeAreaService } from './ImpGeofootprintTradeArea.service';
import { DAOBaseStatus } from '../../api/models/BaseModel';
import { Action, Store } from '@ngrx/store';
import { LocalAppState } from '../../../state/app.interfaces';
import { ErrorNotification, SuccessNotification } from '@val/messaging';
import { simpleFlatten } from '@val/common';

const dataUrl = 'v1/targeting/base/impgeofootprintlocation/search?q=impGeofootprintLocation';

export enum EXPORT_FORMAT_IMPGEOFOOTPRINTLOCATION {
   default,
   alteryx,
   custom,
   digital
}

@Injectable()
export class ImpGeofootprintLocationService extends DataStore<ImpGeofootprintLocation>
{
   public  removes: ImpGeofootprintLocation[];

   constructor(restDataService: RestDataService,
               projectTransactionManager: TransactionManager,
               private impGeofootprintTradeAreaService: ImpGeofootprintTradeAreaService,
               private impGeoFootprintLocAttribService: ImpGeofootprintLocAttribService,
               private store$: Store<LocalAppState>)
    {
      super(restDataService, dataUrl, projectTransactionManager, 'ImpGeofootprintLocation');
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

      // TODO: Pretty sure I can use the filterOp below
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
               this.impGeoFootprintLocAttribService.performDBRemoves(this.impGeoFootprintLocAttribService.filterBy (attrib => attrib.glId === loc.glId  && attrib.baseStatus === DAOBaseStatus.DELETE, (attrib) => this.impGeoFootprintLocAttribService.getTreeRemoveCount(attrib), false, true, true), false, false);
               this.impGeofootprintTradeAreaService.performDBRemoves(this.impGeofootprintTradeAreaService.filterBy (ta => ta.glId === loc.glId          && ta.baseStatus     === DAOBaseStatus.DELETE, (ta)     => this.impGeofootprintTradeAreaService.getTreeRemoveCount(ta),     false, true, true), false, false);
            }
         }
      });

      if (doPost)
      {
         // Clone the parents as a base for the payload
         let removesPayload: ImpGeofootprintLocation[] = JSON.parse(JSON.stringify(impGeofootprintLocationRemoves));

         // Prune out just the deletes and unchanged from the parents and children
         removesPayload = this.prune(removesPayload, ta => ta.baseStatus == DAOBaseStatus.DELETE || ta.baseStatus === DAOBaseStatus.UNCHANGED);

         return Observable.create(observer => {
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

   public hasMandatory(impGeofootprintLocation: ImpGeofootprintLocation)
   {
      const hasMandatoryCols = [true, ''];

      if (impGeofootprintLocation == null)
         return [false, 'All columns missing'];

      if (impGeofootprintLocation.clientIdentifierTypeCode == null)
      {
         hasMandatoryCols[0] = false;
         hasMandatoryCols[1] = (hasMandatoryCols[1] == '') ? 'Missing: ' : ', ' + 'clientIdentifierTypeCode';
      }

      if (impGeofootprintLocation.clientLocationTypeCode == null)
      {
         hasMandatoryCols[0] = false;
         hasMandatoryCols[1] = (hasMandatoryCols[1] == '') ? 'Missing: ' : ', ' + 'clientIdentifierTypeCode';
      }

      if (impGeofootprintLocation.locationNumber == null)
      {
         hasMandatoryCols[0] = false;
         hasMandatoryCols[1] = (hasMandatoryCols[1] == '') ? 'Missing: ' : ', ' + 'clientIdentifierTypeCode';
      }
      // CLIENT_IDENTIFIER_ID       -- Can't default a primary or foreign key
      // FK_CGM_ID                  -- Can't default a primary or foreign key
      // FK_CLIENT_LOCATION_ID      -- Can't default a primary or foreign key
      // FK_PROJECT_ID              -- Can't default a primary or foreign key
      // GL_ID                      -- Can't default a primary or foreign key
   }

   public getFileName(impProjectId?: Number, siteType?: string)
   {
      try
      {
         const fmtDate: string = new Date().toISOString().replace(/\D/g, '').slice(0, 13);
         return siteType + '_' + ((impProjectId != null) ? impProjectId + '_' : '1') + '_' +  fmtDate + '.csv';
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

   /**
    * Takes a well formed geocode and returns a string that is a combination of its requested parts
    * @param geocode The source geocode to parse
    * @param includeZip If true, include the ZIP portion of the geocode
    * @param includeAtz If true, include the ATZ portion of the geocode
    * @param includeCarrierRt If true, include the PCR portion of the geocode
    * @param includePlus4 If true, include the PLUS4 portion of the geocode
    */
   public getGeocodeAs(geocode: string, includeZip: boolean, includeAtz: boolean, includeCarrierRt: boolean, includePlus4: boolean)
   {
      // Regex to take a well formed geocode and break it into ZIP, ATZ, PCR and PLUS4
      const regex = /^(\d{1,5})(?:(?=[A-Z]\d{1})(?:(?=[A-Z]\d{3})()|([A-Z]\d{1}))(?:(?=[A-Z]\d{3})([A-Z]\d{3})?|()))?(?:(?:\-)(\d{4}))?/g;
      let m;
      let result: string = '';

      while ((m = regex.exec(geocode)) !== null)
      {
         // Avoid infinite loops with zero-width matches
         if (m.index === regex.lastIndex)
            regex.lastIndex++;

         // TODO: handle the wandering groups
         m.forEach((match, groupIndex) => {
//          console.log(`Found match, group ${groupIndex}: ${match}`);
            if (groupIndex === 1 && includeZip)
               result += (match != null) ? match : '';
            else
            if (groupIndex === 3 && includeAtz)
               result += (match != null) ? match : '';
            else
            if (groupIndex === 4 && includeCarrierRt)
               result += (match != null) ? match : '';
            else
            if (groupIndex === 6 && includePlus4)
               result += (match != null) ? match : '';
         });
         return result;
      }
      // No matches, return input geocode untouched
      return geocode;
   }

   // -----------------------------------------------------------
   // EXPORT COLUMN HANDLER METHODS
   // -----------------------------------------------------------

   public exportTradeArea(loc: ImpGeofootprintLocation, index: number)
   {
      const tradeAreas = loc.impGeofootprintTradeAreas.filter(ta => ta.taType === 'RADIUS' && ta.taNumber === index + 1);
      return tradeAreas.length > 0 ? tradeAreas[0].taRadius : null;
   }

   public exportTradeAreaDesc(loc: ImpGeofootprintLocation, index: number)
   {
     const tradeAreas = loc.impGeofootprintTradeAreas.filter(ta => ta.taType === 'RADIUS' && ta.taNumber === index + 1);
     return tradeAreas.length > 0 ? `RADIUS${index + 1}` : null;
   }

   public exportHomeGeoAttribute(loc: ImpGeofootprintLocation, homeGeoType: string) : string {
      return this.exportAttribute(loc, `Home ${homeGeoType}`);
   }

   public exportAttribute(loc: ImpGeofootprintLocation, attributeCode: string) : string {
     const attributes = this.impGeoFootprintLocAttribService.get().filter(att => att.impGeofootprintLocation === loc && att.attributeCode === attributeCode);
     if (attributes.length > 0) return attributes[0].attributeValue;
     return '';
   }

   // -----------------------------------------------------------
   // EXPORT METHODS
   // -----------------------------------------------------------
   public exportStore(filename: string, exportFormat: EXPORT_FORMAT_IMPGEOFOOTPRINTLOCATION, project: ImpProject, isDigital?: boolean, filter?: (loc: ImpGeofootprintLocation) => boolean, exportType?: string)
   {
      console.log('ImpGeofootprintGeo.service.exportStore - fired - dataStore.length: ' + this.length());
      const exportColumns: ColumnDefinition<ImpGeofootprintLocation>[] = this.getExportFormat (exportFormat);
     
      if (filter == null) {
        this.downloadExport(filename, this.prepareCSV(exportColumns));
      } else {
        const locations = this.get().filter(filter);
        if (locations.length > 0) {
          const locationSet = new Set(locations);
          const allAttributes = this.impGeoFootprintLocAttribService.get().filter(attribute => locationSet.has(attribute.impGeofootprintLocation));
          if (isDigital === false) {
            const attributeCodeBlackList = new Set(exportColumns.map(c => c.header));
            const attributeCodes = new Set(allAttributes.map(attribute => attribute.attributeCode));
            attributeCodes.forEach(code => {
              if (code != null && !attributeCodeBlackList.has(code)) {
                exportColumns.push({ header: code, row: (state, data) => state.exportAttribute(data, code)});
              }
            });
            this.downloadExport(filename, this.prepareCSV(exportColumns, locations));
          } else {
            const csvData = this.prepareCSV(exportColumns, locations);
            this.downloadExport(filename, csvData);
            const serviceUrl = `v1/targeting/base/vlh?fileName=${filename}`;
            const csvString = csvData.reduce((accumulator, currentValue) => accumulator + currentValue + '\n', '');
            this.rest.postCSV(serviceUrl, csvString).subscribe(res => {
              console.log('Response from vlh', res);
              const notificationTitle = 'Send Custom Sites';
              let notification: Action;
              if (res.returnCode === 200) {
                notification = new SuccessNotification({ notificationTitle, message: `Sent ${locations.length} sites to Valassis Digital successfully for ${project.clientIdentifierName.trim()}`});
              } else {
                notification = new ErrorNotification({ notificationTitle, message: `Error sending ${locations.length} sites to Valassis Digital for ${project.clientIdentifierName.trim()}`});
              }
              this.store$.dispatch(notification);
            });
          }
        } else {
          // DE1742: display an error message if attempting to export an empty data store
          const notificationTitle = 'Error Exporting Locations';
          let message: string;
          if (exportType && exportType.toLocaleUpperCase() === 'SITES') {
            message = 'You must first add site locations';
          } else if (exportType && exportType.toLocaleUpperCase() === 'COMPETITORS' ) {
            message = 'You must first add competitor locations';
          }
          this.store$.dispatch(new ErrorNotification({ message, notificationTitle }));
        }
      }
   }

   private getExportFormat (exportFormat: EXPORT_FORMAT_IMPGEOFOOTPRINTLOCATION) : ColumnDefinition<ImpGeofootprintLocation>[]
   {
      const result: string = '';
      const exportColumns: ColumnDefinition<ImpGeofootprintLocation>[] = [];
      switch (exportFormat)
      {
      //   ****DO NOT CHANGE THE HEADERS AS ALTERYX DEPENDS ON THESE NAMES****
         case EXPORT_FORMAT_IMPGEOFOOTPRINTLOCATION.alteryx:
            exportColumns.push({ header: 'GROUP',              row: (state, data) => (data.groupName) ? data.groupName : (data.clientLocationTypeCode === 'Site') ? 'Advertisers' : 'Competitors'});
            exportColumns.push({ header: 'NUMBER',             row: (state, data) => data.locationNumber});
            exportColumns.push({ header: 'NAME',               row: (state, data) => data.locationName});
            exportColumns.push({ header: 'DESCRIPTION',        row: (state, data) => data.description});
            exportColumns.push({ header: 'STREET',             row: (state, data) => data.locAddress});
            exportColumns.push({ header: 'CITY',               row: (state, data) => data.locCity});
            exportColumns.push({ header: 'STATE',              row: (state, data) => data.locState});
            exportColumns.push({ header: 'ZIP',                row: (state, data) => state.getGeocodeAs(data.locZip, true, false, false, false)});
            exportColumns.push({ header: 'X',                  row: (state, data) => data.xcoord});
            exportColumns.push({ header: 'Y',                  row: (state, data) => data.ycoord});
            exportColumns.push({ header: 'ICON',               row: (state, data) => null});
            exportColumns.push({ header: 'RADIUS1',            row: (state, data) => state.exportTradeArea(data, 0) });
            exportColumns.push({ header: 'RADIUS2',            row: (state, data) => state.exportTradeArea(data, 1) });
            exportColumns.push({ header: 'RADIUS3',            row: (state, data) => state.exportTradeArea(data, 2) });
            exportColumns.push({ header: 'TRAVELTIME1',        row: (state, data) => 0});
            exportColumns.push({ header: 'TRAVELTIME2',        row: (state, data) => 0});
            exportColumns.push({ header: 'TRAVELTIME3',        row: (state, data) => 0});
            exportColumns.push({ header: 'TRADE_DESC1',        row: (state, data) => state.exportTradeAreaDesc(data, 0) });
            exportColumns.push({ header: 'TRADE_DESC2',        row: (state, data) => state.exportTradeAreaDesc(data, 1) });
            exportColumns.push({ header: 'TRADE_DESC3',        row: (state, data) => state.exportTradeAreaDesc(data, 2) });
            exportColumns.push({ header: 'Home Zip Code',      row: (state, data) => state.exportHomeGeoAttribute(data, 'ZIP')});
            exportColumns.push({ header: 'Home ATZ',           row: (state, data) => state.exportHomeGeoAttribute(data, 'ATZ')});
            exportColumns.push({ header: 'Home BG',            row: (state, data) => null});
            exportColumns.push({ header: 'Home Carrier Route', row: (state, data) => state.exportHomeGeoAttribute(data, 'PCR')});
            exportColumns.push({ header: 'Home Geocode Issue', row: (state, data) => state.exportHomeGeoAttribute(data, 'Geocode Issue')});
            exportColumns.push({ header: 'Carrier Route',      row: (state, data) => data.carrierRoute});
            exportColumns.push({ header: 'ATZ',                row: (state, data) => state.getGeocodeAs(data.homeGeocode, false, true, false, false)});
            exportColumns.push({ header: 'Block Group',        row: (state, data) => null});
            exportColumns.push({ header: 'Unit',               row: (state, data) => null});
            exportColumns.push({ header: 'ZIP4',               row: (state, data) => state.getGeocodeAs(data.locZip, false, false, false, true)});
            exportColumns.push({ header: 'Market',             row: (state, data) => data.marketName});
            exportColumns.push({ header: 'Market Code',        row: (state, data) => data.marketCode});
            exportColumns.push({ header: 'Map Group',          row: (state, data) => null});
            exportColumns.push({ header: 'STDLINXSCD',         row: (state, data) => null});
            exportColumns.push({ header: 'SWklyVol',           row: (state, data) => null});
            exportColumns.push({ header: 'STDLINXOCD',         row: (state, data) => null});
            exportColumns.push({ header: 'SOwnFamCd',          row: (state, data) => null});
            exportColumns.push({ header: 'SOwnNm',             row: (state, data) => null});
            exportColumns.push({ header: 'SStCd',              row: (state, data) => null});
            exportColumns.push({ header: 'SCntCd',             row: (state, data) => null});
            exportColumns.push({ header: 'FIPS',               row: (state, data) => null});
            exportColumns.push({ header: 'STDLINXPCD',         row: (state, data) => null});
            exportColumns.push({ header: 'SSUPFAMCD',          row: (state, data) => null});
            exportColumns.push({ header: 'SSupNm',             row: (state, data) => null});
            exportColumns.push({ header: 'SStatusInd',         row: (state, data) => null});
            exportColumns.push({ header: 'Match Type',         row: (state, data) => null});
            exportColumns.push({ header: 'Match Pass',         row: (state, data) => null});
            exportColumns.push({ header: 'Match Score',        row: (state, data) => null});
            exportColumns.push({ header: 'Match Code',         row: (state, data) => data.geocoderMatchCode});
            exportColumns.push({ header: 'Match Quality',      row: (state, data) => data.geocoderLocationCode});
            exportColumns.push({ header: 'Match Error',        row: (state, data) => null});
            exportColumns.push({ header: 'Match Error Desc',   row: (state, data) => null});
            exportColumns.push({ header: 'Original Address',   row: (state, data) => data.origAddress1});
            exportColumns.push({ header: 'Original City',      row: (state, data) => data.origCity});
            exportColumns.push({ header: 'Original State',     row: (state, data) => data.origState});
            exportColumns.push({ header: 'Original ZIP',       row: (state, data) => data.origPostalCode});
            exportColumns.push({ header: 'Home Digital ATZ',   row: (state, data) => state.exportHomeGeoAttribute(data, 'Digital ATZ')});
            exportColumns.push({ header: 'Home DMA',           row: (state, data) => state.exportHomeGeoAttribute(data, 'DMA')});
            exportColumns.push({ header: 'Home County',        row: (state, data) => state.exportHomeGeoAttribute(data, 'County')});
            break;
   
   
          //   ****DO NOT CHANGE THE HEADERS AS VALASSIS DIGITAL DEPENDS ON THESE NAMES****
         case EXPORT_FORMAT_IMPGEOFOOTPRINTLOCATION.digital:
           console.log ('setExportFormat - digital');
           exportColumns.push({ header: 'GROUP',              row: (state, data) => data.groupName});
           exportColumns.push({ header: 'NUMBER',             row: (state, data) => data.locationNumber});
           exportColumns.push({ header: 'NAME',               row: (state, data) => data.locationName});
           exportColumns.push({ header: 'DESCRIPTION',        row: (state, data) => data.impProject.clientIdentifierName && data.impProject.projectId != null ? data.impProject.clientIdentifierName.trim() + '' + '~' + data.impProject.projectId : ''});
           exportColumns.push({ header: 'STREET',             row: (state, data) => data.locAddress});
           exportColumns.push({ header: 'CITY',               row: (state, data) => data.locCity});
           exportColumns.push({ header: 'STATE',              row: (state, data) => data.locState});
           exportColumns.push({ header: 'ZIP',                row: (state, data) => data.locZip});
           exportColumns.push({ header: 'X',                  row: (state, data) => data.xcoord});
           exportColumns.push({ header: 'Y',                  row: (state, data) => data.ycoord});
           exportColumns.push({ header: 'Market',             row: (state, data) => data.marketName});
           exportColumns.push({ header: 'Market Code',        row: (state, data) => data.marketCode});
           break;

         // No format specified, derive from the object  TODO: IMPLEMENT
         default:
            console.log ('setExportFormat - default');
            exportColumns.push({ header: 'GROUP',              row: (state, data) => data.groupName});
            exportColumns.push({ header: 'NUMBER',             row: (state, data) => data.locationNumber});
            exportColumns.push({ header: 'NAME',               row: (state, data) => data.locationName});
            exportColumns.push({ header: 'DESCRIPTION',        row: (state, data) => data.description});
            exportColumns.push({ header: 'STREET',             row: (state, data) => data.locAddress});
            exportColumns.push({ header: 'CITY',               row: (state, data) => data.locCity});
            exportColumns.push({ header: 'STATE',              row: (state, data) => data.locState});
            exportColumns.push({ header: 'ZIP',                row: (state, data) => data.locZip});
            exportColumns.push({ header: 'X',                  row: (state, data) => data.xcoord});
            exportColumns.push({ header: 'Y',                  row: (state, data) => data.ycoord});
            break;
      }
      return exportColumns;
   }
}
