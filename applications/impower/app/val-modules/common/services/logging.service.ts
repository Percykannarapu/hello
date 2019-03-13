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

const noop = () : any => undefined;

@Injectable({
  providedIn: 'root'
})
export class LoggingService {

  get debug() {
    if (LogLevels.DEBUG >= this.cfg.logLevel) {
      return console.log.bind(console);
    } else {
      return noop;
    }
  }

  get info() {
    if (LogLevels.INFO >= this.cfg.logLevel) {
      return console.log.bind(console);
    } else {
      return noop;
    }
  }

  get warn() {
    if (LogLevels.WARN >= this.cfg.logLevel) {
      return console.warn.bind(console);
    } else {
      return noop;
    }
  }

  get error() {
    if (LogLevels.ERROR >= this.cfg.logLevel) {
      return console.error.bind(console);
    } else {
      return noop;
    }
  }

  get fatal() {
    if (LogLevels.FATAL >= this.cfg.logLevel) {
      return console.error.bind(console);
    } else {
      return noop;
    }
  }

  constructor(@Inject(LoggingConfigurationToken) protected cfg: LoggingConfiguration) { }

}
