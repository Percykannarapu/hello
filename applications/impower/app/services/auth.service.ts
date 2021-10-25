import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Store } from '@ngrx/store';
import { isArray, isNil } from '@val/common';
import { User } from 'app/common/models/User';
import { LocalAppState } from 'app/state/app.interfaces';
import { CreateApplicationUsageMetric } from 'app/state/usage/targeting-usage.actions';
import { LoggingService } from 'app/val-modules/common/services/logging.service';
import { CookieService } from 'ngx-cookie-service';

import { User as OIDCUser, UserManager, UserManagerSettings } from 'oidc-client';
import { from, Observable, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class AuthService implements CanActivate{

  private manager: UserManager = new UserManager(this.getClientSettings());
  private oidcUser: OIDCUser = null;

  constructor(private router: Router,
              private store$: Store<LocalAppState>,
              private logger: LoggingService,
              private userService: UserService,
              private cookieService: CookieService) {
    this.manager.getUser().then(oidcUser => {
      this.oidcUser = oidcUser;
    });
    this.manager.events.addAccessTokenExpiring(() => this.logger.debug.log('JWT is expiring soon'));
    this.manager.events.addAccessTokenExpired(() => this.logger.error.log('JWT has expired'));
    this.manager.events.addSilentRenewError(e => this.logger.error.log('Failed to renew JWT', e));
  }

  public canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) : Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (!this.isLoggedIn()) {
      return this.startAuthentication();
    } else {
      if (this.oidcUser.expired === true) {
        return this.startAuthentication();
      }
      if (this.userService.getUser() == null) {
        return this.setupAppUser(this.oidcUser).pipe(
          tap(() => this.manager.startSilentRenew()),
          map(() => true)
        );
      }
      return true;
    }
  }

  isLoggedIn() : boolean {
    return this.oidcUser != null && !this.oidcUser.expired;
  }

  getClaims() : any {
    return this.oidcUser.profile;
  }

  startAuthentication() : Promise<boolean> {
    return this.manager.signinRedirect().then(() => false);
  }

  completeAuthentication() : Observable<User> {
    const callBack$ = from(this.manager.signinRedirectCallback());
    return callBack$.pipe(
      tap(oidcUser => localStorage.setItem('id', oidcUser.id_token)),
      tap(oidcUser => this.cookieService.set('id', oidcUser.id_token)),
      tap(oidcUser => this.oidcUser = oidcUser),
      switchMap(oidcUser => this.setupAppUser(oidcUser).pipe(
        tap(appUser => {
          this.manager.startSilentRenew();
          this.store$.dispatch(new CreateApplicationUsageMetric('entry', 'login', appUser.username + '~' + appUser.userId));
        })
      ))
    );
  }

  private setupAppUser(oidcUser: OIDCUser) : Observable<User>{
    if (isNil(oidcUser)) {
      return throwError('OIDC User cannot be null');
    }
    this.logger.debug.log('App User retrieved from onelogin', oidcUser);
    const valUserName = isArray(oidcUser.profile.params) ? oidcUser.profile.params[0].sAmAccountName : oidcUser.profile.params.sAmAccountName;
    const fullToken = `${oidcUser.token_type} ${oidcUser.id_token}`;
    return this.userService.fetchUserRecord(valUserName, fullToken).pipe(
      tap(appUser => {
        appUser.username = valUserName;
        appUser.displayName = oidcUser.profile.name;
        appUser.email = oidcUser.profile.email;
        appUser.token = fullToken;
        this.userService.setUser(appUser);
      })
    );
  }

  getClientSettings() : UserManagerSettings {
    return {
      authority: 'https://vericast.onelogin.com/oidc/2',
      client_id: '2e344cc0-6c5f-0138-38d5-06052b831332154450',
      redirect_uri: `${window.location.origin}/auth-callback`,
      post_logout_redirect_uri: `${window.location.origin}`,
      response_type: 'id_token token',
      scope: 'openid profile name groups email params phone',
      filterProtocolClaims: true,
      loadUserInfo: true,
      automaticSilentRenew: true,
      silent_redirect_uri: `${window.location.origin}/silent-refresh.html`,
      includeIdTokenInSilentRenew: false,
      silentRequestTimeout: 30000
    };
  }
}
