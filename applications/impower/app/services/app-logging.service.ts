import { Injectable } from '@angular/core';
import { AppConfig } from '../app.config';
import { LoggingService, LogLevels } from '../val-modules/common/services/logging.service';
import { Store } from '@ngrx/store';
import { LocalAppState } from '../state/app.interfaces';
import { ErrorNotification, InfoNotification, WarningNotification } from '../messaging';

@Injectable({
  providedIn: 'root'
})
export class AppLoggingService extends LoggingService {

  constructor(cfg: AppConfig, private store$: Store<LocalAppState>) {
    super(cfg);
  }

  private logWithNotification(level: LogLevels, notificationTitle: string, message: string) : void {
    if (level >= this.cfg.logLevel) {
      switch (level) {
        case LogLevels.DEBUG:
        case LogLevels.INFO:
          this.store$.dispatch(new InfoNotification({ notificationTitle, message}));
          break;
        case LogLevels.WARN:
          this.store$.dispatch(new WarningNotification({ notificationTitle, message}));
          break;
        case LogLevels.ERROR:
        case LogLevels.FATAL:
          this.store$.dispatch(new ErrorNotification({ notificationTitle, message}));
          break;
      }
    }
  }

  debugWithNotification(title: string, message: string, ...data) : void {
    this.logWithNotification(LogLevels.DEBUG, title, message);
    super.debug(`Toast: ${title} -- ${message}`, data);
  }

  infoWithNotification(title: string, message: string, ...data) : void {
    this.logWithNotification(LogLevels.INFO, title, message);
    super.info(`Toast: ${title} -- ${message}`, data);
  }

  warnWithNotification(title: string, message: string, ...data) : void {
    this.logWithNotification(LogLevels.WARN, title, message);
    super.warn(`Toast: ${title} -- ${message}`, data);
  }

  errorWithNotification(title: string, message: string, ...data) : void {
    this.logWithNotification(LogLevels.ERROR, title, message);
    super.error(`Toast: ${title} -- ${message}`, data);
  }

  fatalWithNotification(title: string, message: string, ...data) : void {
    this.logWithNotification(LogLevels.FATAL, title, message);
    super.fatal(`Toast: ${title} -- ${message}`, data);
  }

}

