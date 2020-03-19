import { HttpClient, HttpErrorResponse, HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { decode, encode, ExtensionCodec } from '@msgpack/msgpack';
import { formatMilli } from '@val/common';
import { concat, Observable, Subject, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AppConfig } from '../../../app.config';
import { RestResponse } from '../../../models/RestResponse';
import { LoggingService } from './logging.service';

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

   constructor(private http: HttpClient,
               private appConfig: AppConfig,
               private logger: LoggingService) {
      // Assign the base url from configuration
      this.baseUrl = appConfig.valServiceBase;
      this.logger.debug.log('RestDataService - baseUrl: ' + this.baseUrl);
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
      this.logger.debug.log('RestDataService - get - returning observable for: ' + this.baseUrl + url);
      return this.http.get<RestResponse>(this.baseUrl + url);
   }

   public getMessagePack(url: string) : Observable<RestResponse>
   {
      return this.http.get(this.baseUrl + url, { responseType: 'arraybuffer' }).pipe(
        map(response => [performance.now(), decode(response) as RestResponse] as const),
        tap(([startTime]) => this.logger.info.log('Deserialization time: ', formatMilli(performance.now() - startTime))),
        map(([, response]) => response),
        catchError((err: HttpErrorResponse) => {
          if (err != null && err.error != null && err.error instanceof ArrayBuffer) {
            return throwError(new HttpErrorResponse({ ...err, error: decode(err.error) }));
          }
          return throwError(err);
        })
      );
   }

   public patch(url: string, payload: any) : Observable<RestResponse>
   {
      return this.http.patch<RestResponse>(this.baseUrl + url, payload);
   }

   public post(url: string, payload: any) : Observable<RestResponse>
   {
      return this.http.post<RestResponse>(this.baseUrl + url, payload);
   }

   public postCSV(url: string, payload: any) : Observable<RestResponse>
   {
      const csvHeaders = new HttpHeaders({'Content-Type': 'text/csv' });
      return this.http.post<RestResponse>(this.baseUrl + url, payload, {headers: csvHeaders});
   }

   public packPayload(payload: any) : ArrayBuffer {
     const extensionCodec = this.getExtensionCodec();
     const preEncodeStart = performance.now();
     const packed = encode(payload, { extensionCodec, ignoreUndefined: true }).buffer;
     this.logger.info.log('Payload encode took ', formatMilli(performance.now() - preEncodeStart));
     this.logger.info.log('Payload size (in bytes)', packed.byteLength);
     return packed;
   }

   public unpackPayload(packedPayload: ArrayBuffer) : any {
     return decode(packedPayload);
   }

   public postMessagePack(url: string, payload: ArrayBuffer) : Observable<RestResponse>
   {
     this.logger.info.log('Preparing to POST data...');
     return this.rawPostArrayBuffer(this.baseUrl + url, payload).pipe(
       map(response => [response, performance.now()] as const),
       map(([response, startTime]) => [decode(response) as RestResponse, startTime] as const),
       tap(([, startTime]) => this.logger.info.log('Deserialization time: ', formatMilli(performance.now() - startTime))),
       map(([response]) => response),
       catchError((err: HttpErrorResponse) => {
         if (err != null && err.error != null && err.error instanceof ArrayBuffer) {
           return throwError(new HttpErrorResponse({ ...err, error: decode(err.error) }));
         }
         return throwError(err);
       })
     );
   }

   private rawPostArrayBuffer(url: string, body: ArrayBuffer) : Observable<ArrayBuffer> {
     const config = RestDataService.configuration;
     const loggerInstance = this.logger.info;
     let token = null;
     if (config != null && config.oauthToken != null) {
       token = config.oauthToken;
     }
     return new Observable<any>(observer => {
        try {
          this.logger.info.log('Creating XHR');
          const req = new XMLHttpRequest();
          this.logger.info.log('Opening URL', url);
          req.open('POST', url);
          this.logger.info.log('Setting response type');
          req.responseType = 'arraybuffer';
          this.logger.info.log('Setting Accept header');
          req.setRequestHeader('Accept', '*/*');
          if (token != null) {
            this.logger.info.log('Setting Auth header');
            req.setRequestHeader('Authorization', 'Bearer ' + token);
          }
          this.logger.info.log('Setting callback');
          req.onreadystatechange = function (this: XMLHttpRequest, ev: Event) {
            loggerInstance.log('Event Fired in XHR', ev);
            if (this.readyState === XMLHttpRequest.DONE) {
              const status = this.status;
              if (200 >= status && status < 400) {
                loggerInstance.log('Status Done and OK - firing observable with result');
                observer.next(this.response);
                observer.complete();
              } else {
                const error = decode(this.response);
                loggerInstance.log('Status Done and Not OK - firing observable with error', this, error);
                observer.error(new HttpErrorResponse({
                  // The error in this case is the response body (error from the server).
                  error,
                  headers: new HttpHeaders(this.getAllResponseHeaders()),
                  status,
                  statusText: this.statusText,
                  url: url || undefined,
                }));
              }
            }
          };
          this.logger.info.log('Sending Data (size in bytes)', body.byteLength.toLocaleString());
          req.send(new Blob([body]));
        } catch (ex) {
          this.logger.error.log('Error Caught during creation of XHR', ex);
          observer.error(new HttpErrorResponse({
            error: ex,
            url: url || undefined,
          }));
        }
      });
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

  private getExtensionCodec() : ExtensionCodec {
    const FUNCTION_EXT_TYPE = 0; // Any in 0-127
    const extensionCodec: ExtensionCodec = new ExtensionCodec();
    extensionCodec.register({
      type: FUNCTION_EXT_TYPE,
      encode: (input: any) => {
        if (typeof input === 'function') {
          return encode(null);
        } else if (input instanceof Date) {
          return encode(input.valueOf());
        } else {
          //return encode(input);
          return null;
        }
      },
      decode: (data, extType, context) => {
        return decode(data);
      },
    });
    return extensionCodec;
  }
}

@Injectable()
export class RestDataInterceptor implements HttpInterceptor
{
   constructor(private appConfig: AppConfig, private logger: LoggingService) {}

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
        if (req.responseType === 'json') {
          // if there is already a Content-Type header we don't want to override it
          if (req.headers.get('Content-Type') || req.headers.get('content-type')) {
            internalRequest = req.clone({ headers: req.headers.set('Accept', 'application/json') });
          } else {
            internalRequest = req.clone({
              headers: req.headers.set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
            });
          }
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
          this.logger.error.log('Error refreshing oauth token in http interceptor: ', err);
          refreshTokenSubject.next(false);
        });
        return refreshTokenSubject;
      }
      return false;
    }
}
