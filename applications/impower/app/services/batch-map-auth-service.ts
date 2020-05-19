import { Injectable } from '@angular/core';
import { LocalAppState } from 'app/state/app.interfaces';
import { Store } from '@ngrx/store';
import { LoggingService } from 'app/val-modules/common/services/logging.service';
import { UserService } from './user.service';
import { RestDataService } from 'app/val-modules/common/services/restdata.service';
import { Observable, from, of } from 'rxjs';
import { AppConfig } from 'app/app.config';
import { CookieService } from 'ngx-cookie-service';
import { CanActivate, Router } from '@angular/router';

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
    if (this.cookieService.check('id')) {
      const jwt: string = this.cookieService.get('id');
      RestDataService.bootstrap({oauthToken: jwt, tokenExpiration: null, tokenRefreshFunction: () => {}});
      this.logger.info.log('Found JWT in cookies');
      return true;
    } else {
      this.logger.info.log('Did not find JWT in cookies');
      return false;
    }
  }

}
