import { RestResponse } from './../../../Models/RestResponse';
import { RestDataService } from './../../common/services/restdata.service';
import { HttpClient, HttpHeaders, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';    // See: https://github.com/ReactiveX/rxjs
import { of } from 'rxjs/observable/of';
import { Subject } from 'rxjs/Subject';
import { Response } from '@angular/http/src/static_response';

import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';

import { ImpRadLookup } from '../models/ImpRadLookup';

const radDataUrl = 'v1/targeting/base/impradlookup/search?q=impRadLookup';

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
   public get(forceRefresh?: boolean)
   {
      if (forceRefresh || this._dataStore.length === 0)
         this.fetch();
   
      return this._dataStore;
   }

   public add(impRadLookups: ImpRadLookup[])
   {
      // For each element in the array parameter
      for (const impRadLookup of impRadLookups)
      {
         // Add new element to the data store
         this._dataStore = [...this._dataStore, impRadLookup];
      }

      // Register data store change and notify observers
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