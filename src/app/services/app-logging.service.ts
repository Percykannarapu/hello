import { Injectable } from '@angular/core';
import { AppConfig } from '../app.config';
import { LoggingService, LogLevels } from '../val-modules/common/services/logging.service';
import { AppMessagingService } from './app-messaging.service';

@Injectable({
  providedIn: 'root'
})
export class AppLoggingService extends LoggingService {

  constructor(private messagingService: AppMessagingService, cfg: AppConfig) {
    super(cfg);
  }

  private logWithToast(level: LogLevels, title: string, message: string) : void {
    if (level >= this.cfg.logLevel) {
      switch (level) {
        case LogLevels.DEBUG:
        case LogLevels.INFO:
          this.messagingService.showGrowlInfo(title, message);
          break;
        case LogLevels.WARN:
          this.messagingService.showGrowlWarning(title, message);
          break;
        case LogLevels.ERROR:
        case LogLevels.FATAL:
          this.messagingService.showGrowlError(title, message);
          break;
      }
    }
  }

  debugWithToast(title: string, message: string, ...data) : void {
    this.logWithToast(LogLevels.DEBUG, title, message);
    super.debug(`Toast: ${title} -- ${message}`, data);
  }

  infoWithToast(title: string, message: string, ...data) : void {
    this.logWithToast(LogLevels.INFO, title, message);
    super.info(`Toast: ${title} -- ${message}`, data);
  }

  warnWithToast(title: string, message: string, ...data) : void {
    this.logWithToast(LogLevels.WARN, title, message);
    super.warn(`Toast: ${title} -- ${message}`, data);
  }

  errorWithToast(title: string, message: string, ...data) : void {
    this.logWithToast(LogLevels.ERROR, title, message);
    super.error(`Toast: ${title} -- ${message}`, data);
  }

  fatalWithToast(title: string, message: string, ...data) : void {
    this.logWithToast(LogLevels.FATAL, title, message);
    super.fatal(`Toast: ${title} -- ${message}`, data);
  }

}

