import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppConfig } from '../app.config';
import { LocalAppState } from '../state/app.interfaces';
import { LoggingService } from '../val-modules/common/services/logging.service';

const noop = () : void => {};

@Injectable({
  providedIn: 'root'
})
export class AppLoggingService extends LoggingService {

  // get fatal() : (message?: any, ...optionalParams: any[]) => void {
  //   this.store$.dispatch(new CrashStopBusyIndicator());
  //   if (LogLevels.FATAL >= this.cfg.logLevel) {
  //     return console.error.bind(console, '%cFATAL', 'color: red', '-');
  //   } else {
  //     return noop;
  //   }
  // }

  constructor(cfg: AppConfig, private store$: Store<LocalAppState>) {
    super(cfg);
  }
}

