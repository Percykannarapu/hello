/* tslint:disable:no-console */
import { Inject, Injectable } from '@angular/core';
import { Logger, LogLevels } from '@val/common';
import { EsriAppSettings, EsriAppSettingsToken } from '../configuration';

@Injectable()
export class LoggingService {
  debug: Logger;
  info: Logger;
  warn: Logger;
  error: Logger;
  fatal: Logger;

  constructor(@Inject(EsriAppSettingsToken) protected cfg: EsriAppSettings) {
    this.debug = new Logger('#03A9F4', 'DEBUG', LogLevels.DEBUG, cfg.logLevel, console.log);
    this.info = new Logger('#4CAF50', 'INFO', LogLevels.INFO, cfg.logLevel, console.info);
    this.warn = new Logger('#a0895b', 'WARN', LogLevels.WARN, cfg.logLevel, console.warn);
    this.error = new Logger('red', 'ERROR', LogLevels.ERROR, cfg.logLevel, console.error);
    this.fatal = new Logger('red', 'FATAL', LogLevels.FATAL, cfg.logLevel, console.error);
  }
}
