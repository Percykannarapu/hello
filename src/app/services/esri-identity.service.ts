import { Injectable } from '@angular/core';
import {EsriModules} from '../esri-modules/core/esri-modules.service';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';

interface TokenResponse {
  token: string;
  expires: number;
  ssl: boolean;
}

export interface AuthenticationParams {
  generatorUrl: string;
  tokenServerUrl: string;
  userName: string;
  password: string;
  referer: string;
}

@Injectable()
export class EsriIdentityService {

  public token: string;

  constructor(private http: HttpClient, private modules: EsriModules) { }

  public authenticate(params: AuthenticationParams) {
    this.modules.loadModules(['esri/identity/IdentityManager'])
      .then(m => this.authImpl(m[0], params));
  }

  private authImpl(identityManager: __esri.IdentityManager, params: AuthenticationParams) {
    const headers = new HttpHeaders()
      .set('content-type', 'application/x-www-form-urlencoded');
    const body = new HttpParams()
      .set('username', params.userName)
      .set('password', params.password)
      .set('f', 'json')
      .set('client', 'referer')
      .set('referer', params.referer);
    this.http.post<TokenResponse>(params.generatorUrl, body, {headers: headers}).subscribe(data => {
      this.token = data.token;
      identityManager.registerToken({expires: data.expires, server: params.tokenServerUrl, ssl: data.ssl, token: data.token});
    });
  }
}
