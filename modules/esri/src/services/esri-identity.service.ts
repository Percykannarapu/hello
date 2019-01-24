import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { EsriApi } from '../core/esri-api.service';
import { TokenResponse } from '../core/esri-utils';
import { EsriAuthenticationParams, EsriAuthenticationToken } from '../configuration';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class EsriIdentityService {

  constructor(private http: HttpClient,
              @Inject(EsriAuthenticationToken) private config: EsriAuthenticationParams) { }

  authenticate() : Observable<TokenResponse> {
    const headers = new HttpHeaders()
      .set('content-type', 'application/x-www-form-urlencoded');
    const body = new HttpParams()
      .set('username', this.config.userName)
      .set('password', this.config.password)
      .set('f', 'json')
      .set('client', 'referer')
      .set('referer', this.config.referer);
    return this.http.post<TokenResponse>(this.config.generatorUrl, body, {headers: headers}).pipe(
      tap(response => this.registerToken(response))
    );
  }

  registerToken(response: TokenResponse) : void {
    EsriApi.IdentityManager.registerToken({
      expires: response.expires,
      server: this.config.tokenServerUrl,
      ssl: response.ssl,
      token: response.token
    });
  }
}
