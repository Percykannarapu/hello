import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { User } from '../models/User';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { AppConfig } from '../app.config';
import { CookieService } from 'ngx-cookie-service';
import { UserService } from './user.service';

interface RegistrationResponse {
  clientId: string;
  clientName: string;
  callBackURL: string;
  clientSecret: string;
  isSaasApplication: boolean;
  appOwner: string;
  jsonString: string;
}

interface RegistrationPayload {
  callbackUrl: string;
  clientName: string;
  tokenScope: string;
  owner: string;
  grantType: string;
  saasApp: boolean;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expires_in: number;
}

interface RefreshResponse {
  scope: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  access_token: string;
}

@Injectable()
export class AuthService implements CanActivate {

  private user: User;
  private oauthToken: string;
  private oauthRefreshToken: string;
  private tokenExpiration: number;
  private tokenStartDate: number;
  private clientId: string;
  private clientSecret: string;
  private authenticated: boolean = this.config.authenticated;
  private authSubject: Subject<boolean> = new Subject<boolean>();
  private refreshSubject: Subject<boolean> = new Subject<boolean>();

  constructor(private router: Router,
    private httpClient: HttpClient,
    private config: AppConfig,
    private cookieService: CookieService,
    private userService: UserService) { }

  /**
   * Determine whether the requested route can be activated or not
   * @param next
   * @param state
   * @returns A boolean indicating whether or not the requested route can be activated
   */
  public canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) : Observable<boolean> | Promise<boolean> | boolean {
    if (!this.authenticated) {
      //attempt to load oauth data saved in cookies
      if (this.loadOAuthData()) {
        //if the load of oauth data was successfull then refresh the token
        return this.refreshToken();
      }
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }

  /**
   * Retrieve the oauth token aquired during the authentication process
   * @returns The oauth token aquired during the authentication process
   */
  public getOauthToken() : string {
    return this.oauthToken;
  }

  /**
   * Retrieve the expiration date and time of the oauth token
   * @returns A number representing the date and time at which the oauth token will expire
   */
  public getTokenExpiration() : number {
    return this.tokenExpiration;
  }

  /**
   * Authenticate a user to the impower application with a username and password against the API gateway
   * @param username the username to authenticate with
   * @param password the password to authenticate with
   * @returns An Observable<boolean> indicating whether the authentication attempt was successfull or not
   */
  public authenticate(username: string, password: string) : Observable<boolean> {
    this.tokenStartDate = Date.now();
    this.getOAuthToken(username, password).subscribe(tokenResponse => {
      if (tokenResponse.access_token != null) {
        this.parseTokenResponse(tokenResponse);
        this.authSubject.next(true);
        this.saveOAuthData(username);
      } else {
        this.authSubject.next(false);
      }
    }, error => {
      console.error(error);
      this.authSubject.next(false);
    });
    return this.authSubject;
  }

  /**
   * Parse the response from the API gateway for new token requests and refresh requests
   * @argument response The response from the API gateway, either a TokenResponse or a RefreshResponse
   */
  private parseTokenResponse(response: TokenResponse | RefreshResponse) {
    this.oauthToken = response.access_token;
    this.oauthRefreshToken = response.refresh_token;
    this.tokenExpiration = this.tokenStartDate + (response.expires_in * 1000);
    this.authenticated = true;
  }

  /**
   * Save the oauth token, refresh token, expiration date, client ID, client secret, and username to cookies
   * All values will be base64 encoded
   * @param username The username of the user who logged in
   */
  private saveOAuthData(username: string) {
    const date: Date = new Date();
    const now: Date = new Date(Date.now());
    date.setHours(0, 0, 0, 0);
    date.setDate(now.getDate() + 1);
    this.cookieService.set('ot', this.oauthToken != null ? btoa(this.oauthToken) : null, date);
    this.cookieService.set('ort', this.oauthToken != null ? btoa(this.oauthRefreshToken) : null, date);
    this.cookieService.set('te', this.oauthToken != null ? btoa(this.tokenExpiration.toString()) : null, date);
    this.cookieService.set('ci', this.oauthToken != null ? btoa(this.clientId) : null, date);
    this.cookieService.set('cs', this.oauthToken != null ? btoa(this.clientSecret) : null, date);
    this.cookieService.set('u', this.oauthToken != null ? btoa(username) : null, date);
  }

  /**
   * Attempt to load the oauth data from cookies
   * @returns A boolean indicating whether the load was successfull or not
   */
  private loadOAuthData() : boolean {
    if (this.cookieService.check('ot')) {
      this.oauthToken = atob(this.cookieService.get('ot'));
    }
    if (this.cookieService.check('ort')) {
      this.oauthRefreshToken = atob(this.cookieService.get('ort'));
    }
    if (this.cookieService.check('te')) {
      this.tokenExpiration = Number(atob(this.cookieService.get('te')));
    }
    if (this.cookieService.check('ci')) {
      this.clientId = atob(this.cookieService.get('ci'));
    }
    if (this.cookieService.check('cs')) {
      this.clientSecret = atob(this.cookieService.get('cs'));
    }
    if (this.cookieService.check('u')) {
      const user: User = new User();
      user.username = atob(this.cookieService.get('u'));
      this.userService.setUser(user);
    }
    if (this.oauthToken != null &&
      this.oauthRefreshToken != null &&
      this.tokenExpiration != null &&
      this.clientId != null &&
      this.clientSecret != null) {
      return true;
    }
    return false;
  }

  /**
   * Make the HTTP requests to the API gateway to generate an OAuth token
   * @param username the username to authenticate with
   * @param password the password to authenticate with
   * @returns An Observable<TokenResponse> containing the repsonse from the API gateway for the authentication request
   */
  private getOAuthToken(username: string, password: string) : Observable<TokenResponse> {

    // Set up the Authorization header for the request
    // The Authorization header must contain the base64 encoded value of username:password
    const authData: string = btoa(username + ':' + password);
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', 'Basic ' + authData);

    // Set up the body of the request for the client id and secret
    const registrationPayload: RegistrationPayload = {
      callbackUrl: '',
      clientName: 'impower',
      tokenScope: 'Production',
      owner: username,
      grantType: 'password refresh_token',
      saasApp: true
    };

    // set up the body of the request for the token request
    const tokenParams = new HttpParams()
      .set('grant_type', 'password')
      .set('username', username)
      .set('password', password)
      .set('scope', 'apim:api_view');

    // Send the request to the API gateway to get the client id and secret
    return this.httpClient.post<RegistrationResponse>(this.config.oAuthParams.registerUrl, registrationPayload, { headers: headers })
      .map(res => this.parseRegistrationResponse(res))
      .mergeMap(tokenHeaders => this.httpClient.post<TokenResponse>(this.config.oAuthParams.tokenUrl, tokenParams, { headers: tokenHeaders }));
  }

  /**
   * Parse the response from the registration request that was sent to the API gateway
   * @returns A HTTP Authorization header that can be used in the token request to the API gateway
   */
  private parseRegistrationResponse(registrationResponse: RegistrationResponse) : HttpHeaders {
    this.clientId = registrationResponse.clientId;
    this.clientSecret = registrationResponse.clientSecret;
    return new HttpHeaders().set('Authorization', 'Basic ' + btoa(registrationResponse.clientId + ':' + registrationResponse.clientSecret));
  }

  /**
   * Refresh a user's OAuth token for the impower application using the API gateway REST interface
   * @returns An Observable<boolean> which will indicate whether the refresh operation was successfull or not
   */
  public refreshToken() : Observable<boolean> {
    this._refreshToken().subscribe(refreshResponse => {
      if (refreshResponse.access_token != null) {
        this.parseTokenResponse(refreshResponse);
        this.refreshSubject.next(true);
        this.saveOAuthData(this.userService.getUser().username);
      } else {
        this.refreshSubject.next(false);
      }
    }, error => {
      console.error(error);
      this.router.navigate(['/login']);
      this.refreshSubject.next(false);
    });
    return this.refreshSubject;
  }

  /**
   * Make the HTTP requests to the API gateway to refresh an OAuth token
   * @returns An Observable<RefreshResponse> that can be used to get the refreshed token
   */
  private _refreshToken() : Observable<RefreshResponse> {

    // Set up the Authorization header for the request
    // The Authorization header must contain the base64 encoded value of clientId:clientSecret
    const authData: string = btoa(this.clientId + ':' + this.clientSecret);
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('Authorization', 'Basic ' + authData);

    // set up the body of the request for the token refresh request
    const tokenRefreshParams = new HttpParams()
      .set('grant_type', 'refresh_token')
      .set('refresh_token', this.oauthRefreshToken);

    return this.httpClient.post<RefreshResponse>(this.config.oAuthParams.tokenUrl, tokenRefreshParams, { headers: headers });

  }

}

