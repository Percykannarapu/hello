import { Inject, Injectable } from '@angular/core';
import esriId from '@arcgis/core/identity/IdentityManager';
import { Store } from '@ngrx/store';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EsriAuthenticationParams, EsriAuthenticationToken } from '../configuration';
import { AppState } from '../state/esri.reducers';
import { TokenRefresh } from '../state/init/esri.init.actions';
import { LoggingService } from './logging.service';

@Injectable({
  providedIn: 'root'
})
export class EsriAuthService {

  private timerHandle: number | null = null;

  constructor(private store$: Store<AppState>,
              private logger: LoggingService,
              @Inject(EsriAuthenticationToken) private authConfig: EsriAuthenticationParams) { }

  public generateToken() : Observable<__esri.IdentityManagerRegisterTokenProperties> {
    const serverInfo = { tokenServiceUrl: this.authConfig.tokenGenerator } as __esri.ServerInfo;
    const userInfo = { username: this.authConfig.userName, password: this.authConfig.password };
    return from(esriId.generateToken(serverInfo, userInfo)).pipe(
      map(response => ({ ...response, server: this.authConfig.tokenServer }))
    );
  }

  public registerToken(token: __esri.IdentityManagerRegisterTokenProperties) : void {
    // cleanup previous timeouts
    if (this.timerHandle != null) {
      window.clearTimeout(this.timerHandle);
      this.timerHandle = null;
    }
    // register the token with the esri API
    esriId.registerToken(token);
    const fiveMinutes = 1000 * 60 * 5;
    // calculate the timeout interval - want the timeout to fire 5 minutes before the token expires
    const interval = (token.expires || 0) - Date.now() - fiveMinutes;
    if (interval > 0) {
      // start the future token refresh
      this.timerHandle = window.setTimeout((store: Store<AppState>, logger: LoggingService) => {
        logger.info.log('esri token expires soon. Refreshing now.');
        store.dispatch(new TokenRefresh());
      }, interval, this.store$, this.logger);
    } else {
      this.logger.warn.log('Token timeout was less than 5 minutes in the future!');
    }
  }
}
