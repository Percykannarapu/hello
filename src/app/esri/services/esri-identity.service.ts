import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { EsriAuthenticationConfig, EsriAuthenticationParams, EsriAuthenticationToken } from '../configuration';
import { EsriApi } from '../core/esri-api.service';

interface TokenResponse {
  token: string;
  expires: number;
  ssl: boolean;
}

@Injectable()
export class EsriIdentityService {

  public token: string;

  constructor(private http: HttpClient,
              private modules: EsriApi,
              @Inject(EsriAuthenticationToken) private config: EsriAuthenticationConfig) { }

  public authenticate() {
    this.modules.loadModules(['esri/identity/IdentityManager'])
      .then(m => this.authImpl(m[0], this.config.esriAuthParams));
  }

  private authImpl(identityManager: __esri.IdentityManager, params: EsriAuthenticationParams) {
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
