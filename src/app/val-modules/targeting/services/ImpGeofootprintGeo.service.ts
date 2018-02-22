import { ImpGeofootprintTradeArea } from './../models/ImpGeofootprintTradeArea';
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

import { ImpDiscoveryUI } from './../../../models/ImpDiscoveryUI';
import { ImpDiscoveryService } from './../../../services/ImpDiscoveryUI.service';
import { ImpGeofootprintGeo } from '../models/ImpGeofootprintGeo';
import { ImpGeofootprintTradeAreaService } from './ImpGeofootprintTradeArea.service';
import { RestDataService } from './../../common/services/restdata.service';
import { DataStore } from '../../common/services/datastore.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

// Imports for exporting CSVs
// import { encode } from 'punycode';
import * as $ from 'jquery';

const dataUrl = 'v1/targeting/base/impgeofootprintgeo/search?q=impGeofootprintGeo';

export enum EXPORT_FORMAT_IMPGEOFOOTPRINTGEO {
   default,
   alteryx
}

@Injectable()
export class ImpGeofootprintGeoService extends DataStore<ImpGeofootprintGeo>
{
   private impDiscoveryUI: ImpDiscoveryUI;
   private impGeofootprintTradeAreas: ImpGeofootprintTradeArea[];

   constructor(private restDataService: RestDataService, impDiscoveryService: ImpDiscoveryService, impGeofootprintTradeAreaService: ImpGeofootprintTradeAreaService)
   {
      super(restDataService, dataUrl);

      impDiscoveryService.storeObservable.subscribe(discoveryData => this.onChangeDiscovery(discoveryData[0]));
      impGeofootprintTradeAreaService.storeObservable.subscribe(tradeAreaData => this.onChangeTradeArea(tradeAreaData));
   }

   // -----------------------------------------------------------
   // UTILITY METHODS
   // -----------------------------------------------------------   
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
         csvString += row + '\n';
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

   // TODO: This needs to be a delegate method
   public handleVariable(variable: string, rowData: any) : any
   {
      console.log('Variable: ' + variable + ':', rowData);

      let varValue: any;
      let geo: ImpGeofootprintGeo = <ImpGeofootprintGeo> rowData;

      const analysisLevel = (this.impDiscoveryUI != null && this.impDiscoveryUI.analysisLevel != null) ? this.impDiscoveryUI.analysisLevel.toUpperCase() : 'ATZ'; 

      switch (variable)
      {
         case '#V-GEOHEADER':
            switch (analysisLevel)
            {
               case 'ATZ': varValue='VALATZ'; break;
               case 'ZIP': varValue='VALZI';  break;
               case 'PCR': varValue='VALCR';  break;
            }
            break;

         case '#V-STREETADDRESS':
            let truncZip = (geo.impGeofootprintLocation != null && geo.impGeofootprintLocation.locZip != null) ? geo.impGeofootprintLocation.locZip.slice(0, 5) : ' ';
            console.log('truncZip ' + truncZip);
            varValue = '"' + geo.impGeofootprintLocation.locAddres + ', ' +
                             geo.impGeofootprintLocation.locCity   + ', ' +
                             geo.impGeofootprintLocation.locState  + ' ' +
                             truncZip + '"';
            break;

         case '#V-IS_HOME_GEOCODE':
            varValue = (geo.geocode === geo.impGeofootprintLocation.homeGeocode) ? 1 : 0;
            break;

         case '#V-TRUNCATE_ZIP':         
            varValue = (geo.impGeofootprintLocation != null && geo.impGeofootprintLocation.locZip != null) ? geo.impGeofootprintLocation.locZip.slice(0, 5) : null;
            console.log('varValue = ' + varValue);
            break;

         case '#V-OWNER_TRADE_AREA':
         // Column P - Owner Trade Area - the corresponding TA # 1/2/3 - Can calculate with distance:
         // if distance is less than TA1 radius, return a 1, if distance is between TA1 and TA2 radius, return a 2,
         // if distance is > than TA 2, return a 3. 
         //What to do if the user selected a geo very far outside the TA1 or 2? Leave blank, say "Custom", or return a 3 for now?         
            if (this.impGeofootprintTradeAreas == null)
               varValue = null;
            else
               if (geo.distance < this.impGeofootprintTradeAreas[0].taRadius)
                  varValue = 1;
               else
                  if (geo.distance >= this.impGeofootprintTradeAreas[0].taRadius &&
                     geo.distance <= this.impGeofootprintTradeAreas[1].taRadius)
                     varValue = 2
                  else
                     if (geo.distance > this.impGeofootprintTradeAreas[1].taRadius)
                        varValue = 3;
                     else
                        varValue = null;
            break;
            
         default:
            varValue = null;
            break;
      }
      return varValue;
   }

   public prepareCSV<T>(sourceData: T[], columnHeaders: String, columnOrder: String): string[]
   {
      console.log('prepareCSV fired with sourceData: ', sourceData);
      if (sourceData == null || sourceData.length < 1) {
         throw new Error('prepareCSV - No data provided to export');
      }

      // Initialize Output Array
      const csvData: string[] = new Array<string>();

      // Headers and column order are passed as delimited strings for convenience, split them
      const headerList: string[] = columnHeaders.split(',');
      const orderList:  string[] = columnOrder.split(',');

      let isSpecial: string;
      let field: string;
      let row: string = ' ';

      // Build the headers - Note that headers only support constants or #V- variables 
      for (const header of headerList)
      {
         isSpecial = header.slice(0, 3);
         if (isSpecial == '#V-')
         {
            field = this.handleVariable(header, null);
            row += field + ',';
         }
         else
            row += header + ',';
      }
      csvData.push(row);

      // Iterate through all of the source data, converting to csv rows
      for (const data of sourceData)
      {
         // Begin a new line for every element in the data
         row = '';

         // Output the columns in the specified order
         for (const currCol of orderList)
         {
            // Split the column to see if we are looking for a nested value eg. parent.child
            const splitFields: string[] = currCol.split('.');

            // Loop through the chain until we reach the bottom
            for (let i = 0; i < splitFields.length; i++)
            {
               // Look for special fields:  #D- a defaulted value or #V- a variable calculated by handleVariable
               isSpecial = splitFields[i].slice(0, 3);
               if (isSpecial === '#D-')
                  field = splitFields[i].slice(3);
               else
                  if (isSpecial === '#V-')
                     field = this.handleVariable(splitFields[i], data);
                  else
                  {
                     // Pluck out nulls as a special case
                     if (splitFields[i] === 'null' || splitFields[i] == null || splitFields[i] === '' || splitFields[i] === ' ')
                        field = null
                     else
                        // This will either bring you to the child object for next iteration or the value if at the bottom
                        field = (i == 0) ? data[splitFields[0]] : field[splitFields[i]];
                  }
            }
            row += (field != null) ? field + ',' : ',';
         }

         // If we have built a row, push it to the result
         if (row != '')
            csvData.push(row);
      }
      return csvData;
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
   // SERVICE METHODS
   // -----------------------------------------------------------
   public exportStore(filename: string, exportFormat: EXPORT_FORMAT_IMPGEOFOOTPRINTGEO)
   {
      const columnHeaders: string = this.getExportFormat (exportFormat, true);
      const columnOrder: string = this.getExportFormat (exportFormat, false);      
      console.log('columnHeaders: ', columnHeaders);
      console.log('columnOrder', columnOrder);
      console.log('dataStore.length: ' + this.length());
      const geos: ImpGeofootprintGeo[] = this.get()
      console.log('geos:', geos);

      this.exportCSV(filename, this.prepareCSV(geos, columnHeaders, columnOrder));
   }
   
   private getExportFormat (exportFormat: EXPORT_FORMAT_IMPGEOFOOTPRINTGEO, returnHeaders: boolean): string
   {
      let result: string = '';

      switch (exportFormat)
      {
         // No format specified, derive from the object  TODO: IMPLEMENT
         case EXPORT_FORMAT_IMPGEOFOOTPRINTGEO.default:
            console.log ('setExportFormat - default');
            if (returnHeaders)
               result = 'ggId,geocode,geoSortOrder,hhc,distance,xcoord,ycoord,impGeofootprintLocation.glId';
            else
               result = 'ggId,geocode,geoSortOrder,hhc,distance,xcoord,ycoord,impGeofootprintLocation.glId';
            break;

         case EXPORT_FORMAT_IMPGEOFOOTPRINTGEO.alteryx:
            console.log ('setExportFormat - alteryx');
            if (returnHeaders)
               result = '#V-GEOHEADER,Site Name,Site Description, Site Street,' +
                        'Site City,Site State,Zip,' +
                        'Site Address,Market,Market Code,'+
                        'Passes Filter,Distance,Is User Home Geocode,Is Final Home Geocode,Is Must Cover,' +
                        'Owner Trade Area,EST GEO IP ADDRESSES,Owner Site,Include in Deduped Footprint,Base Count';
            else
               result = 'geocode,impGeofootprintLocation.locationName,null,impGeofootprintLocation.locAddres,' +
                        'impGeofootprintLocation.locCity,impGeofootprintLocation.locState,#V-TRUNCATE_ZIP,' +
                        '#V-STREETADDRESS,impGeofootprintLocation.marketName,null,' +
                        '#D-1,distance,#V-IS_HOME_GEOCODE,#V-IS_HOME_GEOCODE,#D-0,' +
                        '#V-OWNER_TRADE_AREA,null,impGeofootprintLocation.locationNumber,#D-1,null';
         break;
      }

      return result;
   }

   private handleError(error: Response)
   {
      const errorMsg = `Status code: ${error.status} on url ${error.url}`;
      console.error(errorMsg);
      return Observable.throw(errorMsg);
   }
}