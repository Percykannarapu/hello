import { RestDataService } from './../../common/services/restdata.service';
import { HttpClient, HttpHeaders, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';    // See: https://github.com/ReactiveX/rxjs
import { of } from 'rxjs/observable/of';
import { Subject } from 'rxjs/Subject';
import { Response } from '@angular/http/src/static_response';
// import {List} from 'immutable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';

import { ImpRadLookup } from '../models/ImpRadLookup';

//const radDataUrl = 'https://servicesdev.valassislab.com/services/v1/targeting/base/impradlookup/search?q=impRadLookup';
const radDataUrl = 'v1/targeting/base/impradlookup/search?q=impRadLookup';

@Injectable()
export class ImpRadLookupService 
{
   private transientId: number = 0;
   private subject: Subject<ImpRadLookup> = new Subject<ImpRadLookup>();
   public  impRadLookups: Array<ImpRadLookup> = new Array<ImpRadLookup>();

  // private _impRadLookups: BehaviorSubject<Array<ImpRadLookup>> = new BehaviorSubject(new Array<ImpRadLookup>());

   constructor(public http: HttpClient, private restDataService: RestDataService) { }  

   cl (p_msg: string) {
      console.log(p_msg);
   }

   fetchData() : Observable<ImpRadLookup[]>
   {
      console.log('loadInitialData fired');

      const simpleObservable = new Observable<ImpRadLookup[]>((observer) => {
      this.http.get('https://servicesdev.valassislab.com/services/' + radDataUrl) //  + '&product=' + product)
               .subscribe((data: {payload: {rows: ImpRadLookup[]}}) => {
                  console.log(data);
                  this.impRadLookups = data.payload.rows;
                  console.log('fetchData - impRadLookups.length = ' + this.impRadLookups.length);
                  for (let i = 0; i < this.impRadLookups.length; i++)
                     console.log('impRadLookups[' + i + '] = ' + this.impRadLookups[i].category);
                  observer.next(this.impRadLookups);
               });
      });
      return simpleObservable;
/*      this.restDataService.get<ImpRadLookup[]>(radDataUrl).subscribe((data: ImpRadLookup[]) => {
         console.log('---------------------------------------------');
         console.log('fetchData - assigning impRadLookups to result');
         console.log('---------------------------------------------');
         this.impRadLookups = data;
      },
      error => () => {
         console.error('An error occurred', error);
      },
      () => {
         console.log('loadInitialdata : impRadLookupService success - retrieved ' + this.impRadLookups.length + ' rows');
         // this.subject.next();
      });*/

      // this.todoBackendService.getAllTodos()
/*      this.restDataService
         .get<ImpRadLookup[]>(radDataUrl)
         .subscribe((data: ImpRadLookup[]) => {
            this.impRadLookups = data;
            console.log ('Assigned data: ' + this.impRadLookups.length + ' rows for ' + data.length + ' data rows');
         },            
         error => () => {
            console.error('An error occurred', error);
         },
         () => {
            console.log('loadInitialdata : impRadLookupService success - retrieved ' + this.impRadLookups.length + ' rows');
            this.subject.next();
         });*/
   }

   public  getNewId() : number
   {
      return this.transientId++;
   }

   public add(impRadLookups: ImpRadLookup[])
   {
      // For each impRadLookup provided in the parameter
      for (const impRadLookup of impRadLookups)
      {
         // Assign a temporary id if needed
         if (impRadLookup.radId == null)
            impRadLookup.radId = this.getNewId();

         // Add the impRadLookup to the array
         this.impRadLookups = [...this.impRadLookups, impRadLookup];

         // Notifiy Observers
         this.subject.next(impRadLookup);
      }

      // Debug log arrays to the console
      this.debugLogArrays();
   }

   public remove (impRadLookup: ImpRadLookup)
   {
      // Remove the impRadLookup from the array
      const index = this.impRadLookups.indexOf(impRadLookup);
      this.impRadLookups = [...this.impRadLookups.slice(0, index),
                            ...this.impRadLookups.slice(index + 1)];

      // Notifiy Observers
      this.subject.next(impRadLookup);
   }
    
   public update (oldImpRadLookup: ImpRadLookup, newImpRadLookup: ImpRadLookup)
   {
      const index = this.impRadLookups.indexOf(oldImpRadLookup);
      this.impRadLookups = [...this.impRadLookups.slice(0, index),
                            newImpRadLookup,
                            ...this.impRadLookups.slice(index + 1)];

      // Notifiy Observers
      this.subject.next(newImpRadLookup);
   }

   /// HTTP verbs
   public get<T>() : Observable<T> {
      return this.restDataService.get<T>(radDataUrl);
      //return this.http.get<T>(radDataUrl);  // TODO When this becomes its own injectible service, track the url there
   }   

   public debugLogArrays()
   {
      this.cl('--# impRadLookups');
      for (const impRadLookup of this.impRadLookups)
         this.cl('  ' + impRadLookup);
   }

   private handleError(error: Response)
   {
      const errorMsg = `Status code: ${error.status} on url ${error.url}`;
      console.error(errorMsg);
      return Observable.throw(errorMsg);
   }   

}