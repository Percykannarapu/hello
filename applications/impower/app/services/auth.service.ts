import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppConfig } from 'app/app.config';
import { User } from 'app/models/User';
import { UserRole } from 'app/models/UserRole';
import { LocalAppState } from 'app/state/app.interfaces';
import { CreateApplicationUsageMetric } from 'app/state/usage/targeting-usage.actions';
import { LoggingService } from 'app/val-modules/common/services/logging.service';
import { OauthConfiguration, RestDataService } from 'app/val-modules/common/services/restdata.service';
import { CookieService } from 'ngx-cookie-service';

import { User as OIDCUser, UserManager, UserManagerSettings } from 'oidc-client';
import { from, Observable, of } from 'rxjs';
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
    private cookieService: CookieService,
    private appConfig: AppConfig) {
    this.manager.getUser().then(oidcUser => {
      this.oidcUser = oidcUser;
    });
    this.manager.events.addAccessTokenExpiring(e => this.logger.debug.log('JWT is expiring soon'));
    this.manager.events.addAccessTokenExpired(e => 'JWT has expired');
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
        this.manager.startSilentRenew();
        return this.setupAppUser(this.oidcUser).pipe(
          tap(appUser => {
            appUser.username = this.oidcUser.profile['custom_fields'].spokesamaccountname;
            appUser.userRoles = this.getRolesFromOIDC(this.oidcUser);
            appUser.email = this.oidcUser.profile.email;
            this.userService.setUser(appUser);
          }),
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
          appUser.username = oidcUser.profile['custom_fields'].spokesamaccountname;
          appUser.displayName = oidcUser.profile['custom_fields'].name;
          appUser.userRoles = this.getRolesFromOIDC(oidcUser);
          appUser.email = oidcUser.profile.email;
          this.userService.setUser(appUser);
          this.store$.dispatch(new CreateApplicationUsageMetric('entry', 'login', appUser.username + '~' + appUser.userId));
        })
      ))
    );
  }

  private getRolesFromOIDC(oidcUser: OIDCUser) : Array<UserRole> {
    const userRoles: Array<UserRole> = [];
    const rolesArray: Array<string> = oidcUser.profile['groups'];
    rolesArray.forEach(r => {
      const role: UserRole = new UserRole;
      role.roleName = r;
      userRoles.push(role);
    });
    return userRoles;
  }

  private setupAppUser(oidcUser: OIDCUser) : Observable<User>{
    if (oidcUser == null) {
      return;
    }
    return this.userService.fetchUserRecord(oidcUser.profile['custom_fields'].spokesamaccountname);
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
      authority: 'https://openid-connect.onelogin.com/oidc',
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
