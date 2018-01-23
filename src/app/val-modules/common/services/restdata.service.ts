import { AppConfig } from './../../../app.config';
import 'rxjs/add/operator/map';

import { HttpClient, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class RestDataService
{
   private baseUrl: string;

   constructor(private http: HttpClient, private appConfig: AppConfig)
   {
      this.baseUrl = appConfig.valServiceBase;
      console.log('RestDataService - baseUrl: ' + this.baseUrl);      
   }

   public get<T>(url: string) : Observable<T> 
   {
      console.log('RestDataService - get - returning observable for: ' + this.baseUrl + url);
      return this.http.get<T>(this.baseUrl + url);
   }

   public getById<T>(url: string, id: number) : Observable<T> {
      console.log('RestDataService - getById - returning observable for: ' + this.baseUrl + url + id);
      return this.http.get<T>(this.baseUrl + url + id);
   }

   public add<T>(url: string, itemName: string) : Observable<T>
   {
      const toAdd = JSON.stringify({ ItemName: itemName });

      return this.http.post<T>(this.baseUrl + url, toAdd);
   }

   public update<T>(url: string, id: number, itemToUpdate: any) : Observable<T>
   {
      return this.http
         .put<T>(this.baseUrl + url + id, JSON.stringify(itemToUpdate));
   }

   public delete<T>(url: string, id: number) : Observable<T>
   {
      return this.http.delete<T>(this.baseUrl + url + id);
   }
}


@Injectable()
export class RestDataInterceptor implements HttpInterceptor
{
   intercept(req: HttpRequest<any>, next: HttpHandler) : Observable<HttpEvent<any>>
   {
      if (!req.headers.has('Content-Type')) {
         req = req.clone({ headers: req.headers.set('Content-Type', 'application/json') });
      }

      req = req.clone({ headers: req.headers.set('Accept', 'application/json') });
      console.log(JSON.stringify(req.headers));
      return next.handle(req);
   }
}