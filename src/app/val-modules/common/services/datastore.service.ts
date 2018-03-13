import { RestResponse } from './../../../models/RestResponse';
import { RestDataService } from './../../common/services/restdata.service';
import { HttpClient} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { Subject } from 'rxjs/Subject';

// ---------------------------------------------
// Callback method signatures
// ---------------------------------------------
type callbackType<T> = (dataArray: T[]) => boolean;      // Callback takes in an array of data and returns a boolean
type callbackElementType<T> = (data: T) => boolean;      // Callback takes in an instance of data and returns a boolean
type callbackMutationType<T> = (dataArray: T[]) => T[];  // Callback takes in an array of data and returns an array of data
type callbackSuccessType<T> = (boolean) => boolean;      // Callback takes in a boolean and returns a boolean

export class DataStore<T>
{
   private transientId: number = 0;

   // Private data store, exposed publicly as an observable
   private _dataStore = new Array<T>();
   private _storeSubject = new BehaviorSubject<T[]>(this._dataStore);

   // Public access to the data store is through this observable
   public storeObservable: Observable<T[]> = this._storeSubject.asObservable();

   constructor(private rest: RestDataService, public dataUrl: string) { }

   // ---------------------------------------------
   // Utility / Non-Essential Methods
   // ---------------------------------------------

   /**
    * Log the store to the console.  Also an example of two ways to iterate through it
    */
    public debugLogStore(useFirstMethod: boolean = false)
    {
       console.log('--# STORE CONTENTS #----------------');
       if (useFirstMethod)
          for (const data of this._dataStore)
             console.log(data);
       else
          for (let i = 0; i < this._storeSubject.getValue().length; i++)
             console.log('Store[' + i + '] = ', this._storeSubject.getValue()[i]);
    }

   // ---------------------------------------------
   // Private Data Store Methods
   // ---------------------------------------------

   /**
    * Private method accessed publicly through get, which will fetch
    * data into the store from this.dataUrl.
    */
   private fetch()
   {
      console.log('DataStore.fetch fired for ' + this.dataUrl);

      this.rest.get(this.dataUrl).subscribe(restResponse => {
         // Log and test the response
         console.log('fetch - returnCode: ' + restResponse.returnCode);
         console.log(restResponse);

         // Populate data store and notify observers
         this._dataStore = restResponse.payload.rows;
         this._storeSubject.next(this._dataStore);

         // Debug log the data store
         console.log('fetched ' + this._storeSubject.getValue().length + ' rows.');
         this.debugLogStore();
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
   public get(forceRefresh?: boolean, preOperation?: callbackType<T>, postOperation?: callbackMutationType<T>) : T[]
   {
//    console.log('DataStore.get fired');
      if (preOperation)
         preOperation(this._dataStore);

      if (forceRefresh || this._dataStore.length === 0)
         this.fetch();

      if (postOperation)
         postOperation(this._dataStore);

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
   public add(dataArray: T[], preOperation?: callbackElementType<T>, postOperation?: callbackSuccessType<T>)
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
         this._storeSubject.next(this._dataStore);
   }

   public removeAt (index: number)
   {
      console.log('delete at index: ' + index);

      if (this._dataStore.length === 0)
         return;

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
      this._storeSubject.next(this._dataStore);
   }

   public remove (data: T)
   {
      // Remove the element from the array
      const index = this._dataStore.indexOf(data);
      this.removeAt(index);
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
   public find(search: any)
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

   public getListBy (props, searchValue) : T[]
   {
      const results: T[] = [];

      if (this._dataStore != null)
         for (const geo of this._dataStore)
         {
            const site: T = this.deepFind (geo, props, null);
            if (site === searchValue)
               results.push(site);
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

   public update (oldData: T, newData: T)
   {
     if (oldData != null && newData != null && oldData !== newData) {
       const index = this._dataStore.indexOf(oldData);
       this._dataStore = [...this._dataStore.slice(0, index),
         newData,
         ...this._dataStore.slice(index + 1)];
     }

      // Register data store change and notify observers
      this._storeSubject.next(this._dataStore);
   }

   public updateAt (newData: T, index: number = 0)
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
      this._storeSubject.next(this._dataStore);
   }

   public clearAll()
   {
      this._dataStore.length = 0;       // Recommended way, but UI doesn't recognize the change
      this._dataStore = new Array<T>(); // This definitely updates the UI

      this._storeSubject.next(this._dataStore);
   }

   public jsonp(url: string, callbackParam: string)
   {
      this.rest.jsonp(url, callbackParam);
   }

   public length()
   {
      return (this._dataStore != null) ? this._dataStore.length : 0;
   }
}
