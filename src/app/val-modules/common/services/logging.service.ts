import { Inject, Injectable, InjectionToken } from '@angular/core';

export enum LogLevels {
  ALL = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5,
  OFF = 6
}

export interface LoggingConfiguration {
  logLevel: LogLevels;
}

export const LoggingConfigurationToken = new InjectionToken<LoggingConfiguration>('logging-config-options');

@Injectable({
  providedIn: 'root'
})
export class LoggingService {

  constructor(@Inject(LoggingConfigurationToken) protected cfg: LoggingConfiguration) { }

  private log(level: LogLevels, message: string, ...data: any[]) {
    if (level >= this.cfg.logLevel) {
      switch (level) {
        case LogLevels.DEBUG:
        case LogLevels.INFO:
          console.log(message, ...data);
          break;
        case LogLevels.WARN:
          console.warn(message, ...data);
          break;
        case LogLevels.ERROR:
        case LogLevels.FATAL:
          console.error(message, ...data);
          break;
      }
    }
  }

  debug(message: string, ...data: any[]) {
    this.log(LogLevels.DEBUG, `DEBUG: ${message}`, ...data);
  }

  info(message: string, ...data: any[]) {
    this.log(LogLevels.INFO, `INFO: ${message}`, ...data);
  }

  warn(message: string, ...data: any[]) {
    this.log(LogLevels.WARN, `WARN: ${message}`, ...data);
  }

  error(message: string, ...data: any[]) {
    this.log(LogLevels.ERROR, `ERROR: ${message}`, ...data);
  }

  fatal(message: string, ...data: any[]) {
    this.log(LogLevels.FATAL, `FATAL: ${message}`, ...data);
  }
}
