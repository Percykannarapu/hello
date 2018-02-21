import { ImpDiscoveryUI } from './../../../models/ImpDiscoveryUI';
import { ImpDiscoveryService } from './../../../services/ImpDiscoveryUI.service';
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

import { ImpGeofootprintGeo } from '../models/ImpGeofootprintGeo';
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
   format_1
}

@Injectable()
export class ImpGeofootprintGeoService extends DataStore<ImpGeofootprintGeo>
{
   private impDiscoveryUI: ImpDiscoveryUI;

   constructor(private restDataService: RestDataService, impDiscoveryService: ImpDiscoveryService)
   {
      super(restDataService, dataUrl);

      impDiscoveryService.storeObservable.subscribe(discoveryData => this.onChangeDiscovery(discoveryData[0]));
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
         case '##-GEOHEADER':
            switch (analysisLevel)
            {
               case 'ATZ': varValue='VALATZ'; break;
               case 'ZIP': varValue='VALZI';  break;
               case 'PCR': varValue='VALCR';  break;
            }
            break;

         case '##-STREETADDRESS':
            varValue = '"' + geo.impGeofootprintLocation.locAddres + ', ' +
                             geo.impGeofootprintLocation.locCity   + ', ' +
                             geo.impGeofootprintLocation.locState  + ' ' +
                             (geo.impGeofootprintLocation != null && geo.impGeofootprintLocation.locZip != null) ? geo.impGeofootprintLocation.locZip.slice(0, 5) : '' + '"';
            break;

         case '##-IS_HOME_GEOCODE':
            varValue = (geo.geocode === geo.impGeofootprintLocation.homeGeocode) ? 1 : 0;
            break;

         case '##-TRUNCATE_ZIP':
            varValue = (geo.impGeofootprintLocation != null && geo.impGeofootprintLocation.locZip != null) ? geo.impGeofootprintLocation.locZip.slice(0, 5) : null;
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

      let isVariable: string;
      let field: string;
      let row: string = ' ';

      for (const header of headerList)
      {
         isVariable = header.slice(0, 3);
         if (isVariable == '##-')
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
         row = '';
         // Output the columns in the specified order
         for (const currCol of orderList)
         {
            const splitFields: string[] = currCol.split('.');
            for (let i = 0; i < splitFields.length; i++)
            {
               isVariable = splitFields[i].slice(0, 3);
               if (isVariable == '##-')
                  field = this.handleVariable(splitFields[i], data);
               else
                  field = (i == 0) ? data[splitFields[0]] : field[splitFields[i]];
//               console.log('field: ' + field);
            }
            row += (field != null) ? field + ',' : ',';
         }

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
         // No format specified, derive from the object
         case EXPORT_FORMAT_IMPGEOFOOTPRINTGEO.default:
            console.log ('setExportFormat - default');
            if (returnHeaders)
               result = 'ggId,geocode,geoSortOrder,hhc,distance,xcoord,ycoord,impGeofootprintLocation.glId';
            else
               result = 'ggId,geocode,geoSortOrder,hhc,distance,xcoord,ycoord,impGeofootprintLocation.glId';
            break;

         case EXPORT_FORMAT_IMPGEOFOOTPRINTGEO.format_1:
            console.log ('setExportFormat - format_1');
            if (returnHeaders)
               result = '##-GEOHEADER,Site Name,Site Description, Site Street,' +
                        'Site City,Site State,Zip,' +
                        'Site Address,Market,Market Code,'+
                        'Passes FIlter,Distance,Is User Home Geocode,Is Final Home Geocode,Is Must Cover,' +
                        'Owner Trade Area,Owner Site,Include in Deduped Footprint,Base Count';
            else
               result = 'geocode,impGeofootprintLocation.locationName,null,impGeofootprintLocation.locAddres,' +
                        'impGeofootprintLocation.locCity,impGeofootprintLocation.locState,##-TRUNCATE_ZIP,' +
                        '##-STREETADDRESS,impGeofootprintLocation.marketName,impGeofootprintLocation.marketName,' +
                        '1,distance,##-IS_HOME_GEOCODE,null,null,' +
                        'null,impGeofootprintLocation.locationNumber,1,null';
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