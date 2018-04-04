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

import { ImpDiscoveryUI } from '../../../models/ImpDiscoveryUI';
import { ImpDiscoveryService } from '../../../services/ImpDiscoveryUI.service';
import { ImpGeofootprintGeo } from '../models/ImpGeofootprintGeo';
import { ImpGeofootprintTradeArea } from './../models/ImpGeofootprintTradeArea';
import { ImpGeofootprintTradeAreaService } from './ImpGeofootprintTradeArea.service';
import { RestDataService } from '../../common/services/restdata.service';
import { DataStore } from '../../common/services/datastore.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { MessageService } from 'primeng/components/common/messageservice';
import { ColumnDefinition } from './../../common/services/datastore.service';

// Imports for exporting CSVs
import { encode } from 'punycode';
import * as $ from 'jquery';
import { ImpGeofootprintGeoAttribService } from './ImpGeofootprintGeoAttribService';
import { ImpGeofootprintLocation } from '../models/ImpGeofootprintLocation';

const dataUrl = 'v1/targeting/base/impgeofootprintgeo/search?q=impGeofootprintGeo';

export enum EXPORT_FORMAT_IMPGEOFOOTPRINTGEO {
   default,
   alteryx,
   custom
}

@Injectable()
export class ImpGeofootprintGeoService extends DataStore<ImpGeofootprintGeo>
{
   private impDiscoveryUI: ImpDiscoveryUI;
   private impGeofootprintTradeAreas: ImpGeofootprintTradeArea[];

   constructor(private restDataService: RestDataService, impDiscoveryService: ImpDiscoveryService,
               private impGeofootprintTradeAreaService: ImpGeofootprintTradeAreaService, private messageService: MessageService,
               private impGeofootprintGeoAttribService: ImpGeofootprintGeoAttribService)
   {
      super(restDataService, dataUrl);

      impDiscoveryService.storeObservable.subscribe(discoveryData => this.onChangeDiscovery(discoveryData[0]));
      impGeofootprintTradeAreaService.storeObservable.subscribe(tradeAreaData => this.onChangeTradeArea(tradeAreaData));
   }

   // -----------------------------------------------------------
   // UTILITY METHODS
   // -----------------------------------------------------------
   public getFileName()
   {
      try
      {
         let fmtDate: string = new Date().toISOString().replace(/\D/g,'').slice(0, 13);

         return 'GeoFootPrint_1_' + ((this.impDiscoveryUI.analysisLevel != null) ? this.impDiscoveryUI.analysisLevel.toUpperCase() : '') + '_' + fmtDate + '.csv';
      }
      catch(e)
      {
         return 'GeoFootPrint.csv';
      }
   }

   public exportCSV(filename:string, csvData: string[])
   {
      // Trap potential errors
      if (filename == null) {
         throw  Error('exportCSV requires a filename');
      }

      if (csvData == null || csvData.length == 0) {
         console.log('csvData:', csvData);
         throw Error('exportCsv requires csvData to continue');
      }

      // Encode the csvData into a gigantic string
      let csvString: string = '';
      for (const row of csvData) {
         csvString += encode(row) + '\n';
      }

      // Use jquery to create and autoclick a link that downloads the CSV file
      const link = $('<a/>', {
         style: 'display:none',
         href: 'data:application/octet-stream;base64;charset=utf-8,' + btoa(csvString),
         download: filename
      }).appendTo('body');
      link[0].click();
      link.remove();
   }


   // -----------------------------------------------------------
   // SUBSCRIPTION CALLBACK METHODS
   // -----------------------------------------------------------
   public onChangeDiscovery(impDiscoveryUI: ImpDiscoveryUI)
   {
      this.impDiscoveryUI = impDiscoveryUI;
   }

   public onChangeTradeArea(impGeofootprintTradeAreas: ImpGeofootprintTradeArea[])
   {
      this.impGeofootprintTradeAreas = impGeofootprintTradeAreas;
   }


   // -----------------------------------------------------------
   // EXPORT VARIABLE HANDLER METHODS
   // -----------------------------------------------------------   
   public exportVarGeoHeader<ImpGeofootprintGeo> (state: ImpGeofootprintGeoService)
   {
   // console.log('exportVar handler for #V-GEOHEADER fired');
      const analysisLevel = (state.impDiscoveryUI != null && state.impDiscoveryUI.analysisLevel != null) ? state.impDiscoveryUI.analysisLevel.toUpperCase() : 'ATZ';
      
      let varValue: any;

      switch (analysisLevel)
      {
         case 'ATZ':         varValue='VALATZ'; break;
         case 'ZIP':         varValue='VALZI';  break;
         case 'PCR':         varValue='VALCR';  break;
         case 'DIGITAL ATZ': varValue='VALDIG'; break;
      }
      if (varValue == null)
         console.error ('Couldn\'t set varValue for analysisLevel: ' + analysisLevel);
      
      return varValue;
   };

   public exportVarStreetAddress(state: ImpGeofootprintGeoService, geo: ImpGeofootprintGeo)
   {
   // console.log('exportVar handler for #V-STREETADDRESS fired');
      let varValue: any;
      let truncZip = (geo.impGeofootprintLocation != null && geo.impGeofootprintLocation.locZip != null) ? geo.impGeofootprintLocation.locZip.slice(0, 5) : ' ';
      varValue = (geo != null && geo.impGeofootprintLocation != null)
                  ? '"' + geo.impGeofootprintLocation.locAddress + ', ' +
                    geo.impGeofootprintLocation.locCity   + ', ' +
                    geo.impGeofootprintLocation.locState  + ' ' +
                    truncZip + '"'
                  : null;
      return varValue;
   };

   public exportVarTruncateZip(state: ImpGeofootprintGeoService, geo: ImpGeofootprintGeo)
   {
   // console.log('exportVar handler for #V-TRUNCATE_ZIP fired');
      let varValue = (geo.impGeofootprintLocation != null && geo.impGeofootprintLocation.locZip != null) ? geo.impGeofootprintLocation.locZip.slice(0, 5) : null;
      return varValue;
   };

   public exportVarIsHomeGeocode(state: ImpGeofootprintGeoService, geo: ImpGeofootprintGeo)
   {
   // console.log('exportVar handler for #V-IS_HOME_GEOCODE fired');
      let varValue = (geo.impGeofootprintLocation != null && geo.geocode === geo.impGeofootprintLocation.homeGeocode) ? 1 : 0;
   // console.log ('geo.geocode = ', geo.geocode, ', geo.impGeofootprintLocation.homeGeocode = ', (geo != null && geo.impGeofootprintLocation != null) ? geo.impGeofootprintLocation.homeGeocode : null);
      return varValue;
   };

   public exportVarOwnerTradeArea(state: ImpGeofootprintGeoService, geo: ImpGeofootprintGeo)
   {
   // console.log('exportVar handler for #V-OWNER_TRADE_AREA fired');
      let varValue: any;
      if (state.impGeofootprintTradeAreas == null)
         varValue = null;
      else
      {
         const radiuses : Array<number> = [(state.impGeofootprintTradeAreas.length >= 1) ? state.impGeofootprintTradeAreas[0].taRadius : 0
                                          ,(state.impGeofootprintTradeAreas.length >= 2) ? state.impGeofootprintTradeAreas[1].taRadius : 0
                                          ,(state.impGeofootprintTradeAreas.length >= 3) ? state.impGeofootprintTradeAreas[2].taRadius : 0];
         if (geo.distance < radiuses[0])
            varValue = 1;
         else
            if (geo.distance >= radiuses[0] &&
               geo.distance <= radiuses[1])
               varValue = 2
            else
               if (geo.distance > radiuses[1])
                  varValue = 3;
               else
                  varValue = null;
      }
      return varValue;
   };

   // TODO: This used to create a csv of the attributes, but now needs to return just the one matching the header.
   //       It is currently doing that, but is pretty inefficient, but its working.  Future me, forgive me.
   public exportVarAttributes(state: ImpGeofootprintGeoService, geo: ImpGeofootprintGeo, header: string)
   {
   // console.log('exportVar handler for #V-ATTRIBUTES fired');
      let varValue: any;
      const allExportAttributes = state.impGeofootprintGeoAttribService.get().filter(att => att.attributeType === 'Geofootprint Variable');
      const attributeNames = Array.from(new Set(allExportAttributes.map(att => att.attributeCode)));
      attributeNames.sort();
      if (geo == null) {
         varValue = attributeNames.map(s => s.replace(',', '')).join(',');
      }
      else
      {
        const currentAttributes = allExportAttributes.filter(att => att.impGeofootprintGeo === geo);
        const values = [];
        attributeNames.forEach(name => {
          const index = currentAttributes.findIndex(a => a.attributeCode === name && name === header);
          values.push(index > -1 ? currentAttributes[index].attributeValue : '');
        });
        varValue = values.join('');
      }     
      return varValue;
   };

   public addVarAttributeExportColumns(exportColumns: ColumnDefinition<ImpGeofootprintGeo>[], insertAtPos: number)
   {
   // console.log('exportVar handler for #V-ATTRIBUTES fired');
      let varValue: any;
      const allExportAttributes = this.impGeofootprintGeoAttribService.get().filter(att => att.attributeType === 'Geofootprint Variable');
      const attributeNames = Array.from(new Set(allExportAttributes.map(att => att.attributeCode)));
      attributeNames.sort();

      attributeNames.forEach(name => {
         exportColumns.splice(insertAtPos++, 0, { header: name, row: this.exportVarAttributes})
      });
   };
   
   // -----------------------------------------------------------
   // EXPORT METHODS
   // -----------------------------------------------------------
   public exportStore(filename: string, exportFormat: EXPORT_FORMAT_IMPGEOFOOTPRINTGEO)
   {
      console.log('ImpGeofootprintGeo.service.exportStore - fired - dataStore.length: ' + this.length());
      const geos: ImpGeofootprintGeo[] = this.get();

      let exportColumns: ColumnDefinition<ImpGeofootprintGeo>[] = this.getExportFormat (exportFormat);

      // TODO make this a part of the getExportFormat
      this.addVarAttributeExportColumns(exportColumns, 17);

      if (filename == null)
         filename = this.getFileName();

      this.exportCSV(filename, this.prepareCSV(exportColumns));
   }

   private getExportFormat (exportFormat: EXPORT_FORMAT_IMPGEOFOOTPRINTGEO): ColumnDefinition<ImpGeofootprintGeo>[]
   {
      let result: string = '';
      const exportColumns: ColumnDefinition<ImpGeofootprintGeo>[] = [];

      switch (exportFormat)
      {
         case EXPORT_FORMAT_IMPGEOFOOTPRINTGEO.alteryx:
            console.log ('setExportFormat - alteryx');
            exportColumns.push({ header: this.exportVarGeoHeader(this),  row: (state, data) => data.geocode});
            exportColumns.push({ header: 'Site Name',                    row: (state, data) => data.impGeofootprintLocation.locationName});
            exportColumns.push({ header: 'Site Description',             row: null});
            exportColumns.push({ header: 'Site Street',                  row: (state, data) => data.impGeofootprintLocation.locAddress});
            exportColumns.push({ header: 'Site City',                    row: (state, data) => data.impGeofootprintLocation.locCity});
            exportColumns.push({ header: 'Site State',                   row: (state, data) => data.impGeofootprintLocation.locState});
            exportColumns.push({ header: 'Zip',                          row: this.exportVarTruncateZip});
            exportColumns.push({ header: 'Site Address',                 row: this.exportVarStreetAddress});
            exportColumns.push({ header: 'Market',                       row: (state, data) => data.impGeofootprintLocation.marketName});
            exportColumns.push({ header: 'Market Code',                  row: null});
            exportColumns.push({ header: 'Passes Filter',                row: 1});
            exportColumns.push({ header: 'Distance',                     row: (state, data) => data.distance});
            exportColumns.push({ header: 'Is User Home Geocode',         row: this.exportVarIsHomeGeocode});
            exportColumns.push({ header: 'Is Final Home Geocode',        row: this.exportVarIsHomeGeocode});
            exportColumns.push({ header: 'Is Must Cover',                row: 0});
            exportColumns.push({ header: 'Owner Trade Area',             row: this.exportVarOwnerTradeArea});
            exportColumns.push({ header: 'EST GEO IP ADDRESSES',         row: null});
            exportColumns.push({ header: 'Owner Site',                   row: (state, data) => data.impGeofootprintLocation.locationNumber});
            exportColumns.push({ header: 'Include in Deduped Footprint', row: 1});
            exportColumns.push({ header: 'Base Count',                   row: null});
         break;

         // No format specified, derive from the object  TODO: IMPLEMENT
         default:
            console.log ('setExportFormat - default');
            exportColumns.push({ header: this.exportVarGeoHeader(this),  row: (state, data) => data.geocode});
            exportColumns.push({ header: 'Site Name',                    row: (state, data) => data.impGeofootprintLocation.locationName});
            exportColumns.push({ header: 'Site Description',             row: null});
            exportColumns.push({ header: 'Site Street',                  row: (state, data) => data.impGeofootprintLocation.locAddress});
            exportColumns.push({ header: 'Site City',                    row: (state, data) => data.impGeofootprintLocation.locCity});
            exportColumns.push({ header: 'Site State',                   row: (state, data) => data.impGeofootprintLocation.locState});
            exportColumns.push({ header: 'Zip',                          row: this.exportVarTruncateZip});
            exportColumns.push({ header: 'Base Count',                   row: null});
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