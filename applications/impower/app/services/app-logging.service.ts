import { Injectable } from '@angular/core';
import { CrashStopBusyIndicator } from '../../../../modules/messaging/state/busyIndicator/busy.state';
import { AppConfig } from '../app.config';
import { LoggingService, LogLevels } from '../val-modules/common/services/logging.service';
import { Store } from '@ngrx/store';
import { LocalAppState } from '../state/app.interfaces';

const noop = () : any => undefined;

@Injectable({
  providedIn: 'root'
})
export class AppLoggingService extends LoggingService {

  get fatal() {
    this.store$.dispatch(new CrashStopBusyIndicator());
    if (LogLevels.FATAL >= this.cfg.logLevel) {
      return console.error.bind(console, 'FATAL - ');
    } else {
      return noop;
    }
  }

  constructor(cfg: AppConfig, private store$: Store<LocalAppState>) {
    super(cfg);
  }
}

