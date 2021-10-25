import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { LoggingService } from 'app/val-modules/common/services/logging.service';
import { CookieService } from 'ngx-cookie-service';
import { Observable } from 'rxjs';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class BatchMapAuthService implements CanActivate {

  constructor(private logger: LoggingService,
              private userService: UserService,
              private cookieService: CookieService) {}

  public canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) : Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.checkCookies() || this.checkLocalStorage();
  }

  private checkLocalStorage() : boolean {
    this.logger.info.log('Checking for JWT in local storage');
    if (localStorage.getItem('id') != null) {
      const jwt: string = localStorage.getItem('id');
      const user = { ...this.userService.getUser() };
      user.token = `Bearer ${jwt}`;
      this.userService.setUser(user);
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
    const user = { ...this.userService.getUser() };
    if (this.cookieService.check('id')) {
      jwt = this.cookieService.get('id');
      user.token = `Bearer ${jwt}`;
    } else {
      this.logger.error.log('unable to find JWT in cookies');
    }
    if (this.cookieService.check('ACS_USERNAME')) {
      acsUsername = this.cookieService.get('ACS_USERNAME');
      user.acsUsername = acsUsername;
    } else {
      this.logger.error.log('unable to find ACS username in cookies');
    }
    if (this.cookieService.check('ACS_PASSWORD')) {
      acsPassword = this.cookieService.get('ACS_PASSWORD');
      user.acsPassword = acsPassword;
    } else {
      this.logger.error.log('unable to find ACS password in cookies');
    }
    if (jwt == null || acsUsername == null || acsPassword == null) return false;

    this.userService.setUser(user);
    return true;
  }
}
