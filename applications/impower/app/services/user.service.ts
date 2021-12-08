import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { RestResponse } from '../../worker-shared/data-model/core.interfaces';
import { AppConfig } from '../app.config';
import { User, UserResponse } from '../common/models/User';
import { LoggingService } from '../val-modules/common/services/logging.service';

export type GrantType = 'ALL' | 'ANY';
export const DEFAULT_GRANT_TYPE: GrantType = 'ANY';

@Injectable({ providedIn: 'root' })
export class UserService {

  // Private user, exposed publicly as an observable
  private _user: User = null;
  private userGrantList: string[] = [];
  private _userSubject = new BehaviorSubject<User>(this._user);
  private userFetch = new Subject<User>();

  // Public access to the user is through this observable
  public userObservable: Observable<User> = this._userSubject.asObservable();

  constructor(private config: AppConfig,
              private httpClient: HttpClient,
              private cookieService: CookieService,
              private logger: LoggingService) { }

  /**
   * Store the user obect for use in the application
   * @param user The User object that will be used for storing user information
   */
  public setUser(user: User) {
    this.logger.debug.log('fired setUser() in UserService', user);
    this._user = user;
    if (user && user.userRoles) {
      this.userGrantList = user.userRoles.filter(r => r != null).map(r => r.toString().toUpperCase());
    } else {
      this.userGrantList = [];
    }
    this._userSubject.next(this._user);
  }

  /**
   * Look up a user record from AM_USERS using the Fuse service
   * @param username The username to look up from the Fuse service
   * @param fullToken The full authorization token sent back by the appropriate id/auth service
   * @returns a User with only the ID populated
   */
  public fetchUserRecord(username: string, fullToken: string) : Observable<User> {
    this._fetchUserRecord(username, fullToken).subscribe(res => {
      const user: User = new User();
      user.userId = res.payload.userId;
      user.userRoles = res.payload.accessRights;
      if (isNaN(user.userId)) {
        this.userFetch.next(null);
      }
      this.userFetch.next(user);
    }, err => {
      this.logger.error.log('Error loading user information', err);
      this.userFetch.next(null);
    });
    return this.userFetch;
  }

  private _fetchUserRecord(username: string, fullToken: string) : Observable<RestResponse<UserResponse>> {
    const headers: HttpHeaders = new HttpHeaders().set('Authorization', fullToken);
    const url: string = this.config.valServiceBase + 'v1/targeting/base/targetingcatalogquery/lookupCrossbowUserByLoginName/' + username;
    return this.httpClient.get<RestResponse<UserResponse>>(url, { headers });
  }

  /**
   * Retrieve the User object for the currently logged in user
   * @returns A User object
   */
  public getUser() : User {
    return this._user;
  }

  public userHasGrants(requiredGrants: string[], grantType: GrantType = DEFAULT_GRANT_TYPE) : boolean {
    let result = false;
    const currentUserGrants = new Set<string>(this.userGrantList);
    requiredGrants.forEach((p, i) => {
      if (i === 0) {
        result = currentUserGrants.has(p.toUpperCase());
      } else {
        if (grantType === 'ALL') {
          result = result && currentUserGrants.has(p.toUpperCase());
        } else {
          result = result || currentUserGrants.has(p.toUpperCase());
        }
      }
    });
    return result;
  }
}
