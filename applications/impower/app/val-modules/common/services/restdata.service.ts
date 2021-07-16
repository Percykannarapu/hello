import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { decode, encode, ExtensionCodec } from '@msgpack/msgpack';
import { formatMilli, isDate, isFunction } from '@val/common';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { RestResponse, ServiceError } from '../../../../worker-shared/data-model/core.interfaces';
import { AppConfig } from '../../../app.config';
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
  private static acsUsername: string;
  private static acsPassword: string;

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
  public static bootstrap(config: OauthConfiguration, acsUsername?: string, acsPassword?: string) {
    this.configuration = config;
    this.acsUsername = acsUsername;
    this.acsPassword = acsPassword;
  }

  public static getConfig() : OauthConfiguration {
    return this.configuration;
  }

  public static getAcsUsername() : string {
    return this.acsUsername;
  }

  public static getAcsPassword() : string {
    return this.acsPassword;
  }

   // -----------------------------------------------------------------------------------
   // HTTP METHODS
   // -----------------------------------------------------------------------------------
   public get<T = any>(url: string) : Observable<RestResponse<T>>
   {
      this.logger.debug.log('RestDataService - get - returning observable for: ' + this.baseUrl + url);
      return this.http.get<RestResponse<T>>(this.baseUrl + url);
   }

   public getMessagePack<T = any>(url: string) : Observable<RestResponse<T>>
   {
      return this.http.get(this.baseUrl + url, { responseType: 'arraybuffer' }).pipe(
        map(response => [performance.now(), decode(response) as RestResponse<T>] as const),
        tap(([startTime]) => this.logger.info.log('Deserialization time: ', formatMilli(performance.now() - startTime))),
        map(([, response]) => response),
        tap(response => this.logger.debug.log('Deserialized payload', response)),
        catchError((err: HttpErrorResponse) => {
          if (err != null && err.error != null && err.error instanceof ArrayBuffer) {
            return throwError(new HttpErrorResponse({ ...err, error: decode(err.error) }));
          }
          return throwError(err);
        })
      );
   }

   public patch<T = any>(url: string, payload: any) : Observable<RestResponse<T>>
   {
      return this.http.patch<RestResponse<T>>(this.baseUrl + url, payload);
   }

   public post<T = any>(url: string, payload: any) : Observable<RestResponse<T>>
   {
      return this.http.post<RestResponse<T>>(this.baseUrl + url, payload).pipe(
        tap({ error: err => new ServiceError(err, this.baseUrl + url, payload) })
      );
   }

   public postCSV<T = any>(url: string, payload: any) : Observable<RestResponse<T>>
   {
      const csvHeaders = new HttpHeaders({'Content-Type': 'text/csv' });
      return this.http.post<RestResponse<T>>(this.baseUrl + url, payload, {headers: csvHeaders});
   }

   private packPayload(payload: any) : ArrayBuffer {
     const extensionCodec = this.getExtensionCodec();
     const preEncodeStart = performance.now();
     const packed = encode(payload, { extensionCodec, ignoreUndefined: true }).buffer;
     this.logger.debug.log('Payload encode took ', formatMilli(performance.now() - preEncodeStart));
     return packed;
   }

   public postMessagePack<T = any>(url: string, payload: any) : Observable<RestResponse<T>>
   {
     this.logger.debug.log('Preparing to POST data...');
     const pack = this.packPayload(payload);
     return this.rawPostArrayBuffer(this.baseUrl + url, pack).pipe(
       map(response => [response, performance.now()] as const),
       map(([response, startTime]) => [decode(response) as RestResponse<T>, startTime] as const),
       tap(([, startTime]) => this.logger.debug.log('Deserialization time: ', formatMilli(performance.now() - startTime))),
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
     const loggerInstance = this.logger.debug;
     let token = null;
     if (config != null && config.oauthToken != null) {
       token = config.oauthToken;
     }
     return new Observable<any>(observer => {
        try {
          this.logger.debug.log('Creating XHR');
          const req = new XMLHttpRequest();
          req.open('POST', url);
          req.responseType = 'arraybuffer';
          req.setRequestHeader('Accept', '*/*');
          req.setRequestHeader('Cache-Control', 'no-cache');
          req.setRequestHeader('Pragma', 'no-cache');
          if (token != null) {
            req.setRequestHeader('Authorization', 'Bearer ' + token);
          }
          req.onreadystatechange = function (this: XMLHttpRequest, ev: Event) {
            loggerInstance.log('Event Fired in XHR', ev);
            if (this.readyState === XMLHttpRequest.DONE) {
              const status = this.status;
              if (200 >= status && status < 400) {
                loggerInstance.log('Status Done and OK - firing observable with result', this);
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

   public put<T = any>(url: string, id: number, itemToUpdate: any) : Observable<RestResponse<T>>
   {
      return this.http.put<RestResponse<T>>(this.baseUrl + url + id, itemToUpdate);
   }

   public delete<T = any>(url: string, id: number) : Observable<RestResponse<T>>
   {
      return this.http.delete<RestResponse<T>>(this.baseUrl + url + id);
   }

   public jsonp(url: string, callbackParam: string) : Observable<any>
   {
      return this.http.jsonp<any>(url, callbackParam);
   }

  private getExtensionCodec() : ExtensionCodec {
    const FUNCTION_EXT_TYPE = 0; // Any in 0-127
    const extensionCodec: ExtensionCodec = new ExtensionCodec();
    extensionCodec.register({
      type: FUNCTION_EXT_TYPE,
      encode: (input: any) => {
        if (isFunction(input)) {
          return encode(null);
        } else if (isDate(input)) {
          return encode(input.valueOf());
        } else {
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
