import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppConfig } from 'app/app.config';
import { LocalAppState } from 'app/state/app.interfaces';
import { LoggingService } from 'app/val-modules/common/services/logging.service';
import { RestDataService } from 'app/val-modules/common/services/restdata.service';
import { CookieService } from 'ngx-cookie-service';
import { Observable, of } from 'rxjs';
import { UserService } from './user.service';

@Injectable()
export class BatchMapAuthService implements CanActivate {

  constructor(private router: Router,
    private store$: Store<LocalAppState>,
    private logger: LoggingService,
    private userService: UserService,
    private appConfig: AppConfig,
    private cookieService: CookieService) {
  }


  canActivate() : Observable<boolean> {
    if (this.checkCookies()) {
      return of(true);
    } else if (this.checkLocalStorage()) {
      return of(true);
    } else {
      this.logger.error.log('Unable to start batch map mode, did not find token');
      return of(false);
    }
  }

  private checkLocalStorage() : boolean {
    this.logger.info.log('Checking for JWT in local storage');
    if (localStorage.getItem('id') != null) {
      const jwt: string = localStorage.getItem('id');
      RestDataService.bootstrap({oauthToken: jwt, tokenExpiration: null, tokenRefreshFunction: () => {}});
      this.logger.info.log('Found JWT in local storage');
      return true;
    } else {
      this.logger.info.log('Did not find JWT in local storage');
      return false;
    }
  }

  private checkCookies() : boolean {
    this.logger.info.log('Checking for JWT in cookies');
    let jwt: string = null;
    let acsUsername: string = null;
    let acsPassword: string =  null;
    if (this.cookieService.check('id'))
      jwt = this.cookieService.get('id');
    else
      this.logger.error.log('unable to find JWT in cookies');
    if (this.cookieService.check('ACS_USERNAME'))
      acsUsername = this.cookieService.get('ACS_USERNAME');
    else
      this.logger.error.log('unable to find ACS username in cookies');
    if (this.cookieService.check('ACS_PASSWORD'))
      acsPassword = this.cookieService.get('ACS_PASSWORD');
    else
      this.logger.error.log('unable to find ACS password in cookies');
    if (jwt == null || acsUsername == null || acsPassword == null)
      return false;
    RestDataService.bootstrap({oauthToken: jwt, tokenExpiration: null, tokenRefreshFunction: () => {}}, acsUsername, acsPassword);
    return true;

  }

}
