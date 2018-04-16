import { TransactionManager } from './TransactionManager.service';
import { DAOBaseStatus } from './../../api/models/BaseModel';
import { ImpGeofootprintGeo } from './../../targeting/models/ImpGeofootprintGeo';
import { RestResponse } from './../../../models/RestResponse';
import { RestDataService } from './../../common/services/restdata.service';
import { HttpClient} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { Subject } from 'rxjs/Subject';

// Imports for exporting CSVs
import { encode } from 'punycode';
import * as $ from 'jquery';

// ---------------------------------------------
// Callback method signatures
// ---------------------------------------------
type callbackType<T> = (dataArray: T[]) => boolean;      // Callback takes in an array of data and returns a boolean
type callbackElementType<T> = (data: T) => boolean;      // Callback takes in an instance of data and returns a boolean
type callbackMutationType<T> = (dataArray: T[]) => T[];  // Callback takes in an array of data and returns an array of data
type callbackSuccessType<T> = (boolean) => boolean;      // Callback takes in a boolean and returns a boolean

type headerHandlerType<T> = (state: any) => any;         // Register export variable handlers
type variableHandlerType<T> = (state: any, data: T, header: string|number) => any;         // Register export variable handlers
//type variableHandlerType<T> = (data: T, externalData: Map<string, any>) => void;         // Register export variable handlers

/**
 * Data store configuration, holds the oauth token for communicating with Fuse
 */
export class DataStoreServiceConfiguration {
      public oauthToken: string;
      public tokenExpiration: number;
      public tokenRefreshFunction: Function;
}

export interface ColumnDefinition<T> {
   header: number | string | headerHandlerType<T>;
   row:    number | string | variableHandlerType<T>;
}

export enum InTransaction {
   true,
   false
}

export class DataStore<T>
{
   private static dataStoreServiceConfiguration: DataStoreServiceConfiguration;
   private transientId: number = 0;
   public  dbRemoves: Array<T> = new Array<T>();

   // Private data store, exposed publicly as an observable
   private _dataStore = new Array<T>();
   protected _storeSubject = new BehaviorSubject<T[]>(this._dataStore);
   private fetchSubject: Subject<T[]> = new Subject<T[]>();
   
   // Public access to the data store is through this observable
   public storeObservable: Observable<T[]> = this._storeSubject.asObservable();

   public storeLength: number = 0;  // Publically expose number of rows in the _dataStore
   public currStoreId: number = 1;  // An id that will increment as you getNextStoreId. Unique within the store

   constructor(private rest: RestDataService, public dataUrl: string, public transactionManager?: TransactionManager) { }

   // ---------------------------------------------
   // Utility / Non-Essential Methods
   // ---------------------------------------------

   /**
    * Bootstrap the data store, right now the only thing we bootstrap with is the oauth token
    */
   public static bootstrap(config: DataStoreServiceConfiguration) {
      DataStore.dataStoreServiceConfiguration = config;
   }

   /**
    * Get the data store configuration
    */
   public static getConfig() : DataStoreServiceConfiguration {
      return DataStore.dataStoreServiceConfiguration;
   }

   /**
    * Log the store to the console.  Also an example of two ways to iterate through it
    * @param storeTitle Must provide a header since there is no way to differentiate dataStores
    * @param useFirstMethod If false, it will show the row index next to the data
    */
   public debugLogStore(storeTitle: string, useFirstMethod: boolean = false)
   {
      try
      {
         console.log('--# ' + ((storeTitle)? storeTitle.toUpperCase() + ' ' : '') + 'STORE CONTENTS #----------------');

         if (useFirstMethod)
         {
            if (this._dataStore)
               for (const data of this._dataStore)
                  console.log(data);
            else
               console.log('** Empty **');
         }
         else
            if (this._storeSubject && this._storeSubject.getValue())
               for (let i = 0; i < this._storeSubject.getValue().length; i++)
                  console.log('Store[' + i + '] = ', this._storeSubject.getValue()[i]);
      }
      catch (e)
      {
         console.log('** Empty **');
      }
   }

    /**
     * Returns an incrementing ID number that is unique within this dataStore
     * Useful for stubbing IDs
     */
    public getNextStoreId(): number
    {
       return this.currStoreId++
    }

   // ---------------------------------------------
   // Private Data Store Methods
   // ---------------------------------------------

   /**
    * Private method accessed publicly through get, which will fetch
    * data into the store from this.dataUrl.
    */
   private fetch(postOperation?: callbackMutationType<T>, inTransaction: InTransaction = InTransaction.true)
   {
      console.log('DataStore.fetch fired for ' + this.dataUrl);
//    console.trace('fetch trace');

      this.rest.get(this.dataUrl).subscribe(restResponse => {
         // Log and test the response
         console.log('DataStore.fetch - REST returnCode: ' + restResponse.returnCode, restResponse);

         // Populate data store
         if (restResponse.payload && restResponse.payload.rows)
            this._dataStore = restResponse.payload.rows;
         else
         // A single object through a load
         {
            if (this._dataStore == null)
               this._dataStore = new Array<T>();
            this._dataStore.push(restResponse.payload);
         }

         // Notify observers if not participating in the transaction or there is no transaction or TransactionManager
         if (inTransaction === InTransaction.false || this.transactionManager == null || this.transactionManager.notInTransaction())
         {
            console.log('DataStore.fetched ' + this._dataStore.length + ' rows, notifying subscribers');
            this._storeSubject.next(this._dataStore);
            this.fetchSubject.next(this._dataStore);
         }
         else
         {
            console.log('DataStore.fetched ' + this._dataStore.length + ' rows, holding notification for transaction');
            this.transactionManager.push(this._storeSubject, this._dataStore);
            this.transactionManager.push(this.fetchSubject, this._dataStore);
         }

         if (postOperation)
            postOperation(this._dataStore);
      },
      (error: any) => {
         console.log ('DataStore.fetch - ERROR:', error);
         // TODO: Should we re-raise or throw some other event?
         return Observable.throw(error);
      });
   }

   // ---------------------------------------------
   // Public Data Store Methods
   // ---------------------------------------------

   /**
    * get retrieves the data store and issues a fetch if it is empty
    *
    * @param forceRefresh  - If true will issue a fetch to refresh from the dataUrl
    * @param preOperation  - A callback delegate that will fire prior to the fetch
    * @param postOperation - A callback delegate that will fire after the fetch
    */
   public get(forceRefresh?: false,   forceClear?: false,           inTransaction?: InTransaction) : T[];
   public get(forceRefresh:  true,    forceClear?: boolean,         inTransaction?: InTransaction) : Observable<T[]>;
   public get(forceRefresh:  boolean, forceClear?: boolean,         inTransaction?: InTransaction, preOperation?: callbackType<T>, postOperation?: callbackMutationType<T>) : T[] | Observable<T[]>;
   public get(forceRefresh?: boolean, forceClear:  boolean = false, inTransaction?: InTransaction, preOperation?: callbackType<T>, postOperation?: callbackMutationType<T>) : T[] | Observable<T[]>
   {
      console.log('DataStore.get fired - this.dataUrl: ', this.dataUrl);

      if (preOperation)
         preOperation(this._dataStore);

      if (forceClear)
      {
         this.clearAll(false);
         //this._dataStore.length = 0;
         //this._dataStore = new Array<T>();
      }

      if (forceRefresh) // Temporarily out || this._dataStore.length === 0)
      {
         this.fetch(postOperation, (inTransaction == null) ? InTransaction.false : inTransaction);
         return this.fetchSubject;
      }

//      if (postOperation)
//          postOperation(this._dataStore);

      return this._dataStore;
   }

   /**
    * Add will push one or more data elements into the data store.
    * The preOperation callback can be used to validate each record before it goes into the store.
    * If the preOperation returns false, then that element will not be put in the store.
    * Furthermore, a postOperation callback fires after all of the elements have been processed and
    * can be used to determine if the good changes can go in despite having some failures not being inserted.
    * This would be allowed when postOperation is either not present or returns true.
    * If the postOperation is present and returns false, then all rows must be a success or none of them are inserted.
    * When there is no postOperation, only when ALL of the data elements fail validation would be considered a failure.
    *
    * @param dataArray     - An array of data elements to add to the data store
    * @param preOperation  - A callback delegate that will fire for each element just before it is added
    * @param postOperation - A callback delegate that fires after all elements have been processed and can determine if partial successes persist
    */
   public add(dataArray: T[], preOperation?: callbackElementType<T>, postOperation?: callbackSuccessType<T>, inTransaction: InTransaction = InTransaction.true)
   {
      if(DataStore.dataStoreServiceConfiguration != null) {
         console.log('the oauth token in the data store is: ', DataStore.dataStoreServiceConfiguration.oauthToken);
      }
      let success: boolean = true;
      let localCache: T[];
      let numSuccesses: number = 0;

      if (preOperation)
      {
         // Create a copy of the current datastore
         localCache = this._dataStore.slice(0);

         // For each element in the array parameter
         for (const data of dataArray)
            // Add new element to the data store if there isn't a preOperation or it returns true
            if (!preOperation || (preOperation && preOperation(data)))
            {
               console.log('add - preOp returned true, pushing: ', data);
               localCache.push(data);
               numSuccesses++;
            }
            else
            {
               // Indicate row wasn't added, but it's the applications job to maintain the list of failures
               success = false;
               console.log('add - preOp returned false, not adding: ', data);
            }
      }
      else
         // Add every new element to the data store, because there is no preOperation to invalidate them
         if (dataArray && dataArray.length > 0)
            for (const data of dataArray)
               this._dataStore.push(data);

      // postOperation determines if a success = false, is still a success.  ie. some of the rows were added, but not all and thats ok
      if (postOperation)
         success = postOperation(success);
      else
         // If there is no postOperation, let the good rows go through and only fail if all rows failed
         if (numSuccesses > 0)
            success = true;

      // If postOperation has determined that the add as a whole was a success and we have used a preOperation
      if (success && preOperation)
         this._dataStore = localCache;

      // Register data store change and notify observers
      if (success)
      {
         if (inTransaction === InTransaction.false || this.transactionManager == null || this.transactionManager.notInTransaction())
         {         
            console.log('DataStore.service.add - success, alerting subscribers');
            this._storeSubject.next(this._dataStore);
         }
         else
         {
            console.log('DataStore.service.add - success, in transaction, holding notification for transaction');
            this.transactionManager.push(this._storeSubject, this._dataStore);
         }
      }
   }

   /**
    * Replace clears the current data store state and replaces it with the dataArray.
    * The preOperation callback can be used to validate each record before it goes into the store.
    * If the preOperation returns false, then that element will not be put in the store.
    * Furthermore, a postOperation callback fires after all of the elements have been processed and
    * can be used to determine if the good changes can go in despite having some failures not being inserted.
    * This would be allowed when postOperation is either not present or returns true.
    * If the postOperation is present and returns false, then all rows must be a success or none of them are inserted.
    * When there is no postOperation, only when ALL of the data elements fail validation would be considered a failure.
    *
    * @param dataArray     - An array of data elements to add to the data store
    * @param preOperation  - A callback delegate that will fire for each element just before it is added
    * @param postOperation - A callback delegate that fires after all elements have been processed and can determine if partial successes persist
    */
   public replace(dataArray: T[], preOperation?: callbackElementType<T>, postOperation?: callbackSuccessType<T>, inTransaction: InTransaction = InTransaction.true)
   {
      console.log ('datastore.replace - fired');
      this.clearAll(false);
      console.log ('datastore.replace - adding data - ', (dataArray != null) ? dataArray.length : 0, ' rows.');
      this.add(dataArray, preOperation, postOperation, inTransaction);
      console.log ('dataStore now has ', (this._dataStore != null) ? this._dataStore.length : 0, ' rows');
   }

   private setDbRemove(removeData: T)
   {
      if (removeData != null)
      {
         console.log('registered for db removal: ', removeData);
         removeData['dirty'] = true;
         removeData['baseStatus'] = DAOBaseStatus.DELETE;
         if (this.dbRemoves == null)
            this.dbRemoves = new Array<T>();
         this.dbRemoves.push(removeData);
      }
   }

   // For database removals
   public addDbRemove(removeData: T | T[])
   {
      if (Array.isArray(removeData))
         for (let removeElement of removeData)
            this.setDbRemove(removeElement);
      else
         this.setDbRemove(removeData);
   }

   public clearDbRemoves()
   {
      this.dbRemoves = new Array<T>();
   }

   public removeAt (index: number, inTransaction: InTransaction = InTransaction.true)
   {
      console.log('delete at index: ' + index);

      if (this._dataStore.length === 0 || index < 0 || index >= this._dataStore.length)
         return;

      // For database removals
      this.addDbRemove(this._dataStore[index]);

      // Remove the element from the array at the index
      if (this._dataStore.length > 1)
      {
         if (index >= 0)
            this._dataStore = [...this._dataStore.slice(0, index),
                               ...this._dataStore.slice(index + 1)];
         else
            this._dataStore = [...this._dataStore.slice(0, this._dataStore.length + index),
                               ...this._dataStore.slice(this._dataStore.length + index + 1)];
      }
      else
         this._dataStore = this._dataStore.slice(0, 0);

      // Register data store change and notify observers
      if (inTransaction === InTransaction.false || this.transactionManager == null || this.transactionManager.notInTransaction())
         this._storeSubject.next(this._dataStore);
      else
         this.transactionManager.push(this._storeSubject, this._dataStore);
   }

   public remove (data: T | T[], inTransaction: InTransaction = InTransaction.true)
   {
      if (data == null)
         return;

      if (Array.isArray(data))
      {
         // Add database removal
         this.addDbRemove(data);

         const arrayRemovals = new Set(data);
         this._dataStore = this._dataStore.filter(t => !arrayRemovals.has(t));
         if (inTransaction === InTransaction.false || this.transactionManager == null || this.transactionManager.notInTransaction())
            this._storeSubject.next(this._dataStore);
         else
            this.transactionManager.push(this._storeSubject, this._dataStore);
      }
      else
      {
         // Remove the element from the array
         const index = this._dataStore.indexOf(data);
         if (index != null)
            this.addDbRemove(this._dataStore[index]);
         this.removeAt(index);
      }
   }

   // TODO: loop until no search results found
   public removeBySearch (search: any)
   {
      const data: T = this.find(search);

      if (data !== undefined)
         this.remove(data);
   }

   /**
    * Finds a matching object in the store using a partially constructed instance
    *
    *  const searchGeo: ImpGeofootprintGeo = new ImpGeofootprintGeo({geocode: '48375C1'});
    *  const foundGeo = this.impGeofootprintGeoService.find(searchGeo);
    *  console.log('foundGeo', foundGeo);
    *
    *     store instance of storeGeos[10] is returned
    * @param search An object that you wish to find in the data store
    */
   public find(search: any) : T
   {
      const keys = Object.keys(search).filter(key => search[key] !== undefined);
      const match = this._dataStore.find(item => keys.some(key => item[key] == search[key]));

      return match;
   }

   private deepFindByArray (obj, propsArray, defaultValue)
   {
      // If we have reached an undefined/null property
      // then stop executing and return the default value.
      // If no default was provided it will be undefined.
      if (obj === undefined || obj === null) {
         return defaultValue;
      }

      // If the path array has no more elements, we've reached
      // the intended property and return its value
      if (propsArray.length === 0) {
         return obj;
      }

      // Prepare our found property and path array for recursion
      const foundSoFar = obj[propsArray[0]];
      const remainingProps = propsArray.slice(1);

      return this.deepFindByArray(foundSoFar, remainingProps, defaultValue);
   }

   public deepFind (obj, props, defaultValue)
   {
      // If the property list is in dot notation, convert to array
      if (typeof props === 'string') {
          props = props.split('.');
      }

      return this.deepFindByArray(obj, props, defaultValue);
   }

   /**
    * Return a list of data store objects that match the searchValue
    *
    * Ex: Return all of the geofootprint geos whose location is BUDDY'S PIZZA - GRAND RAPIDS
    * const getByGeos: ImpGeofootprintGeo[] = this.impGeofootprintGeoService.getListBy ('impGeofootprintLocation.locationName', 'BUDDY\'S PIZZA - GRAND RAPIDS');
    *
    * @param props The property to search for
    * @param searchValue The value to match
    */
   // TODO: Add a comparator delegate property, use === if not provided
   public getListBy (props, searchValue, comparator?: callbackElementType<T>) : T[]
   {
      const results: T[] = [];

      if (this._dataStore != null)
         for (const item of this._dataStore)
         {
            const result: T = this.deepFind (item, props, null);
            if (comparator != null && comparator(item))
               results.push(item);
            else
               if (result === searchValue)
                  results.push(item);
         }

      return results;
   }

   /**
    * This appears to be broken right now.
    * @param search
    */
   public findIndex(search: any)
   {
      const keys = Object.keys(search).filter(key => search[key] !== undefined);
      const index = this._dataStore.findIndex(item => keys.some(key => item[key] === search[key]));

      return index;
   }

   public update (oldData: T, newData: T, inTransaction: InTransaction = InTransaction.true)
   {
     if (oldData != null && newData != null && oldData !== newData) {
       const index = this._dataStore.indexOf(oldData);
       this._dataStore = [...this._dataStore.slice(0, index),
         newData,
         ...this._dataStore.slice(index + 1)];
     }

      // Register data store change and notify observers
      if (inTransaction === InTransaction.false || this.transactionManager == null || this.transactionManager.notInTransaction())
         this._storeSubject.next(this._dataStore);
      else
         this.transactionManager.push(this._storeSubject, this._dataStore);
   }

   public updateAt (newData: T, index: number = 0, inTransaction: InTransaction = InTransaction.true)
   {
//    console.log ('datastore updateAt - index: ' + index + ', data: ', newData);
      if (index == 0)
         this._dataStore = [newData,
                           ...this._dataStore.slice(index + 1)];
      else
         this._dataStore = [...this._dataStore.slice(0, index),
                           newData,
                           ...this._dataStore.slice(index + 1)];

//    console.log('datastore alerting subscribers', ((this._storeSubject && this._storeSubject.observers) ? this._storeSubject.observers.length : 0));
      // Register data store change and notify observers
      if (inTransaction === InTransaction.false || this.transactionManager == null || this.transactionManager.notInTransaction())
         this._storeSubject.next(this._dataStore);
      else
         this.transactionManager.push(this._storeSubject, this._dataStore);
   }

   /**
    * Will empty the dataStore, reset the currStoreId and optionally notify observers
    * @param notifySubscribers If false it won't notify observers; allowing a clear and load to be observed as one transaction
    */
   public clearAll(notifySubscribers = true, inTransaction: InTransaction = InTransaction.true)
   {
      console.log('clearing datastore of ', this._dataStore.length, ' rows.');
      this._dataStore.length = 0;       // Recommended way, but UI doesn't recognize the change
      this._dataStore = new Array<T>(); // This definitely updates the UI
      this.currStoreId = 1;
      this.debugLogStore('Store after clearAll');

      // There are times where you want to clear as part of transaction and notify at the end
      if (notifySubscribers)
      {
         if (inTransaction === InTransaction.false || this.transactionManager == null || this.transactionManager.notInTransaction())
            this._storeSubject.next(this._dataStore);
         else
            this.transactionManager.push(this._storeSubject, this._dataStore);
      }
   }

   public jsonp(url: string, callbackParam: string)
   {
      this.rest.jsonp(url, callbackParam);
   }

   public length()
   {
      return (this._dataStore != null) ? this._dataStore.length : 0;
   }

   //
   //  EXPORT METHODS
   //
   // So there is more work to do here to utilize sourceData.
   // The export variable handlers would have no access to this sourcedata parameter.
   // Would need to make it a member of the service.  Not sure how I feel about that.
   // Multiple exports at the same time could clobber both of them.
   // Add additional state that can be passed to them?  Is that even possible?
   public prepareCSV(columns: ColumnDefinition<T>[], sourceData?:Array<T>) : string[]
   {
      // Set the input Array
      let csvSource: Array<T> = (sourceData == null) ? this._dataStore : sourceData;

//      console.log('datastore.service.prepareCSV fired - with ' + this._dataStore.length + ' rows of store data');
      console.log('datastore.service.prepareCSV fired - with ' + csvSource.length + ' rows of store data');

//    if (this._dataStore == null || this._dataStore.length < 1) {
      if (csvSource == null || csvSource.length < 1) {
            // TODO: HANDLE - this.messageService.add({ severity: 'error', summary: 'No geography found', detail: `Please define a trade area.` });
         throw new Error('prepareCSV - No data provided to export');
      }
         
      // Initialize Output Array
      const csvData: string[] = new Array<string>();
      let row: string = '';
      let field: any;

      // Write Headers
      for (let column of columns)
      {            
         field = column.header;
         // Add the header surround in double quotes if not already
         row += (field != null) ? ((field.slice(0, 1) === '"' ? '' : '"') + field + (field.slice(-1) === '"' ? '' : '"')) + ',' : ',';
      }

      // If we have built headers, push it to the result
      if (row != '')
         csvData.push(row);      

      // For every row of data in the data store
      for (const data of csvSource) // this._dataStore)
      {
         // Begin a new line for every row of data
         row = '';

         // Loop through each column determining its final value
         for (let column of columns)
         {
            if (typeof(column.row) === 'string' || typeof(column.row) === 'number' || column.row == null)
               field = column.row;
            else
            if (typeof(column.row) === 'function')
               field = column.row(this, data, column.header.toString());
            else
            {
               console.warn('column: ' + column.header + ' = ' + column.row + ' (Unrecognized Type: ' + typeof(column.row) + ')');
               field = column.row;
            }

            // If we have a string, enclose it with double quotes if it isn't already
            if (field != null && typeof(field) === 'string')
               field = (field.slice(0, 1) === '"' ? '' : '"') + field + (field.slice(-1) === '"' ? '' : '"');
         // console.log('column: ' + column.header + ' = ' + field + ' (' + typeof(column.row) + ')');

            // Add the final value in field to the row
            row += (field != null) ? field + ',' : ',';
         }
         // If we have built a row, push it to the result
         if (row != '')
            csvData.push(row);            
      }
      return csvData;
   }

   public downloadExport(filename: string, csvData: string[])
   {
      // Trap potential errors
      if (filename == null)
         throw  Error('datastore.service.downloadExport requires a filename');

      if (csvData == null || csvData.length == 0) {
         console.log('csvData:', csvData);
         throw Error('exportCsv requires csvData to continue');
      }

      // Encode the csvData into a gigantic string
      let csvString: string = '';
      for (const row of csvData) {
         csvString += encode(row) + '\n';
      }

      const blob = new Blob(['\ufeff', csvString]);
      const url = URL.createObjectURL(blob);
      // Use jquery to create and autoclick a link that downloads the CSV file
      const link = $('<a/>', {
         style: 'display:none',
         href:  url,
         download: filename
      }).appendTo('body');
      link[0].click();   
      link.remove();
   }

}