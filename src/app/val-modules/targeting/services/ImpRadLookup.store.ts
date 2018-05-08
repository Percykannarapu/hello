import { RestDataService } from './../../common/services/restdata.service';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ImpRadLookup } from '../models/ImpRadLookup';

const radDataUrl = 'v1/targeting/base/impradlookup/search?q=impRadLookup';

type callbackType = (impRadLookups: ImpRadLookup[]) => boolean;
type callbackElementType = (impRadLookups: ImpRadLookup) => boolean;
type callbackMutationType = (impRadLookups: ImpRadLookup[]) => ImpRadLookup[];
type callbackSuccessType = (boolean) => boolean;

@Injectable()
export class ImpRadLookupStore
{
   private transientId: number = 0;

   // Private data store, exposed publicly as an observable
   private _dataStore = new Array<ImpRadLookup>();
   private _storeSubject = new BehaviorSubject<ImpRadLookup[]>(this._dataStore);
// private _impRadLookups = new BehaviorSubject<ImpRadLookup[]>(new Array<ImpRadLookup>()); // Alternate syntax

   public storeObservable: Observable<ImpRadLookup[]> = this._storeSubject.asObservable();

   constructor(public http: HttpClient, private rest: RestDataService) { }

   private fetch()
   {
      console.log('ImpRadLookupStore.fetch fired for ' + radDataUrl);

      this.rest.get(radDataUrl).subscribe(restResponse => {
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
         console.log ('ImpRadLookupStore.fetch - ERROR:', error);
         // TODO: Should we re-raise or throw some other event?
         return Observable.throw(error);
      });
   }

   //
   public get(forceRefresh?: boolean, preOperation?: callbackType, postOperation?: callbackMutationType)
   {
      if (preOperation)
         preOperation(this._dataStore);

      if (forceRefresh || this._dataStore.length === 0)
         this.fetch();

      if (postOperation)
         postOperation(this._dataStore);

      return this._dataStore;
   }

   public add(impRadLookups: ImpRadLookup[], preOperation?: callbackElementType, postOperation?: callbackSuccessType)
   {
      let success: boolean = true;
      let localCache: ImpRadLookup[];
      let numSuccesses: number = 0;

      if (preOperation)
      {
         // Create a copy of the current datastore
         localCache = this._dataStore.slice(0);

         // For each element in the array parameter
         for (const impRadLookup of impRadLookups)
            // Add new element to the data store if there isn't a preOperation or it returns true
            if (!preOperation || (preOperation && preOperation(impRadLookup)))
            {
               console.log('add - preOp returned true, pushing id: ' + impRadLookup.radId);
               localCache.push(impRadLookup);
               numSuccesses++;
            }
            else
            {
               // Indicate row wasn't added, but it's the applications job to maintain the list of failures
               success = false;
               console.log('add - preOp returned false, not adding id: ' + impRadLookup.radId);
            }
      }
      else
         // Add every new element to the data store, because there is no preOperation to invalidate them
         for (const impRadLookup of impRadLookups)
            this._dataStore.push(impRadLookup);

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

   public remove (impRadLookup: ImpRadLookup)
   {
      // Remove the element from the array
      const index = this._dataStore.indexOf(impRadLookup);
      this.removeAt(index);
   }

   public update (oldImpRadLookup: ImpRadLookup, newImpRadLookup: ImpRadLookup)
   {
      const index = this._dataStore.indexOf(oldImpRadLookup);
      this._dataStore = [...this._dataStore.slice(0, index),
                         newImpRadLookup,
                         ...this._dataStore.slice(index + 1)];

      // Register data store change and notify observers
      this._storeSubject.next([newImpRadLookup]);
   }

   public jsonp(url: string, callbackParam: string)
   {
      this.rest.jsonp(url, callbackParam);
   }

   /**
    * Log the store to the console.  Also an example of two ways to iterate through it
    */
   public debugLogStore(useFirstMethod: boolean = false)
   {
      console.log('--# STORE CONTENTS #----------------');
      if (useFirstMethod)
         for (const impRadLookup of this._dataStore)
            console.log(impRadLookup);
      else
         for (let i = 0; i < this._storeSubject.getValue().length; i++)
            console.log('Store[' + i + '] = ', this._storeSubject.getValue()[i]);
   }
}
