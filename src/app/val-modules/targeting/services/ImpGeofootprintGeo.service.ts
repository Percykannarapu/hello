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
import { TransactionManager } from '../../common/services/TransactionManager.service';
import { ImpDiscoveryUI } from '../../../models/ImpDiscoveryUI';
import { ImpDiscoveryService } from '../../../services/ImpDiscoveryUI.service';
import { ImpGeofootprintGeo } from '../models/ImpGeofootprintGeo';
import { ImpGeofootprintTradeArea } from './../models/ImpGeofootprintTradeArea';
import { ImpGeofootprintTradeAreaService } from './ImpGeofootprintTradeArea.service';
import { RestDataService } from '../../common/services/restdata.service';
import { DataStore } from '../../common/services/datastore.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ColumnDefinition } from './../../common/services/datastore.service';

// Imports for exporting CSVs
import { encode } from 'punycode';
import * as $ from 'jquery';
import { ImpGeofootprintGeoAttribService } from './ImpGeofootprintGeoAttribService';
import { ImpGeofootprintLocation } from '../models/ImpGeofootprintLocation';
import { AppMessagingService } from '../../../services/app-messaging.service';
import { AppConfig } from '../../../app.config';
import { ImpGeofootprintGeoAttrib } from '../models/ImpGeofootprintGeoAttrib';

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

   // this is intended to be a cache of the attrobutes and geos used for the geoffotprint export
   private attributeCache: Map<ImpGeofootprintGeo, ImpGeofootprintGeoAttrib[]> = new Map<ImpGeofootprintGeo, ImpGeofootprintGeoAttrib[]>();

   constructor(private restDataService: RestDataService, impDiscoveryService: ImpDiscoveryService,
               private projectTransactionManager: TransactionManager,
               private impGeofootprintTradeAreaService: ImpGeofootprintTradeAreaService, private messageService: AppMessagingService,
               private impGeofootprintGeoAttribService: ImpGeofootprintGeoAttribService, private config: AppConfig)
   {
      super(restDataService, dataUrl, projectTransactionManager);

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
   // EXPORT COLUMN HANDLER METHODS
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

   public rank(arr, f) {
      return arr
      .map((x, i) => [x, i])
      .sort((a, b) => f(a[0], b[0]))
      .reduce((a, x, i, s) => (a[x[1]] = i > 0 && f(s[i - 1][0], x[0]) === 0 ? a[s[i - 1][1]] : i + 1, a), []);
   }

   public XXXdenseRank(a, f, p) {
      return a
      .sort((a, b) => f(a, b))
      .reduce((a, x, i, s, b = p) => {
         // console.log('--[START]----------------------------------------------------');
         // console.log('a', a);
         // console.log('x', x);
         // console.log('i', i);
         // console.log('s', s);
         // console.log('b', b);
         // console.log('-----------');
         // console.log('a', a.toString());
         // if (i != 0)
         // {
         //    console.log ('s[i]   = ' + s[i].toString());
         //    console.log ('s[i-1] = ' + s[i-1].toString());
         // }

         if (i == 0)
         {
            // a[i] = 0;
            a[i] = s[i];
            a[i].rank = 0;
            //console.log('a initialized to 0');
         }
         else
         {
            if (b(s[i], s[i-1]))
            {
               //console.log('BREAK!');
               a[i] = s[i];
               a[i].rank = 0;
            }
            else
            {
               //console.log('NO BREAK! - i = ' + i + ' a.length: ' + a.length, 'a[i-1] = ' + a[i-1]);
               //a[i] = a[i-1]+1;
               a[i] = s[i];
               a[i].rank = a[i-1].rank+1;
               //a.rank = a[i-1]+1;
            }
         }
         //console.log('==[STOP]=======================================================');
         return a;
      }
      , []);
   }


   // This is written deliberately verbose as I want to eventually genericize this
   public sortGeos (a: ImpGeofootprintGeo, b: ImpGeofootprintGeo): number
   {
      if (a == null || b == null || a.impGeofootprintLocation == null || b.impGeofootprintLocation == null)
      {
         console.warn('sort criteria is null - a:', a, ', b: ', b);
         return 0;
      }

      if (a.geocode === b.geocode)
      {
      //    if (a.impGeofootprintLocation.locationName === b.impGeofootprintLocation.locationName)
      //    {
       if (a.distance === b.distance)
            {
               if (a.hhc === b.hhc)
                  return 0;
               else
                  if (a.hhc > b.hhc)
                     return -1;
                  else
                     return  1;
            } else {
               if (a.distance > b.distance)
                  return 1;
               else
                  return -1;
            }
        /* } else
            if (a.impGeofootprintLocation.locationName >  b.impGeofootprintLocation.locationName)
               return -1;
            else
               return 1;*/
         }
      else
         if (a.geocode > b.geocode)
            return 1;
         else
            return -1;
   }

   public partitionGeos (p1: ImpGeofootprintGeo, p2: ImpGeofootprintGeo): boolean
   {
      // console.log ('IN PARTITION BY 2! - P1: ' + p1.impGeofootprintLocation.locationName + ', P2: ' + p2.impGeofootprintLocation.locationName);
      // console.log('locationName 1: ' + ((p1 != null && p1.impGeofootprintLocation != null) ? p1.impGeofootprintLocation.locationName : null)
      //         + ', locationName 2: ' + ((p2 != null && p2.impGeofootprintLocation != null) ? p2.impGeofootprintLocation.locationName : null)
      //         + ' break?: ' + ((p1 == null || p1.impGeofootprintLocation == null ||
      //                           p2 == null || p2.impGeofootprintLocation == null) ? null : (p1.impGeofootprintLocation.locationName != p2.impGeofootprintLocation.locationName)));
      if (p1 == null || p2 == null)
      {
//       console.log ('ImpGeofootprintGeo.service.partitionGeos - ', (p1 == null) ? 'p1 was null' : 'p2 was null');
         return false;
      }

      // Partition within Geocode
      return (p1 == null || p2 == null)
             ? null : (p1.geocode != p2.geocode);

      // Partition within Site / Geocode
      // return (p1 == null || p2 == null || p1.impGeofootprintLocation == null || p2.impGeofootprintLocation == null)
      //        ? null : (p1.impGeofootprintLocation.locationName != p2.impGeofootprintLocation.locationName
      //               || p1.geocode != p2.geocode);
   }

   /*
      callback
         Function to execute on each element in the array, taking four arguments:
         a  accumulator
               The accumulator accumulates the callback's return values; it is the
               accumulated value previously returned in the last invocation of the
               callback, or initialValue, if supplied (see below).

         x  currentValue
               The current element being processed in the array.

         i  currentIndex
               The index of the current element being processed in the array. Starts at index 0, if an initialValue is provided, and at index 1 otherwise.

         s  array
               The array reduce() was called upon.
   */
   public denserankOld(arr, f, p) {
      console.log('denserank.p = ', p);
      return arr
      .map((x, i) => [x, i])
      .sort((a, b) => f(a[0], b[0]))
//      .reduce((a, x, i, s) => (i > 0 && p(s[i - 1][0], x[0])) ? i+10000
//                                                                : (a[x[1]] = i > 0 && f(s[i - 1][0], x[0]) === 0 ? a[s[i - 1][1]]
//                                                                                                               : i + 1, a), []);
//      .reduce((a, x, i, s) => (i > 0 && p(s[i - 1][0], x[0])) ? a[s[i - 1][1]] : i + 1, a, []);

// Need a new approach, below is just assigning 0-7 or 0-4 twice.

      .reduce((a, x, i, s, b = p) => {
         console.log('--[START]----------------------------------------------------');
         console.log('a', a);
         console.log('x', x);
         console.log('i', i);
         console.log('s', s);
         console.log('b', b);
         console.log('-----------');

         console.log('a', a.toString());
         if (i != 0)
         {
            console.log ('s[i]   = ' + s[i].toString());
            console.log ('s[i-1] = ' + s[i-1].toString());
         }

      //   console.log('f(s[i - 1][0], x[0])', (i > 0) ? f(s[i - 1][0], x[0]) : null);
         if (i == 0)
         {
            a[i] = 0;
            console.log('a initialized to 0');
         }
         else
         {
//            if (b(s[i], s[i-1]))
            if (b(s[i], s[i-1]))
            {
               console.log('BREAK!');
               a[i] = 0;
            }
            else
            {
               console.log('NO BREAK!');
               console.log('i = ' + i + ' a.length: ' + a.length);
               console.log('a[i-1] = ' + a[i-1]);
               a[i] = a[i-1]+1;
            }
         }
         //    .reduce((a, x, i, s) => (a[x[1]] = i > 0 && f(s[i - 1][0], x[0]) === 0 ? a[s[i - 1][1]] : i + 1, a), []);


      //   if (a[x[1]] = i > 0 && f(s[i - 1][0], x[0]) === 0 )
      //      a[s[i - 1][1]]
      //   else
      //      i + 1;
         console.log('==[STOP]=======================================================');
         return a;
      }
      , []);

// .reduce((a, x, i, s, c) => (a[x[1]] = i > 0 && f(s[i - 1][0], x[0]) === 0
//                            ? a[s[i - 1][1]] : i + 1, a)
//                            , []);

//.reduce((a, x, i, s, c=0) => {(a[x[1]] = i > 0 && f(s[i - 1][0], x[0]) === 0 ? a[s[i - 1][1]] : i + 1, a), [];
//         console.log('c: ' + c + ', i: ' + i); if (c >= 2) c = 0;});
   }

   public pl(msg) {
      console.log(msg);
      return msg;
   }

   // a = the array
   //
   public invokePartitionBy(arr, index)
   {
      if (index >= arr.length-1)
         return false;

      if (arr[index].impGeofootprintLocation != arr[index+1].impGeofootprintLocation)
         return true;
      else
         return false;
   }

   public assignGeocodeRank()
   {
      const site1: ImpGeofootprintLocation = new ImpGeofootprintLocation({ glId: 1000, locationNumber: 10});
      const site2: ImpGeofootprintLocation = new ImpGeofootprintLocation({ glId: 2000, locationNumber: 20});
      const geoArray: Array<ImpGeofootprintGeo>  = [new ImpGeofootprintGeo({geocode: '46038', impGeofootprintLocation: site1, distance: 10, hhc: 1000})
                                                   ,new ImpGeofootprintGeo({geocode: '46150', impGeofootprintLocation: site1, distance: 10, hhc: 2000})
                                                   ,new ImpGeofootprintGeo({geocode: '46100', impGeofootprintLocation: site1, distance: 15, hhc: 200})
                                                   ,new ImpGeofootprintGeo({geocode: '46099', impGeofootprintLocation: site1, distance: 5,  hhc: 3000})];

      const geoArray2: Array<ImpGeofootprintGeo> = [new ImpGeofootprintGeo({geocode: '46038', impGeofootprintLocation: site1, distance: 10, hhc: 4})
                                                   ,new ImpGeofootprintGeo({geocode: '46150', impGeofootprintLocation: site1, distance: 10, hhc: 3})
                                                   ,new ImpGeofootprintGeo({geocode: '46100', impGeofootprintLocation: site1, distance: 10, hhc: 2})
                                                   ,new ImpGeofootprintGeo({geocode: '46099', impGeofootprintLocation: site1, distance: 10, hhc: 1})];

      const geoArray3: Array<ImpGeofootprintGeo> = [new ImpGeofootprintGeo({geocode: '46038', impGeofootprintLocation: site1, distance: 10, hhc: 1000})   // 3  3  3
                                                   ,new ImpGeofootprintGeo({geocode: '46150', impGeofootprintLocation: site1, distance: 10, hhc: 2000})   // 2  1  2
                                                   ,new ImpGeofootprintGeo({geocode: '46100', impGeofootprintLocation: site1, distance: 15, hhc: 200})    // 4  0  4
                                                   ,new ImpGeofootprintGeo({geocode: '46099', impGeofootprintLocation: site1, distance: 5,  hhc: 3000})   // 1  2  1

                                                   ,new ImpGeofootprintGeo({geocode: '46038', impGeofootprintLocation: site2, distance: 10, hhc: 1000})   // 3  7  7
                                                   ,new ImpGeofootprintGeo({geocode: '46150', impGeofootprintLocation: site2, distance: 10, hhc: 2000})   // 2  5  6
                                                   ,new ImpGeofootprintGeo({geocode: '46100', impGeofootprintLocation: site2, distance: 15, hhc: 200})    // 4  4  8
                                                   ,new ImpGeofootprintGeo({geocode: '46099', impGeofootprintLocation: site2, distance: 5,  hhc: 3000})]; // 1  6  4

      const geoArray4: Array<ImpGeofootprintGeo> = [new ImpGeofootprintGeo({geocode: '46038', impGeofootprintLocation: new ImpGeofootprintLocation({locationName: 'site1'}), distance: 10, hhc: 1000})
                                                   ,new ImpGeofootprintGeo({geocode: '46150', impGeofootprintLocation: new ImpGeofootprintLocation({locationName: 'site1'}), distance: 10, hhc: 2000})
                                                   ,new ImpGeofootprintGeo({geocode: '46100', impGeofootprintLocation: new ImpGeofootprintLocation({locationName: 'site1'}), distance: 15, hhc: 200})
                                                   ,new ImpGeofootprintGeo({geocode: '46099', impGeofootprintLocation: new ImpGeofootprintLocation({locationName: 'site1'}), distance: 5,  hhc: 3000})

                                                   ,new ImpGeofootprintGeo({geocode: '46038', impGeofootprintLocation: new ImpGeofootprintLocation({locationName: 'site2'}), distance: 10, hhc: 1000})
                                                   ,new ImpGeofootprintGeo({geocode: '46150', impGeofootprintLocation: new ImpGeofootprintLocation({locationName: 'site2'}), distance: 10, hhc: 2000})
                                                   ,new ImpGeofootprintGeo({geocode: '46100', impGeofootprintLocation: new ImpGeofootprintLocation({locationName: 'site2'}), distance: 15, hhc: 200})
                                                   ,new ImpGeofootprintGeo({geocode: '46099', impGeofootprintLocation: new ImpGeofootprintLocation({locationName: 'site2'}), distance: 5,  hhc: 3000})];
/* Other tests
      console.log('ranked list', this.rank([79, 5, 18, 5, 32, 1, 16, 1, 82, 13], (a, b) => b - a))

      console.log('ranked geo list 1', this.rank(geoArray,  (a: ImpGeofootprintGeo, b: ImpGeofootprintGeo) => a.distance < b.distance && a.hhc > b.hhc ));
      console.log('ranked geo list 2', this.rank(geoArray2, (a: ImpGeofootprintGeo, b: ImpGeofootprintGeo) => a.distance < b.distance && a.hhc > b.hhc ));
*/
/*
      console.log('ranked geo list 3', this.rank(geoArray,  (a: ImpGeofootprintGeo, b: ImpGeofootprintGeo) => {
         if (a.distance < b.distance) return -1;
         if (a.distance > b.distance) return 1;
         if (a.hhc > b.hhc) return -1;
         if (a.hhc < b.hhc) return  1;
         return 0;
      }));

      // This is not working as intended.  Returns: 3, 2, 4, 1, 7, 6, 8, 4
      //                               Needs to be: 3, 2, 4, 1, 3, 2, 4, 1
      console.log('ranked geo list 4 - distance, hhc within site', this.rank(geoArray3,  (a: ImpGeofootprintGeo, b: ImpGeofootprintGeo) => {
         if (a.impGeofootprintLocation != b.impGeofootprintLocation) return 0;
         if (a.distance < b.distance) return -1;
         if (a.distance > b.distance) return 1;
         if (a.hhc > b.hhc) return -1;
         if (a.hhc < b.hhc) return  1;
         return 0;
      }));
*/

/* Put back when testing denserank
      console.log('ranked geo list 5 - distance, hhc within site', this.denserank(geoArray3,  (a: ImpGeofootprintGeo, b: ImpGeofootprintGeo) => {
         if (a.impGeofootprintLocation != b.impGeofootprintLocation) return 0;
         if (a.distance < b.distance) return -1;
         if (a.distance > b.distance) return 1;
         if (a.hhc > b.hhc) return -1;
         if (a.hhc < b.hhc) return  1;
         return 0;
      },
      (p1: ImpGeofootprintGeo, p2: ImpGeofootprintGeo) => {
         //return false;
         console.log ('IN PARTITION BY! - P1: ' + p1[0].impGeofootprintLocation.locationNumber + ', P2: ' + p2[0].impGeofootprintLocation.locationNumber);
         // console.log('p1', p1);
         // console.log('p1:  ' + p1.toString());
         // console.log('geo: ' + p1[0].geocode);
         // console.log('l1:  ' + p1[0].impGeofootprintLocation);
         // console.log('N1:  ' + p1[0].impGeofootprintLocation.locationNumber);
         // console.log('p2:  ',p2);
         // console.log('p2:  ' + p2.toString());
         console.log('locationNumber 1: ' + ((p1 != null && p1[0].impGeofootprintLocation != null) ? p1[0].impGeofootprintLocation.locationNumber : null)
                 + ', locationNumber 2: ' + ((p2 != null && p2[0].impGeofootprintLocation != null) ? p2[0].impGeofootprintLocation.locationNumber : null)
                 + ' break?: ' + ((p1 == null || p1[0].impGeofootprintLocation == null ||
                                   p2 == null || p2[0].impGeofootprintLocation == null) ? null : (p1[0].impGeofootprintLocation.locationNumber != p2[0].impGeofootprintLocation.locationNumber)));
         if (p1 == null || p2 == null)
         {
            console.log ((p1 == null) ? 'p1 was null' : 'p2 was null');
            return false
         }
         return (p1 == null || p2 == null || p1[0].impGeofootprintLocation == null || p2[0].impGeofootprintLocation == null) ? null : p1[0].impGeofootprintLocation.locationNumber != p2[0].impGeofootprintLocation.locationNumber;
      }));
*/
      // Just test sort
      // return a["one"] - b["one"] || a["two"] - b["two"];

//    less than zero,    -1 sort a before b
//    greater than zero,  1 sort b before a
//    equals zero,        0 leave a and b unchanged with respect to each other

/* Works - Inline Method
      console.log('ranked geo list 6 - just sort', this.denseRank(geoArray4,  (a: ImpGeofootprintGeo, b: ImpGeofootprintGeo) => {
         if (a == null || b == null || a.impGeofootprintLocation == null || b.impGeofootprintLocation == null)
         {
            console.warn('sort criteria is null - a:', a, ', b: ', b)
            return 0;
         }

         if (a.impGeofootprintLocation.locationName === b.impGeofootprintLocation.locationName)
         {
            if (a.distance === b.distance)
            {
               if (a.hhc === b.hhc)
                  return 0;
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
            if (a.impGeofootprintLocation.locationName >  b.impGeofootprintLocation.locationName)
               return 1;
            else
               return -1;

      }
    ,(p1: ImpGeofootprintGeo, p2: ImpGeofootprintGeo) => {
         //return false;
         console.log ('IN PARTITION BY 2! - P1: ' + p1.impGeofootprintLocation.locationName + ', P2: ' + p2.impGeofootprintLocation.locationName);
         // console.log('p1', p1);
         // console.log('p1:  ' + p1.toString());
         // console.log('geo: ' + p1[0].geocode);
         // console.log('l1:  ' + p1[0].impGeofootprintLocation);
         // console.log('N1:  ' + p1[0].impGeofootprintLocation.locationNumber);
         // console.log('p2:  ',p2);
         // console.log('p2:  ' + p2.toString());
         console.log('locationName 1: ' + ((p1 != null && p1.impGeofootprintLocation != null) ? p1.impGeofootprintLocation.locationName : null)
                 + ', locationName 2: ' + ((p2 != null && p2.impGeofootprintLocation != null) ? p2.impGeofootprintLocation.locationName : null)
                 + ' break?: ' + ((p1 == null || p1.impGeofootprintLocation == null ||
                                   p2 == null || p2.impGeofootprintLocation == null) ? null : (p1.impGeofootprintLocation.locationName != p2.impGeofootprintLocation.locationName)));
         if (p1 == null || p2 == null)
         {
            console.log ((p1 == null) ? 'p1 was null' : 'p2 was null');
            return false
         }
         return (p1 == null || p2 == null || p1.impGeofootprintLocation == null || p2.impGeofootprintLocation == null) ? null : p1.impGeofootprintLocation.locationName != p2.impGeofootprintLocation.locationName;
         })
      );
*/
      console.log('ranked geo list 7 - denseRank', this.denseRank(geoArray4,  this.sortGeos, this.partitionGeos));

/* ORIGINAL
      ,(p1: ImpGeofootprintGeo, p2: ImpGeofootprintGeo) => {
         //return false;
         console.log ('IN PARTITION BY 2! - P1: ' + p1[0].impGeofootprintLocation.locationName + ', P2: ' + p2[0].impGeofootprintLocation.locationName);
         // console.log('p1', p1);
         // console.log('p1:  ' + p1.toString());
         // console.log('geo: ' + p1[0].geocode);
         // console.log('l1:  ' + p1[0].impGeofootprintLocation);
         // console.log('N1:  ' + p1[0].impGeofootprintLocation.locationNumber);
         // console.log('p2:  ',p2);
         // console.log('p2:  ' + p2.toString());
         console.log('locationName 1: ' + ((p1 != null && p1[0].impGeofootprintLocation != null) ? p1[0].impGeofootprintLocation.locationName : null)
                 + ', locationName 2: ' + ((p2 != null && p2[0].impGeofootprintLocation != null) ? p2[0].impGeofootprintLocation.locationName : null)
                 + ' break?: ' + ((p1 == null || p1[0].impGeofootprintLocation == null ||
                                   p2 == null || p2[0].impGeofootprintLocation == null) ? null : (p1[0].impGeofootprintLocation.locationName != p2[0].impGeofootprintLocation.locationName)));
         if (p1 == null || p2 == null)
         {
            console.log ((p1 == null) ? 'p1 was null' : 'p2 was null');
            return false
         }
         return (p1 == null || p2 == null || p1[0].impGeofootprintLocation == null || p2[0].impGeofootprintLocation == null) ? null : p1[0].impGeofootprintLocation.locationName != p2[0].impGeofootprintLocation.locationName;
         })
      );*/
   }

   public calculateGeoRanks()
   {
      console.log('ImpGeofootprintGeo.service.addGeoRank - fired');
      const geos = this.get();
      console.log('Calculating geo ranks for ', (geos != null) ? geos.length : 0, ' rows');
      this.denseRank(geos,  this.sortGeos, this.partitionGeos);
      console.log('Ranked ', (geos != null) ? geos.length : 0, ' geos');

      for(let geo of geos) {
         if (this.config.debugMode) console.log('geocode: ', geo.geocode, ', rank: ', geo.rank, ', distance: ', geo.distance, ', hhc: ', geo.hhc);
         if (geo.rank === 0)
           geo.isDeduped = 1;
         else
           geo.isDeduped = 0;
      }

      // Replace the data store with this version
     // this.replace(geos);
   }


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
   /*public exportVarAttributes(state: ImpGeofootprintGeoService, geo: ImpGeofootprintGeo, header: string)
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
   };*/

   public exportVarAttributes(state: ImpGeofootprintGeoService, geo: ImpGeofootprintGeo, header: string) {
      if (state.attributeCache.has(geo)) {
            const attrs: Array<ImpGeofootprintGeoAttrib> = state.attributeCache.get(geo);
            const attr = attrs.find(i => i.attributeCode === header);
            return attr != null ? attr.attributeValue : '';
      }
      console.warn('Variable not found in attributes when exporting geofootprint:', header);
      return '';
   }

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

      // Populate the attribute cache
      this.attributeCache = new Map<ImpGeofootprintGeo, ImpGeofootprintGeoAttrib[]>();
      for (const attr of this.impGeofootprintGeoAttribService.get()) {
            if (this.attributeCache.has(attr.impGeofootprintGeo)) {
                  this.attributeCache.get(attr.impGeofootprintGeo).push(attr);
            } else {
                  this.attributeCache.set(attr.impGeofootprintGeo, [attr]);
            }
      }

      // DE1742: display an error message if attempting to export an empty data store
      if (geos.length === 0) {
            this.messageService.showGrowlError('Error exporting geofootprint', 'You must add sites and select geographies prior to exporting the geofootprint');
            return; // need to return here so we don't create an invalid usage metric later in the function since the export failed
      }

      let exportColumns: ColumnDefinition<ImpGeofootprintGeo>[] = this.getExportFormat (exportFormat);

      // TODO make this a part of the getExportFormat
      this.addVarAttributeExportColumns(exportColumns, 17);

      if (filename == null)
         filename = this.getFileName();

      // This is for now, it replaces the data store with a sorted / ranked version
      this.calculateGeoRanks();
      this.downloadExport(filename, this.prepareCSV(exportColumns));
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
            exportColumns.push({ header: 'Include in Deduped Footprint', row: (state, data) => data.isDeduped}); // 1});
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
