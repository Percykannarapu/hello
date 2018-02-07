import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { User } from '../models/User';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { mergeMap } from 'rxjs/operators/mergeMap';

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

@Injectable()
export class AuthService implements CanActivate {

  private user: User;
  private oauthToken: string;
  private authenticated: boolean = false;
  private authSubject: Subject<boolean> = new Subject<boolean>();

  constructor(private router: Router, private httpClient: HttpClient) { }

  /**
   * Determine whether the requested route can be activated or not
   * @param next 
   * @param state 
   */
  public canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) : Observable<boolean> | Promise<boolean> | boolean {
    if (!this.authenticated) {
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }

  /**
   * Authenticate a user to the impower application with a username and password against the API gateway
   * @param username the username to authenticate with
   * @param password the password to authenticate with
   */
  public authenticate(username: string, password: string) : Observable<boolean> {
    this.getOAuthToken(username, password).subscribe(tokenResponse => {
      if (tokenResponse.access_token != null) {
        this.authenticated = true;
        this.authSubject.next(true);
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
   * Make the HTTP requests to the API gateway to generate an OAuth token
   * @param username the username to authenticate with
   * @param password the password to authenticate with
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
    const registerUrl: string = 'https://vallomjbs002vm.val.vlss.local:8443/oauth/register';
    const tokenUrl: string = 'https://vallomjbs002vm.val.vlss.local:8443/oauth/token';
    return this.httpClient.post<RegistrationResponse>(registerUrl, registrationPayload, { headers: headers })
      .map(res => new HttpHeaders().set('Authorization', 'Basic ' + btoa(res.clientId + ':' + res.clientSecret)))
      .mergeMap(tokenHeaders => this.httpClient.post<TokenResponse>(tokenUrl, tokenParams, {headers: tokenHeaders}));
  }

}

