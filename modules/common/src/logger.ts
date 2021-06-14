import { isNotNil } from './type-checks';

export enum LogLevels {
  ALL = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5,
  OFF = 6
}

const noop = () : void => {};

export type logCall = (message?: any, ...optionalParams: any[]) => void;
export type groupCall = (groupTitle?: string, ...optionalParams: any[]) => void;
export type filterCall<T> = (value: T, index: number, array: T[]) => boolean;
export type mapCall<T> = (value: T, index: number, array: T[]) => unknown;

export class Logger {

  get group() : groupCall {
    if (this.loggerLevel >= this.appLevel || this.ignoreLogLevel) {
      return console.group.bind(console, `%c${this.title}`, `color: ${this.titleColor}`, '-');
    } else {
      return noop;
    }
  }

  get groupCollapsed() : groupCall {
    if (this.loggerLevel >= this.appLevel || this.ignoreLogLevel) {
      return console.groupCollapsed.bind(console, `%c${this.title}`, `color: ${this.titleColor}`, '-');
    } else {
      return noop;
    }
  }

  get groupEnd() : () => void {
    if (this.loggerLevel >= this.appLevel || this.ignoreLogLevel) {
      return console.groupEnd.bind(console);
    } else {
      return noop;
    }
  }

  get log() : logCall {
    if (this.loggerLevel >= this.appLevel || this.ignoreLogLevel) {
      return this.logBind.bind(console, `%c${this.title}`, `color: ${this.titleColor}`, '-');
    } else {
      return noop;
    }
  }

  get table() : (...data: any[]) => void {
    if (this.loggerLevel >= this.appLevel || this.ignoreLogLevel) {
      return console.table.bind(console);
    } else {
      return noop;
    }
  }

  get count() : (countTitle?: string) => void {
    if (this.loggerLevel >= this.appLevel || this.ignoreLogLevel) {
      return console.count.bind(console);
    } else {
      return noop;
    }
  }

  get countReset() : (countTitle?: string) => void {
    if (this.loggerLevel >= this.appLevel || this.ignoreLogLevel) {
      // @ts-ignore
      return console.countReset.bind(console);
    } else {
      return noop;
    }
  }

  private ignoreLogLevel = false;

  constructor(private titleColor: string, private title: string, private loggerLevel: LogLevels, private appLevel: LogLevels,
              private logBind: logCall) {}

  public logArray<T>(title: string, items: T[], filter?: filterCall<T>, map?: mapCall<T>) : void {
    if (this.loggerLevel >= this.appLevel) {
      const result = isNotNil(filter) ? (items ?? [] as T[]).filter(filter) : (items ?? [] as T[]);
      this.groupCollapsed(title);
      result.length > 0
        ? this.log(isNotNil(map) ? result.map(map) : result)
        : this.log('No Data');
      this.groupEnd();
    }
  }

  public tableArray<T>(title: string, items: T[], filter?: filterCall<T>, map?: mapCall<T>) : void {
    if (this.loggerLevel >= this.appLevel) {
      const result = isNotNil(filter) ? (items ?? [] as T[]).filter(filter) : (items ?? [] as T[]);
      this.groupCollapsed(title);
      result.length > 0
        ? this.table(isNotNil(map) ? result.map(map) : result)
        : this.log('No Data');
      this.groupEnd();
    }
  }

  toggleLevelIgnore() : void {
    this.ignoreLogLevel = !this.ignoreLogLevel;
  }
}
