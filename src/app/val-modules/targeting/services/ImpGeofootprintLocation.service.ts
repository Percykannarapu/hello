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
import { ImpGeofootprintLocation } from '../models/ImpGeofootprintLocation';
import { ImpGeofootprintTradeArea } from '../models/ImpGeofootprintTradeArea';
import { ImpProject } from '../models/ImpProject';
import { ImpProjectService } from './ImpProject.service';
import { ImpGeofootprintTradeAreaService } from './ImpGeofootprintTradeArea.service';
import { RestDataService } from './../../common/services/restdata.service';
import { DataStore, ColumnDefinition } from '../../common/services/datastore.service';

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

// Imports for exporting CSVs
import { encode } from 'punycode';
import * as $ from 'jquery';
import { ImpGeofootprintLocAttribService } from './ImpGeofootprintLocAttrib.service';
import { ImpMetricName } from '../../metrics/models/ImpMetricName';
import { UsageService } from '../../../services/usage.service';

const dataUrl = 'v1/targeting/base/impgeofootprintlocation/search?q=impGeofootprintLocation';

export enum EXPORT_FORMAT_IMPGEOFOOTPRINTLOCATION {
   default,
   alteryx,
   custom
}

@Injectable()
export class ImpGeofootprintLocationService extends DataStore<ImpGeofootprintLocation>
{
   private impProject: ImpProject;
   private currentTA:  number;      // Remove when TAs are children of Locations
   private currentTD:  number;      // Remove when TAs are children of Locations
   private tradeAreas: ImpGeofootprintTradeArea[];

   constructor(private restDataService: RestDataService,
               private impGeofootprintTradeAreaService: ImpGeofootprintTradeAreaService,
               private impGeoFootprintLocAttribService: ImpGeofootprintLocAttribService,
               private usageService: UsageService   ) //, impProjectService: ImpProjectService)
   {
      super(restDataService, dataUrl);

      //impProjectService.storeObservable.subscribe(impProject => this.onChangeProject(impProject[0]));
      impGeofootprintTradeAreaService.storeObservable.subscribe(impGeofootprintTradeAreas => this.onChangeTradeAreas(impGeofootprintTradeAreas));
   }

   // -----------------------------------------------------------
   // UTILITY METHODS
   // -----------------------------------------------------------
   public getFileName()
   {
      try
      {
         // Prepare date string for the filename
         let fmtDate: string = new Date().toISOString().replace(/\D/g,'').slice(0, 13);

         return 'Locations_' + ((this.impProject.projectId != null) ? this.impProject.projectId + '_' : '') + fmtDate + '.csv';
      }
      catch(e)
      {
         return 'Locations.csv';
      }
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
   // SUBSCRIPTION CALLBACK METHODS
   // -----------------------------------------------------------
   public onChangeProject(impProject: ImpProject)
   {
      this.impProject = impProject;
   }

   public onChangeTradeAreas(impGeofootprintTradeAreas: ImpGeofootprintTradeArea[])
   {
      console.log('onChangeTradeAreas - fired');
      this.tradeAreas = impGeofootprintTradeAreas;
   }


   // -----------------------------------------------------------
   // EXPORT COLUMN HANDLER METHODS
   // -----------------------------------------------------------

   // This will be rendered obsolete when tradeareas are slotted under locations
   public exportTradeArea(state: ImpGeofootprintLocationService, loc: ImpGeofootprintLocation)
   {
      if (state.currentTA == null)
         state.currentTA = 0;

      state.tradeAreas =  state.impGeofootprintTradeAreaService.get();
      const tradeArea:  ImpGeofootprintTradeArea = (state.tradeAreas != null) ? state.tradeAreas[state.currentTA] : null;

      const result = (tradeArea != null) ? ((tradeArea.taNumber-1 === state.currentTA) ? tradeArea.taRadius : null) : null;

      // Cycle the currentTA from 0 to 3
      state.currentTA = (state.currentTA + 1) % 3;
      return result;
   };

   // This will be rendered obsolete when tradeareas are slotted under locations
   public exportTradeAreaDesc(state: ImpGeofootprintLocationService, loc: ImpGeofootprintLocation)
   {
      if (state.currentTD == null)
         state.currentTD = 0;

      state.tradeAreas =  state.impGeofootprintTradeAreaService.get();
      const tradeArea:  ImpGeofootprintTradeArea = (state.tradeAreas != null) ? state.tradeAreas[state.currentTD] : null;
      const result = (tradeArea != null) ? ((tradeArea.taNumber-1 === state.currentTD) ? 'RADIUS' + (state.currentTD+1) : null) : null;

      // Cycle the currentTD from 0 to 3
      state.currentTD = (state.currentTD + 1) % 3;

      return result; // (tradeArea != null) ? 'RADIUS' + state.currentTD : null;
   };

   public exportHomeGeoAttribute(loc: ImpGeofootprintLocation, homeGeoType: string) : string {
      const attributes = this.impGeoFootprintLocAttribService.get().filter(att => att.impGeofootprintLocation === loc && att.attributeCode === `Home ${homeGeoType}`);
      if (attributes.length > 0) return attributes[0].attributeValue;
      return '';
   }

   // -----------------------------------------------------------
   // EXPORT METHODS
   // -----------------------------------------------------------
   public exportStore(filename: string, exportFormat: EXPORT_FORMAT_IMPGEOFOOTPRINTLOCATION, filter?: (loc: ImpGeofootprintLocation) => boolean)
   {
      console.log('ImpGeofootprintGeo.service.exportStore - fired - dataStore.length: ' + this.length());
      const geos: ImpGeofootprintLocation[] = this.get();

      let exportColumns: ColumnDefinition<ImpGeofootprintLocation>[] = this.getExportFormat (exportFormat);

      if (filename == null)
         filename = this.getFileName();

         // update the metric count when export Sites
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'location', target: 'site-list', action: 'export' });
      this.usageService.createCounterMetric(usageMetricName, null + '~' + null, geos.length);

      if (filter == null) {
        this.downloadExport(filename, this.prepareCSV(exportColumns));
      } else {
        this.downloadExport(filename, this.prepareCSV(exportColumns, this.get().filter(filter)));
      }
   }

   private getExportFormat (exportFormat: EXPORT_FORMAT_IMPGEOFOOTPRINTLOCATION): ColumnDefinition<ImpGeofootprintLocation>[]
   {
      let result: string = '';
      const exportColumns: ColumnDefinition<ImpGeofootprintLocation>[] = [];

      switch (exportFormat)
      {
         case EXPORT_FORMAT_IMPGEOFOOTPRINTLOCATION.alteryx:
            exportColumns.push({ header: 'GROUP',              row: (state, data) => (data.groupName) ? data.groupName : (data.clientLocationTypeCode === 'Site') ? 'Advertisers' : 'Competitors'});
            exportColumns.push({ header: 'NUMBER',             row: (state, data) => data.locationNumber});
            exportColumns.push({ header: 'NAME',               row: (state, data) => data.locationName});
            exportColumns.push({ header: 'DESCRIPTION',        row: (state, data) => null});
            exportColumns.push({ header: 'STREET',             row: (state, data) => data.locAddress});
            exportColumns.push({ header: 'CITY',               row: (state, data) => data.locCity});
            exportColumns.push({ header: 'STATE',              row: (state, data) => data.locState});
            exportColumns.push({ header: 'ZIP',                row: (state, data) => state.getGeocodeAs(data.locZip, true, false, false, false)});
            exportColumns.push({ header: 'X',                  row: (state, data) => data.xcoord});
            exportColumns.push({ header: 'Y',                  row: (state, data) => data.ycoord});
            exportColumns.push({ header: 'ICON',               row: (state, data) => null});
            exportColumns.push({ header: 'RADIUS1',            row: this.exportTradeArea}); // WHEN TAS ARE UNDER LOCS => (data != null && data.impGeofootprintTradeAreas != null && data.impGeofootprintTradeAreas.length >=1) ? data.impGeofootprintTradeAreas[0].taRadius : null});
            exportColumns.push({ header: 'RADIUS2',            row: this.exportTradeArea}); // WHEN TAS ARE UNDER LOCS => (data != null && data.impGeofootprintTradeAreas != null && data.impGeofootprintTradeAreas.length >=2) ? data.impGeofootprintTradeAreas[1].taRadius : null});
            exportColumns.push({ header: 'RADIUS3',            row: this.exportTradeArea}); // WHEN TAS ARE UNDER LOCS => (data != null && data.impGeofootprintTradeAreas != null && data.impGeofootprintTradeAreas.length >=3) ? data.impGeofootprintTradeAreas[2].taRadius : null});
            exportColumns.push({ header: 'TRAVELTIME1',        row: (state, data) => 0});
            exportColumns.push({ header: 'TRAVELTIME2',        row: (state, data) => 0});
            exportColumns.push({ header: 'TRAVELTIME3',        row: (state, data) => 0});
            exportColumns.push({ header: 'TRADE_DESC1',        row: this.exportTradeAreaDesc}); // WHEN TAS ARE UNDER LOCS => (state, data) => (data != null && data.impGeofootprintTradeAreas != null && data.impGeofootprintTradeAreas.length >= 1) ? 'RADIUS1' : null});
            exportColumns.push({ header: 'TRADE_DESC2',        row: this.exportTradeAreaDesc}); // WHEN TAS ARE UNDER LOCS => (state, data) => (data != null && data.impGeofootprintTradeAreas != null && data.impGeofootprintTradeAreas.length >= 2) ? 'RADIUS2' : null});
            exportColumns.push({ header: 'TRADE_DESC3',        row: this.exportTradeAreaDesc}); // WHEN TAS ARE UNDER LOCS => (state, data) => (data != null && data.impGeofootprintTradeAreas != null && data.impGeofootprintTradeAreas.length >= 3) ? 'RADIUS3' : null});
            exportColumns.push({ header: 'Home Zip Code',      row: (state, data) => state.exportHomeGeoAttribute(data, 'ZIP')});
            exportColumns.push({ header: 'Home ATZ',           row: (state, data) => state.exportHomeGeoAttribute(data, 'ATZ')});
            exportColumns.push({ header: 'Home BG',            row: (state, data) => null});
            exportColumns.push({ header: 'Home Carrier Route', row: (state, data) => state.exportHomeGeoAttribute(data, 'PCR')});
            exportColumns.push({ header: 'Home Geocode Issue', row: (state, data) => null});
            exportColumns.push({ header: 'Carrier Route',      row: (state, data) => state.getGeocodeAs(data.locZip, false, false, true, false)});
            exportColumns.push({ header: 'ATZ',                row: (state, data) => state.getGeocodeAs(data.homeGeocode, false, true, false, false)});
            exportColumns.push({ header: 'Block Group',        row: (state, data) => null});
            exportColumns.push({ header: 'Unit',               row: (state, data) => null});
            exportColumns.push({ header: 'ZIP4',               row: (state, data) => state.getGeocodeAs(data.locZip, false, false, false, true)});
            exportColumns.push({ header: 'Market',             row: (state, data) => data.marketName});
            exportColumns.push({ header: 'Market Code',        row: (state, data) => null});
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
            exportColumns.push({ header: 'Match Quality',      row: (state, data) => null});
            exportColumns.push({ header: 'Match Error',        row: (state, data) => null});
            exportColumns.push({ header: 'Match Error Desc',   row: (state, data) => null});
            exportColumns.push({ header: 'Original Address',   row: (state, data) => data.origAddress1});
            exportColumns.push({ header: 'Original City',      row: (state, data) => data.origCity});
            exportColumns.push({ header: 'Original State',     row: (state, data) => data.origState});
            exportColumns.push({ header: 'Original ZIP',       row: (state, data) => data.origPostalCode});
            exportColumns.push({ header: 'Home Digital ATZ',   row: (state, data) => state.exportHomeGeoAttribute(data, 'Digital ATZ')});
            break;

         // No format specified, derive from the object  TODO: IMPLEMENT
         default:
            console.log ('setExportFormat - default');
            exportColumns.push({ header: 'GROUP',              row: (state, data) => data.groupName});
            exportColumns.push({ header: 'NUMBER',             row: (state, data) => data.locationNumber});
            exportColumns.push({ header: 'NAME',               row: (state, data) => data.locationName});
            exportColumns.push({ header: 'DESCRIPTION',        row: (state, data) => null});
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

   private handleError(error: Response)
   {
      const errorMsg = `Status code: ${error.status} on url ${error.url}`;
      console.error(errorMsg);
      return Observable.throw(errorMsg);
   }
}
