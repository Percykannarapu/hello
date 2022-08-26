import { Inject, Injectable } from '@angular/core';
import esriId from '@arcgis/core/identity/IdentityManager';
import { Store } from '@ngrx/store';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EsriAuthenticationParams, EsriAuthenticationToken } from '../configuration';
import { AppState } from '../state/esri.reducers';
import { tokenRefresh } from '../state/init/esri.init.actions';
import { LoggingService } from './logging.service';

@Injectable({
  providedIn: 'root'
})
export class EsriAuthService {

  private suspended = false;
  private timerHandle: number | null = null;

  constructor(private store$: Store<AppState>,
              private logger: LoggingService,
              @Inject(EsriAuthenticationToken) private authConfig: EsriAuthenticationParams) { }

  private cleanupPreviousTimeout() : void {
    if (this.timerHandle != null) {
      window.clearTimeout(this.timerHandle);
      this.timerHandle = null;
    }
  }

  private scheduleFutureRefresh(token: __esri.IdentityManagerRegisterTokenProperties) : void {
    this.cleanupPreviousTimeout();
    const fiveMinutes = 1000 * 60 * 5;
    // calculate the timeout interval - want the timeout to fire 5 minutes before the token expires
    const interval = (token.expires || 0) - Date.now() - fiveMinutes;
    if (interval > 0) {
      // start the future token refresh
      this.timerHandle = window.setTimeout((store: Store<AppState>, logger: LoggingService) => {
        logger.info.log('esri token expires soon. Refreshing now.');
        store.dispatch(tokenRefresh());
      }, interval, this.store$, this.logger);
    } else {
      this.logger.warn.log('Token timeout is less than 5 minutes in the future, refreshing now.');
      this.store$.dispatch(tokenRefresh());
    }
  }

  public generateToken() : Observable<__esri.IdentityManagerRegisterTokenProperties> {
    const serverInfo = { tokenServiceUrl: this.authConfig.tokenGenerator } as __esri.ServerInfo;
    const userInfo = { username: this.authConfig.userName, password: this.authConfig.password };
    return from(esriId.generateToken(serverInfo, userInfo)).pipe(
      map(response => ({ ...response, server: this.authConfig.tokenServer }))
    );
  }

  public registerToken(token: __esri.IdentityManagerRegisterTokenProperties) : void {
    // register the token with the esri API
    esriId.registerToken(token);
    this.scheduleFutureRefresh(token);
  }

  public suspendOrRestoreRefresh(isOnline: boolean, token: __esri.IdentityManagerRegisterTokenProperties) : void {
    if (isOnline) {
      if (this.suspended) {
        // restore the refresh process
        this.logger.info.log('Network Online, restarting Esri token refresh process.');
        this.suspended = false;
        this.scheduleFutureRefresh(token);
      }
    } else {
      // suspend the refresh process
      this.logger.info.log('Network Offline, suspending Esri token refresh process.');
      this.suspended = true;
      this.cleanupPreviousTimeout();
    }
  }
}
