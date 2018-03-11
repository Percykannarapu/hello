import { RestResponse } from './../../../models/RestResponse';
import { AppConfig } from './../../../app.config';
import 'rxjs/add/operator/map';

import { HttpClient, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { DataStore } from './datastore.service';

@Injectable()
export class RestDataService
{
   private baseUrl: string;

   constructor(private http: HttpClient, private appConfig: AppConfig) {
      // Assign the base url from configuration
      this.baseUrl = appConfig.valServiceBase;
      console.log('RestDataService - baseUrl: ' + this.baseUrl);      
   }

   // -----------------------------------------------------------------------------------
   // HTTP METHODS
   // -----------------------------------------------------------------------------------
   public get(url: string) : Observable<RestResponse> 
   {
      console.log('RestDataService - get - returning observable for: ' + this.baseUrl + url);
      return this.http.get<RestResponse>(this.baseUrl + url);
   }

   public patch(url: string, payload: any) : Observable<RestResponse>
   {
      return this.http.patch<RestResponse>(this.baseUrl + url, JSON.stringify(payload));
   }
   
   public post(url: string, payload: any) : Observable<RestResponse>
   {
      return this.http.post<RestResponse>(this.baseUrl + url, JSON.stringify(payload));
   }

   public put(url: string, id: number, itemToUpdate: any) : Observable<RestResponse>
   {
      return this.http.put<RestResponse>(this.baseUrl + url + id, JSON.stringify(itemToUpdate));
   }

   public delete(url: string, id: number) : Observable<RestResponse>
   {
      return this.http.delete<RestResponse>(this.baseUrl + url + id);
   }

   public jsonp(url: string, callbackParam: string) : Observable<any>
   {
      return this.http.jsonp(url, callbackParam);
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

      req = req.clone({ headers: req.headers.set('Accept', 'application/json').set('Authorization: Bearer', DataStore.getConfig().oauthToken) });
      console.log(JSON.stringify(req.headers));
      return next.handle(req);
   }
}