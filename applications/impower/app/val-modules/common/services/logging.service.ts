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

const noop = () : void => {};

@Injectable({
  providedIn: 'root'
})
export class LoggingService {

  get debug() : (message?: any, ...optionalParams: any[]) => void {
    if (LogLevels.DEBUG >= this.cfg.logLevel) {
      return console.log.bind(console, '%cDEBUG', 'color: #03A9F4', '-');
    } else {
      return noop;
    }
  }

  get info() : (message?: any, ...optionalParams: any[]) => void {
    if (LogLevels.INFO >= this.cfg.logLevel) {
      return console.log.bind(console, '%cINFO', 'color: #4CAF50', '-');
    } else {
      return noop;
    }
  }

  get warn() : (message?: any, ...optionalParams: any[]) => void {
    if (LogLevels.WARN >= this.cfg.logLevel) {
      return console.warn.bind(console, '%cWARN', 'color: %a0895b', '-');
    } else {
      return noop;
    }
  }

  get error() : (message?: any, ...optionalParams: any[]) => void {
    if (LogLevels.ERROR >= this.cfg.logLevel) {
      return console.error.bind(console, '%cERROR', 'color: red', '-');
    } else {
      return noop;
    }
  }

  get fatal() : (message?: any, ...optionalParams: any[]) => void {
    if (LogLevels.FATAL >= this.cfg.logLevel) {
      return console.error.bind(console, '%cFATAL', 'color: red', '-');
    } else {
      return noop;
    }
  }

  constructor(@Inject(LoggingConfigurationToken) protected cfg: LoggingConfiguration) { }

}
