import config from '@arcgis/core/config';
import IdentityManager from '@arcgis/core/identity/IdentityManager';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EsriAuthenticationParams, EsriConfigOptions } from '../configuration';
import { TokenResponse } from './esri-utils';

export function setupEsriConfig(options: EsriConfigOptions) : void {
  config.portalUrl = options.portalUrl;
  config.request.timeout = options.request.timeout;
}

export function generateToken(authConfig: EsriAuthenticationParams) : Observable<TokenResponse> {
  const serverInfo = { tokenServiceUrl: authConfig.tokenGenerator } as __esri.ServerInfo;
  const userInfo = { username: authConfig.userName, password: authConfig.password };
  return from(IdentityManager.generateToken(serverInfo, userInfo)).pipe(
    map(response => ({ ...response, server: authConfig.tokenServer }))
  );
}

export function displayInitializationError(err: any) : void {
  const errorMsgElement = document.querySelector('#errorMsgElement');
  let message = 'Application initialization failed';
  if (err) {
    if (err.message) {
      message = message + ': ' + err.message;
    } else {
      message = message + ': ' + err;
    }
  }
  errorMsgElement.textContent = message;
}
