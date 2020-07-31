import { HTTP_INTERCEPTORS, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConfig } from '../app.config';
import { RestDataService } from '../val-modules/common/services/restdata.service';

@Injectable()
export class ContentInterceptor implements HttpInterceptor {

  constructor(private appConfig: AppConfig) { }

  public intercept(req: HttpRequest<any>, next: HttpHandler) : Observable<HttpEvent<any>> {
    let clone: HttpRequest<any> = req.clone();
    if ((clone.url.includes(this.appConfig.valServiceBase) || clone.url.includes(this.appConfig.printServiceUrl)) && clone.responseType === 'json') {
      clone = clone.clone({ headers: clone.headers.set('Accept', 'application/json') });
      // if there is already a Content-Type header we don't want to override it
      if (!(clone.headers.get('Content-Type') || clone.headers.get('content-type'))) {
        clone = clone.clone({headers: clone.headers.set('Content-Type', 'application/json')});
      }
    }
    return next.handle(clone);
  }
}

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private appConfig: AppConfig) { }

  public intercept(req: HttpRequest<any>, next: HttpHandler) : Observable<HttpEvent<any>> {
    let clone: HttpRequest<any> = req.clone();
    if (clone.url.includes(this.appConfig.valServiceBase) || clone.url.includes(this.appConfig.printServiceUrl)) {
      const tokenConfig = RestDataService.getConfig();
      if (tokenConfig != null && tokenConfig.oauthToken != null) {
        clone = clone.clone({
          headers: clone.headers.set('Authorization', 'Bearer ' + tokenConfig.oauthToken)
        });
      }
    }
    return next.handle(clone);
  }
}

@Injectable()
export class CacheInterceptor implements HttpInterceptor {

  constructor(private appConfig: AppConfig) { }

  public intercept(req: HttpRequest<any>, next: HttpHandler) : Observable<HttpEvent<any>> {
    let clone: HttpRequest<any> = req.clone();
    if (clone.url.includes(this.appConfig.valServiceBase)) {
      clone = clone.clone({
        headers: clone.headers.set('Cache-Control', 'no-cache')
                              .set('Pragma', 'no-cache')
      });
    }
    return next.handle(clone);
  }
}

export const allInterceptorProviders = [
  { provide: HTTP_INTERCEPTORS, useClass: ContentInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: CacheInterceptor, multi: true },
];
