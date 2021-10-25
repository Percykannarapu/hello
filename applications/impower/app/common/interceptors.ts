import { HTTP_INTERCEPTORS, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { isEmpty } from '@val/common';
import { Observable } from 'rxjs';
import { AppConfig } from '../app.config';
import { UserService } from '../services/user.service';

@Injectable()
export class ContentInterceptor implements HttpInterceptor {

  constructor(private appConfig: AppConfig) { }

  public intercept(req: HttpRequest<any>, next: HttpHandler) : Observable<HttpEvent<any>> {
    let clone: HttpRequest<any> = req.clone();
    if ((clone.url.includes(this.appConfig.valServiceBase) || (clone.url.includes(this.appConfig.printServiceUrl)) && clone.responseType === 'json')) {
      clone = clone.clone({ headers: clone.headers.set('Accept', 'application/json') });
      // if there is already a Content-Type header we don't want to override it
      if (!(clone.headers.get('Content-Type') || clone.headers.get('content-type'))) {
        clone = clone.clone({headers: clone.headers.set('Content-Type', 'application/json')});
      }
    }
    if ( (clone.url.includes(this.appConfig.printServiceUrl)) && clone.responseType === 'blob') {
        clone = clone.clone({ headers: clone.headers.set('Accept', 'application/pdf') });

        if (!(clone.headers.get('Content-Type') || clone.headers.get('content-type'))) {
          clone = clone.clone({headers: clone.headers.set('Content-Type', 'application/json')});
        }
    }
    if ( clone.url.includes(this.appConfig.valServiceBase) && clone.responseType === 'blob') {
      clone = clone.clone({ headers: clone.headers.set('Accept', 'application/octet-stream') });

      if (!(clone.headers.get('Content-Type') || clone.headers.get('content-type'))) {
        clone = clone.clone({headers: clone.headers.set('Content-Type', 'application/json')});
      }
  }
    return next.handle(clone);
  }
}

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private appConfig: AppConfig,
              private userService: UserService) { }

  public intercept(req: HttpRequest<any>, next: HttpHandler) : Observable<HttpEvent<any>> {
    let clone: HttpRequest<any> = req.clone();
    if (clone.url.includes(this.appConfig.valServiceBase) || clone.url.includes(this.appConfig.printServiceUrl)) {
      const user = this.userService.getUser();
      if (user?.token != null) {
        clone = clone.clone({
          headers: clone.headers.set('Authorization', user.token)
        });
      }
      if (!isEmpty(user?.acsUsername)) {
        clone = clone.clone({
          headers: clone.headers.set('ACS_USERNAME', user.acsUsername)
        });
      }
      if (!isEmpty(user?.acsPassword)) {
        clone = clone.clone({
          headers: clone.headers.set('ACS_PASSWORD', user.acsPassword)
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
