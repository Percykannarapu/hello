import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { AppConfig } from '../app.config';
import { RestResponse } from '../models/RestResponse';
import { User } from '../models/User';
import { LoggingService } from '../val-modules/common/services/logging.service';
import { RestDataService } from '../val-modules/common/services/restdata.service';

@Injectable()
export class UserService {

  // Private user, exposed publicly as an observable
  private _user = new User;
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
    this.logger.debug.log('fired setUser() in UserService');
    this._user = user;
    this._userSubject.next(this._user);
  }

  /**
   * Store the user object in a cookie that will expire at midnight each day
   * @param user The User object to store in a cookie
   */
  public storeUserCookie(user: User) {
    const date: Date = new Date();
    const now: Date = new Date(Date.now());
    date.setHours(0, 0, 0, 0);
    date.setDate(now.getDate() + 1);
    this.cookieService.set('u', btoa(JSON.stringify(user)), date);
  }

  /**
   * Load the User object from the cookie that has been stored
   * @returns a boolean indicating if the load was successful
   */
  public loadUserCookie() : boolean {
    if (this.cookieService.check('u')) {
      const userJson: string = atob(this.cookieService.get('u'));
      const user: User = JSON.parse(userJson);
      if (user == null || user.username == null || user.userId == null) {
        return false;
      }
      this.setUser(user);
      return true;
    }
    return false;
  }

  /**
   * Look up a user record from AM_USERS using the Fuse service
   * @param username The username to look up from the Fuse service
   * @returns a User with only the ID populated
   */
  public fetchUserRecord(username: string) : Observable<User> {
    this._fetchUserRecord(username).subscribe(res => {
      const user: User = new User();
      user.userId = res.payload;
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

  /**
   * Invoke the Fuse service to fetch user details
   * @param username The username to look up from the Fuse service
   * @returns An Observable<RestResponse>
   */
  private _fetchUserRecord(username: string) : Observable<RestResponse> {
    const headers: HttpHeaders = new HttpHeaders().set('username', username).set('Authorization', 'Bearer ' + RestDataService.getConfig().oauthToken);
    const url: string = this.config.valServiceBase + 'v1/targeting/base/targetingcatalogquery/lookupCrossbowUserByLoginName/' + username;
    return this.httpClient.get<RestResponse>(url, {headers: headers});
  }

  /**
   * Retreive the User object for the currently logged in user
   * @returns A User object
   */
  public getUser() : User {
    return this._user;
  }
}
