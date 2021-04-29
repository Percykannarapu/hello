import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { isArray, isNil } from '@val/common';
import { User } from 'app/models/User';
import { LocalAppState } from 'app/state/app.interfaces';
import { CreateApplicationUsageMetric } from 'app/state/usage/targeting-usage.actions';
import { LoggingService } from 'app/val-modules/common/services/logging.service';
import { OauthConfiguration, RestDataService } from 'app/val-modules/common/services/restdata.service';
import { CookieService } from 'ngx-cookie-service';

import { User as OIDCUser, UserManager, UserManagerSettings } from 'oidc-client';
import { from, Observable, of, throwError } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { UserService } from './user.service';

@Injectable()
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
    this.manager.events.addAccessTokenExpiring(e => this.logger.debug.log('JWT is expiring soon'));
    this.manager.events.addAccessTokenExpired(e => this.logger.error.log('JWT has expired'));
    this.manager.events.addSilentRenewError(e => this.logger.error.log('Failed to renew JWT', e));
    this.manager.events.addUserLoaded(oidcUser => {
      RestDataService.bootstrap(this.getRestConfig(oidcUser));
    });
  }

  canActivate() : Observable<boolean> {
    if (!this.isLoggedIn()) {
      this.startAuthentication();
      return of(false);
    } else {
      if (this.oidcUser.expired === true) {
        this.startAuthentication();
        return of(false);
      }
      if (this.userService.getUser() == null) {
        RestDataService.bootstrap(this.getRestConfig(this.oidcUser));
        return this.setupAppUser(this.oidcUser).pipe(
          tap(() => this.manager.startSilentRenew()),
          switchMap(() => of(true))
        );
      }
      return of(true);
    }
  }

  isLoggedIn() : boolean {
    return this.oidcUser != null && !this.oidcUser.expired;
  }

  getClaims() : any {
    return this.oidcUser.profile;
  }

  getAuthorizationHeaderValue() : string {
    return `${this.oidcUser.token_type} ${this.oidcUser.id_token}`;
  }

  startAuthentication() : Promise<void> {
    return this.manager.signinRedirect();
  }

  completeAuthentication() : Observable<User> {
    const callBack$ = from(this.manager.signinRedirectCallback());
    return callBack$.pipe(
      tap(oidcUser => localStorage.setItem('id', oidcUser.id_token)),
      tap(oidcUser => this.cookieService.set('id', oidcUser.id_token)),
      tap(oidcUser => RestDataService.bootstrap(this.getRestConfig(oidcUser))),
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
    return this.userService.fetchUserRecord(valUserName).pipe(
      tap(appUser => {
        appUser.username = valUserName;
        appUser.displayName = oidcUser.profile.name;
        appUser.email = oidcUser.profile.email;
        this.userService.setUser(appUser);
      })
    );
  }

  private getRestConfig(oidcUser: OIDCUser) : OauthConfiguration {
    const config: OauthConfiguration = new OauthConfiguration();
    config.oauthToken = oidcUser.id_token;
    config.tokenExpiration = null;
    config.tokenRefreshFunction = () => { };
    return config;
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
