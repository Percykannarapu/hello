import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { EsriAuthenticationConfig, EsriAuthenticationToken } from '../configuration';
import { EsriApi } from '../core/esri-api.service';
import { TokenResponse } from '../core/esri-utils';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class EsriIdentityService {

  constructor(private http: HttpClient,
              @Inject(EsriAuthenticationToken) private config: EsriAuthenticationConfig) { }

  authenticate() : Observable<TokenResponse> {
    const params = this.config.esriAuthParams;
    const headers = new HttpHeaders()
      .set('content-type', 'application/x-www-form-urlencoded');
    const body = new HttpParams()
      .set('username', params.userName)
      .set('password', params.password)
      .set('f', 'json')
      .set('client', 'referer')
      .set('referer', params.referer);
    return this.http.post<TokenResponse>(params.generatorUrl, body, {headers: headers}).pipe(
      tap(response => this.registerToken(response))
    );
  }

  registerToken(response: TokenResponse) : void {
    EsriApi.IdentityManager.registerToken({
      expires: response.expires,
      server: this.config.esriAuthParams.tokenServerUrl,
      ssl: response.ssl,
      token: response.token
    });
  }
}
