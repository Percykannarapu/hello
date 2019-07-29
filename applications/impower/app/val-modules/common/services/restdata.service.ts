import { RestResponse } from '../../../models/RestResponse';
import { AppConfig } from '../../../app.config';
import { HttpClient, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, concat } from 'rxjs';

/**
 * Data store configuration, holds the oauth token for communicating with Fuse
 */
export class OauthConfiguration {
  public oauthToken: string;
  public tokenExpiration: number;
  public tokenRefreshFunction: Function;
}

@Injectable()
export class RestDataService
{
  private static configuration: OauthConfiguration;

  public baseUrl: string;

   constructor(private http: HttpClient, private appConfig: AppConfig) {
      // Assign the base url from configuration
      this.baseUrl = appConfig.valServiceBase;
      console.log('RestDataService - baseUrl: ' + this.baseUrl);
   }

  /**
   * Bootstrap the data store, right now the only thing we bootstrap with is the oauth token
   */
  public static bootstrap(config: OauthConfiguration) {
    this.configuration = config;
  }

  public static getConfig() : OauthConfiguration {
    return this.configuration;
  }

  // -----------------------------------------------------------------------------------
   // HTTP METHODS
   // -----------------------------------------------------------------------------------
   public get(url: string) : Observable<RestResponse>
   {
      console.log('RestDataService - get - returning observable for: ' + this.baseUrl + url);
      //const headers = new HttpHeaders().set('Authorization', 'Bearer ' + DataStore.getConfig().oauthToken);
      return this.http.get<RestResponse>(this.baseUrl + url);
   }

   public patch(url: string, payload: any) : Observable<RestResponse>
   {
      return this.http.patch<RestResponse>(this.baseUrl + url, payload);
   }

   public post(url: string, payload: any) : Observable<RestResponse>
   {
      //const headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', 'Bearer ' + DataStore.getConfig().oauthToken);
      return this.http.post<RestResponse>(this.baseUrl + url, payload);
   }
   public postCSV(url: string, payload: any) : Observable<RestResponse>
   {
      const csvHeaders = new HttpHeaders({'Content-Type': 'text/csv' });
      return this.http.post<RestResponse>(this.baseUrl + url, payload, {headers: csvHeaders});
   }

   public put(url: string, id: number, itemToUpdate: any) : Observable<RestResponse>
   {
      return this.http.put<RestResponse>(this.baseUrl + url + id, itemToUpdate);
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
   constructor(private appConfig: AppConfig) {}

   /**
    * Intercept all HTTP calls being made from the imPower application, if the request is going
    * to a Fuse service we need to append the OAuth token in an Authorization header
    * @param req
    * @param next
    */
   intercept(req: HttpRequest<any>, next: HttpHandler) : Observable<HttpEvent<any>>
   {
      let internalRequest: HttpRequest<any> = req.clone();
      let refresh: any;
      if (req.url.includes(this.appConfig.valServiceBase)) {
        // if there is already a Content-Type header we don't want to override it
        if (req.headers.get('Content-Type') || req.headers.get('content-type')) {
          internalRequest = req.clone({ headers: req.headers.set('Accept', 'application/json') });
        } else {
          internalRequest = req.clone({
            headers: req.headers.set('Accept', 'application/json')
                                .set('Content-Type', 'application/json')
          });
        }

        const tokenConfig = RestDataService.getConfig();
        if (tokenConfig != null && tokenConfig.oauthToken != null) {
          internalRequest = internalRequest.clone({
            headers: internalRequest.headers.set('Authorization', 'Bearer ' + tokenConfig.oauthToken)
          });
          // check to see if the current oauth token is expired
          refresh = this.refreshOauthToken();
        }
      }
      if (refresh != null && refresh instanceof Observable) {
         return concat(refresh, next.handle(internalRequest));
      } else {
         return next.handle(internalRequest);
      }
   }

   /**
    * Refresh the OAuth token if it has expired
    * @returns An Observable<boolean> if the token needs to be refreshed, false if it does not need to be refreshed
    */
    private refreshOauthToken() : Observable<boolean> | false {
      const tokenExpirationDate = new Date(RestDataService.getConfig().tokenExpiration);
      const now = new Date(Date.now());
      const refreshTokenSubject: Subject<boolean> = new Subject<boolean>();
      if (tokenExpirationDate <= now) {
        const refreshToken$: Observable<boolean> = <Observable<boolean>> RestDataService.getConfig().tokenRefreshFunction();
        refreshToken$.subscribe(res => {
          if (res) {
            refreshTokenSubject.next(true);
          } else {
            refreshTokenSubject.next(false);
          }
        }, err => {
          console.error('Error refreshing oauth token in http interceptor: ', err);
          refreshTokenSubject.next(false);
        });
        return refreshTokenSubject;
      }
      return false;
    }
}
