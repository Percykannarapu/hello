import { groupBy } from '@val/common';
import { BehaviorSubject, EMPTY, Observable, Subject, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { DAOBaseStatus } from '../../../../worker-shared/data-model/impower.data-model.enums';
import { FileService } from './file.service';
import { LoggingService } from './logging.service';
import { RestDataService } from './restdata.service';
import { TransactionManager } from './TransactionManager.service';

// ---------------------------------------------
// Callback method signatures
// ---------------------------------------------
export type callbackType<T> = (dataArray: T[]) => boolean;      // Callback takes in an array of data and returns a boolean
export type callbackElementType<T> = (data: T) => boolean;      // Callback takes in an instance of data and returns a boolean
export type callbackMutationType<T> = (dataArray: T[]) => T[];  // Callback takes in an array of data and returns an array of data
export type callbackSuccessType<T> = (boolean) => boolean;      // Callback takes in a boolean and returns a boolean

export enum InTransaction {
   false,   // Notifications processed normally
   true,    // Notifications are queued until transaction ends
   silent   // Notifications do not go out
}

export class DataStore<T>
{
   public  dbRemoves: Array<T> = new Array<T>();

   // Private data store, exposed publicly as an observable
   private   _dataStore = new Array<T>();
   protected _storeSubject = new BehaviorSubject<T[]>(this._dataStore);
   private   fetchSubject: Subject<T[]> = new Subject<T[]>();

   // Public access to the data store is through this observable
   public storeObservable: Observable<T[]> = this._storeSubject.asObservable();

   public currStoreId: number = 1;  // An id that will increment as you getNextStoreId. Unique within the store

   protected constructor(protected rest: RestDataService,
                         protected dataUrl: string,
                         protected logger: LoggingService,
                         protected transactionManager?: TransactionManager,
                         protected storeName: string = '') {
      if (this.storeName !== '')
         this.storeName += ' ';
   }

  startTx() : void {
    this.transactionManager.startTransaction();
  }

  stopTx() : void {
    this.transactionManager.stopTransaction();
  }

   public makeDirty()
   {
      this.logger.debug.log(`Make dirty for ${this.storeName} called`, this._dataStore.length);
      this._storeSubject.next(this._dataStore);
   }

   /**
    * method to load the data stores - should be overridden in each subclass so the entire hierarchy will flow downwards
    */
   load(items: T[]) : void {
     this.clearAll(false);
     this.clearAllDbRemoves();
     this.add(items);
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
         this.logger.debug.log('--# ' + ((storeTitle) ? storeTitle.toUpperCase() + ' ' : '')
                            + ((this.storeName != null) ? this.storeName.toUpperCase() + ' ' : '')
                            + 'STORE CONTENTS #----------------');

         if (useFirstMethod)
         {
            if (this._dataStore)
               for (const data of this._dataStore)
                  this.logger.debug.log(data);
            else
               this.logger.debug.log('** Empty **');
         }
         else
            if (this._storeSubject && this._storeSubject.getValue() && this._storeSubject.getValue().length > 0)
               for (let i = 0; i < this._storeSubject.getValue().length; i++)
                  this.logger.debug.log('Store[' + i + '] = ', this._storeSubject.getValue()[i]);
            else
               this.logger.debug.log('** Empty **');
         }
      catch (e)
      {
         this.logger.warn.log(e);
         this.logger.debug.log('** Empty **');
      }
   }

   /**
    * Log the contents of dbRemoves to the console.
    * @param removesTitle Must provide a header since there is no way to differentiate dataStores
    */
   public debugLogDBRemoves(removesTitle: string)
   {
      try
      {
         this.logger.debug.log('--# ' + ((removesTitle) ? removesTitle.toUpperCase() + ' ' : '')
                            + ((this.storeName != null) ? this.storeName.toUpperCase() + ' ' : '')
                            + 'DATABASE REMOVES #----------------');

         if (this.dbRemoves != null && this.dbRemoves.length > 0)
            for (let i = 0; i < this.dbRemoves.length; i++)
               this.logger.debug.log('DBRemoves[' + i + '] = ', this.dbRemoves[i]);
         else
            this.logger.debug.log('** Empty **');
      }
      catch (e)
      {
         this.logger.warn.log(e);
         this.logger.debug.log('** Empty **');
      }
   }

    /**
     * Returns an incrementing ID number that is unique within this dataStore
     * Useful for stubbing IDs
     */
    public getNextStoreId() : number
    {
       return this.currStoreId++;
    }

    /**
     * Groups the data store data by the contents of a field identified by its name
     * @param {K} fieldName: The name of the field to extract grouping info from
     * @returns {Map<T[K], T[]>}
     */
    public groupBy<K extends keyof T>(fieldName: K) : Map<T[K], T[]>
    {
      return groupBy(this._dataStore, fieldName);
    }

    public denseRank(items: T[], sortFn: (a: T, b: T) => number, partitionFn: (a: T, b: T) => boolean)
    {
      items.sort((a, b) => sortFn(a, b));
      return items.reduce((a, x, i, s) => {
                     // If this is the first row processed, initialize rank to 0
                     if (i === 0)
                     {
                        a[i] = s[i];
                        a[i].rank = 0;
                     }
                     else
                     {
                        // If we have encountered a break in the sorted data, reset the rank
                        if (partitionFn(s[i], s[i - 1]))
                        {
                           a[i] = s[i];
                           a[i].rank = 0;
                        }
                        // Otherwise increment the rank
                        else
                        {
                           a[i] = s[i];
                           a[i].rank = a[i - 1].rank + 1;
                        }
                     }
                     return a;
                  }
                  // Indicate that we are returning an array
                  , []);
   }

   // ---------------------------------------------
   // Database Removal Methods
   // ---------------------------------------------
   private setDbRemove(removeData: T)
   {
      if (removeData != null)
      {
         removeData['dirty'] = true;
         removeData['baseStatus'] = DAOBaseStatus.DELETE;
         if (this.dbRemoves == null)
            this.dbRemoves = new Array<T>();

         // If the db removes list doesn't already have this item
         // TODO: Does altering the transients dirty and baseStatus affect this?
         if (!this.dbRemoves.includes(removeData))
         {
            //this.logger.debug.log(this.storeName, 'registered for db removal: ', removeData);
            this.dbRemoves.push(removeData);
         }
      }
   }

   // For database removals
   public addDbRemove(removeData: T | T[] | ReadonlyArray<T>)
   {
      if (Array.isArray(removeData))
         for (const removeElement of removeData)
            this.setDbRemove(removeElement);
      else
         this.setDbRemove(removeData);
   }

   public clearAllDbRemoves()
   {
      this.dbRemoves = new Array<T>();
   }

   public clearDBRemoves(readyDBRemoves: T[])
   {
      // If there are removals, put them back into the datastore
      if (this.dbRemoves != null && readyDBRemoves != null)
      {
         // Set dbRemoves to contain all removes except those in readyDBRemoves
         this.dbRemoves = this.dbRemoves.filter(obj => !readyDBRemoves.includes(obj));
      }
   }

   public readyAllDBRemoves()
   {
      // If there are removals, put them back into the datastore
      if (this.dbRemoves != null)
      {
         // Put the removals at the head of the datastore
         this._dataStore = this._dataStore.concat(this.dbRemoves);

         // Removals are now in the datastore, ready for persistence, clear the list
         this.clearAllDbRemoves();
      }
   }

   public readyDBRemoves(readyDBRemoves: T[])
   {
      // If there are removals, put them back into the datastore
      if (this.dbRemoves != null && readyDBRemoves != null)
      {
         // Put the removals at the head of the datastore
         this._dataStore = this._dataStore.concat(readyDBRemoves);

         // Removals are now in the datastore, ready for persistence, clear the list of readyDBRemoves
         this.clearDBRemoves(readyDBRemoves);
      }
   }

   public filterBy (filterOp: (T, number) => boolean, treeRemoveCountOp: ([T]) => number, includeNormal: boolean = true, includeDBRemoves: Boolean = false, includeIfChildRemoves: boolean = false) : T[]
   {
      let results: T[] = [];

      if (includeNormal)
         results = this.get().filter(filterOp);

      if (includeDBRemoves)
         results = results.concat(this.dbRemoves.filter(filterOp));

      // Conditionally check for a remove in the tree
      if (includeIfChildRemoves)
      {
         results = results.concat(this.get().concat(this.dbRemoves).filter(src => {
            if (treeRemoveCountOp != null && !results.includes(src))
            {
               return treeRemoveCountOp([src]) > 0;
            }
            else
               return false;
         }));
      }
      return results;
   }

   /**
    * Adds DB removes back into the data store in preperation for persistence.
    * This enables removing via a search parameter.
    *
    * Ex: Return all of the geofootprint geos whose location is BUDDY'S PIZZA - GRAND RAPIDS
    * const getByGeos: ImpGeofootprintGeo[] = this.impGeofootprintGeoService.getListBy ('impGeofootprintLocation.locationName', 'BUDDY\'S PIZZA - GRAND RAPIDS');
    *
    * @param propertyStr The property to search for
    * @param searchValue The value to match
    * @param comparator  An optional search comparator
    */
   public readyDBRemovesBy (propertyStr, searchValue, comparator?: callbackElementType<T>)
   {
      const toReady: T[] = this.getListBy(propertyStr, searchValue, comparator);
      this.readyDBRemoves(toReady);
   }

   public postDBRemoves(domain: string, model: string, apiVersion: string = 'v1', removes: T[]) : Observable<number>
   {
      this.logger.debug.log(this.storeName + '.service.postDBRemoves - fired');
      const postUrl: string = apiVersion.toLowerCase() + '/' + domain.toLowerCase() + '/base/' + model.toLowerCase() + '/saveList';

      let resultObs: Observable<number>;
      try
      {
         const numRemoves: number = (removes != null) ? removes.length : 0;
         this.logger.debug.log('   ', numRemoves + ' ' + model + 's will be deleted');

         if (numRemoves > 0)
         {
            const payload: string = JSON.stringify(removes);

            this.logger.debug.log(this.storeName, 'payload');
            this.logger.debug.log(payload);
            this.logger.debug.log('Posting to: ' + postUrl);
            // resultObs = EMPTY;  // For testing to just see the payload, uncomment this line and comment out the resultObs block
            resultObs = this.rest.post(postUrl, payload)
                                 .pipe(tap(restResponse => {
                                       this.logger.debug.log (model + ' dbRemove post result:', restResponse);
                                       if (restResponse.returnCode === 200)
                                          this.logger.debug.log('postDBRemoves - ' + model + ' - success response');
                                       else
                                          this.logger.debug.log('postDBRemoves - ' + model + ' - failure response');
                                       this.logger.debug.log('--------------------------------------------');
                                       })
                                       , map(restResponse => restResponse.returnCode)
                                      );
         }
         else
         {
            this.logger.debug.log('No db removes to post');
            resultObs = EMPTY;
         }
     }
     catch (error)
     {
        this.logger.error.log(this.storeName, '.service.performDBRemove - Error: ', error);
        this.transactionManager.stopTransaction();
        resultObs = throwError(error);
     }

     return resultObs;
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
      this.rest.get(this.dataUrl).subscribe(restResponse => {
         // Populate data store
         if (restResponse.payload && restResponse.payload.rows)
         {
           this._dataStore = restResponse.payload.rows;
         }
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
            this._storeSubject.next(this._dataStore);
            this.fetchSubject.next(this._dataStore);
         }
         else
         {
            this.transactionManager.push(this._storeSubject, this._dataStore);
            this.transactionManager.push(this.fetchSubject, this._dataStore);
         }

         if (postOperation)
            postOperation(this._dataStore);
      },
      (error: any) => {
         this.logger.error.log (this.storeName, 'DataStore.fetch - ERROR:', error);
         this.clearAll(true, inTransaction);
         this.fetchSubject.error(error);
      },
        () => this.fetchSubject.complete());
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
      if (preOperation)
         preOperation(this._dataStore);

      if (forceClear)
      {
         this.clearAll(false);
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
   public add(dataArray: T[] | ReadonlyArray<T>, preOperation?: callbackElementType<T>, postOperation?: callbackSuccessType<T>, inTransaction: InTransaction = InTransaction.true)
   {
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
               localCache.push(data);
               numSuccesses++;
            }
            else
            {
               // Indicate row wasn't added, but it's the applications job to maintain the list of failures
               success = false;
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
//          this.logger.debug.log(this.storeName, 'DataStore.service.add - success, alerting subscribers');
            this._storeSubject.next(this._dataStore);
         }
         else
            if (inTransaction !== InTransaction.silent)
            {
   //          this.logger.debug.log(this.storeName, 'DataStore.service.add - success, in transaction, holding notification for transaction');
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
      this.logger.debug.log (this.storeName, 'datastore.replace - fired');
      this.clearAll(false, InTransaction.true, false);
      this.add(dataArray, preOperation, postOperation, inTransaction);
   }

   public removeAt (index: number, inTransaction: InTransaction = InTransaction.true)
   {
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

   public remove (data: T | T[] | ReadonlyArray<T>, inTransaction: InTransaction = InTransaction.true)
   {
      if (data == null)
         return;

      if (Array.isArray(data))
      {
         if (data.length === 0) return;

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

   public removeAll()
   {
      this.remove(this.get());
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
    *  this.logger.debug.log(this.storeName, 'foundGeo', foundGeo);
    *
    *     store instance of storeGeos[10] is returned
    * @param search An object that you wish to find in the data store
    */
   public find(search: any) : T
   {
      const keys = Object.keys(search).filter(key => search[key] !== undefined);
      return this._dataStore.find(item => keys.some(key => item[key] === search[key]));
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
      return this._dataStore.findIndex(item => keys.some(key => item[key] === search[key]));
   }

   public update (oldData: T, newData: T, inTransaction: InTransaction = InTransaction.true)
   {
     if (oldData != null && newData != null && oldData !== newData) {
       const index = this._dataStore.indexOf(oldData);
       if (index === -1) { return; }
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
      if (index === 0)
         this._dataStore = [newData,
                           ...this._dataStore.slice(index + 1)];
      else
         this._dataStore = [...this._dataStore.slice(0, index),
                           newData,
                           ...this._dataStore.slice(index + 1)];

      // Register data store change and notify observers
      if (inTransaction === InTransaction.false || this.transactionManager == null || this.transactionManager.notInTransaction())
      {
         this._storeSubject.next(this._dataStore);
      }
      else
      {
         this.transactionManager.push(this._storeSubject, this._dataStore);
      }
   }

   /**
    * Will empty the dataStore, optionally reset the currStoreId and optionally notify observers
    * @param notifySubscribers If false it won't notify observers; allowing a clear and load to be observed as one transaction
    * @param inTransaction If true, the clear is participating in a transaction if there is one
    */
   public clearAll(notifySubscribers = true, inTransaction: InTransaction = InTransaction.true, resetIds: Boolean = false)
   {
      if (this._dataStore != null) // && this._dataStore.length > 0)
         this.logger.debug.log(this.storeName, 'clearing datastore of ', this._dataStore.length, ' rows.');
      this._dataStore.length = 0;       // Recommended way, but UI doesn't recognize the change
      this._dataStore = new Array<T>(); // This definitely updates the UI
      if (resetIds)
         this.currStoreId = 1;

      // There are times where you want to clear as part of transaction and notify at the end
      if (notifySubscribers)
      {
         if (inTransaction === InTransaction.false || this.transactionManager == null || this.transactionManager.notInTransaction())
            this._storeSubject.next(this._dataStore);
         else
            this.transactionManager.push(this._storeSubject, this._dataStore);
      }
   }

   /**
    * Will empty the dataStore, always reset the currStoreId and optionally notify observers
    * @param notifySubscribers If false it won't notify observers; allowing a clear and load to be observed as one transaction
    * @param inTransaction If true, the clear is participating in a transaction if there is one
    */
   public reset(notifySubscribers = true, inTransaction: InTransaction = InTransaction.true)
   {
      this.clearAll(notifySubscribers, inTransaction, true);
   }

   public jsonp(url: string, callbackParam: string)
   {
      this.rest.jsonp(url, callbackParam);
   }

   public length()
   {
      return this?._dataStore?.length ?? 0;
   }

   public downloadExport(filename: string, csvData: string[])
   {
      // Trap potential errors
      if (filename == null)
         throw  Error('datastore.service.downloadExport requires a filename');

      if (csvData == null || csvData.length === 0) {
         this.logger.debug.log(this.storeName, 'csvData:', csvData);
         throw Error('exportCsv requires csvData to continue');
      }

     FileService.downloadDelimitedFile(filename, csvData);
   }

}
