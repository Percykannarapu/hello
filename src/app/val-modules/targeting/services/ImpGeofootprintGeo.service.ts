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
   constructor(private restDataService: RestDataService) {super(restDataService, dataUrl); }

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

      let row: string = ' ';
      let found: boolean = false;
      let recNumber: number = 0;
      for (const header of headerList) {
         recNumber++;
         row += header + ',';
      };
      csvData.push(row);

      // Iterate through all of the source data, converting to csv rows
      for (const data of sourceData)
      {
         row = '';
         found = false;
         console.log('data: ', data);
         // Output the columns in the specified order
         for (const currCol of orderList)
         {
            const splitField: string[] = currCol.split('.');
            if (currCol === 'impGeofootprintLocation.glId')
            {
               console.log('splitField[0]', splitField[0]);
               console.log('splitField[1]', splitField[1]);
               console.log('data[' + splitField[0] + '][' + splitField[1] + '] = ', data[splitField[0]][splitField[1]]);
               console.log('#### TESTING NO SPLIT NEEDED ####');
               const test: string = 'AquaMan';
               const splitTest: string[] = test.split('.');
               console.log('result: ' + splitTest[0]);
            }
            console.log('data[' + currCol + '] = ', data[currCol]);
            console.log('data[impGeofootprintLocation][glId]', data['impGeofootprintLocation']['glId']);

            // TODO: Try to have one set of code
            if (splitField.length === 0)
            {
               // Look through the structure of the source data, looking for the currCol
               const fieldIdx = Object.keys(data).findIndex(fieldName => fieldName == currCol);
               if (fieldIdx >= 0)
                  row += data[splitField[0]] + ',';
               else
                  row += ','; // (row === '') ? ',' : ',,';
               console.log('currCol: ' + splitField[0] + ', fieldIdx: ' + fieldIdx + ', row: ', row);
            }
            else
            {
               let sf: string;
               for (let i = 0; i < splitField.length; i++)
               {
                  sf = (i == 0) ? data[splitField[0]] : sf[splitField[i]];
                  console.log('sf: ' + sf);
               }
            }
         }

         if (row != '')
            csvData.push(row);
      }

      return csvData;
   }

   public exportStore(filename: string, exportFormat: EXPORT_FORMAT_IMPGEOFOOTPRINTGEO)
   {
      const columnHeaders: string = this.getExportHeaders (exportFormat, true);
      const columnOrder: string = this.getExportHeaders (exportFormat, false);      
      console.log('columnHeaders: ', columnHeaders);
      console.log('columnOrder', columnOrder);
      console.log('dataStore.length: ' + this.length());
      const geos: ImpGeofootprintGeo[] = this.get()
      console.log('geos:', geos);

      this.exportCSV(filename, this.prepareCSV(geos, columnHeaders, columnOrder));
   }
   
   private getExportHeaders (exportFormat: EXPORT_FORMAT_IMPGEOFOOTPRINTGEO, returnHeaders: boolean): string
   {
      let result: string = '';


      // public impGeofootprintLocation:      ImpGeofootprintLocation;       /// Geofootprint Locations table
      // public impGeofootprintMaster:        ImpGeofootprintMaster;         /// Geofootprint master table for IMPower.
      // public impGeofootprintTradeArea:     ImpGeofootprintTradeArea;      /// Geofootprint Trade Areas
      // public impProject:                   ImpProject;                    /// Captures Project information from the UI


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
               result = 'ggId,geocode,geoSortOrder,hhc,distance,xcoord,ycoord,impGeofootprintLocation.glId';
            else
               result = 'ggId,geocode,geoSortOrder,hhc,distance,xcoord,ycoord,impGeofootprintLocation.glId';
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