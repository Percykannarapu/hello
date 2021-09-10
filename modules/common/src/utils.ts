// noinspection CommaExpressionJS

import { isConvertibleToNumber, isFunction, isNil, isString } from './type-checks';

export function transformEntity(entity: Record<any, any>, valueSelector: (field: string, item: any) => any, keySelector?: (key: string) => string) : Record<any, any> {
  const newEntity: any = {};
  if (entity == null) return null;
  const tx: ((field: string, item: any) => any) = valueSelector != null ? valueSelector : (i) => i;
  for (const [entityKey, entityValue] of Object.entries(entity)) {
    const newValue = {};
    Object.entries(entityValue).map((prop) => {
      const currentKey = (keySelector == null) ? prop[0] : keySelector(prop[0]);
      if (currentKey !== null)
        newValue[currentKey] = tx(currentKey, prop[1]);
    });
    newEntity[entityKey] = newValue;
  }
  return newEntity;
}

export function entityToMap<T, R>(entity: Record<string, T>,
                                  valueTransform?: (key: string, value: T, entity: Record<string, T>) => R,
                                  keyTransform?: (key: string, value: T, entity: Record<string, T>) => string,
                                  filter?:  (key: string, value: T, entity: Record<string, T>) => boolean) : Map<string, R> {
  const usableVx = valueTransform ?? ((k, v) => v as unknown as R);
  const usableKx = keyTransform ?? (k => k);
  const usableFilter = filter ?? (() => true);
  const result = new Map<string, R>();
  if (isNil(entity)) return result;
  for (const [key, value] of Object.entries(entity)) {
    const newKey = usableKx(key, value, entity);
    const newValue = usableVx(key, value, entity);
    if (usableFilter(key, value, entity)) result.set(newKey, newValue);
  }
  return result;
}

export function resolveFieldData(data: any, field: Function | string) : any {
  if (data && field) {
    if (isFunction(field)) {
      return field(data);
    }
    else if (field.indexOf('.') === -1) {
      return data[field];
    }
    else {
      const fields: string[] = field.split('.');
      let value = data;
      for (let i = 0, len = fields.length; i < len; ++i) {
        if (value == null) {
          return null;
        }
        value = value[fields[i]];
      }
      return value;
    }
  }
  else {
    return null;
  }
}

export function roundTo(value: number, precision: number) : number {
  const pow: number = Math.pow(10, precision);
  return parseFloat(String(Math.round((value * pow)) / pow));
}

/**
 *  Formats millisecond input into h:m:s.nnn
 *
 *  Usage:
 *    let startTime = performance.now();
 *    ...
 *    let endTime = performance.now();
 *    console.log('Process took', formatMilli(endTime - startTime));
 *
 * Milliseconds       Output      Notes
 * -----------------  ----------  ----------------------------------------
 * 99152612           3h 32m 32s  Handles Long running processes
 * 1152612            19m 12s
 * 152612             2m 32s      Anything above a minute rounds seconds
 * 10500              10s         Anything above 10s truncates sub seconds
 * 3125               3.125s      Anything under 10s shows sub second
 * 2516               2.516s      A maxium of 3 decimals for sub seconds
 * 2001               2.001s
 * 1118               1.118s      A number with a weird precision error
 * 1000               1s          If precision is < 3, it doesn't force it
 * 612                0.612s      Can display sub millisecond values
 * 45                 0.045s
 * 10                 0.01s
 * 9.664999786764383  0.009s      Handles output from performance.now
 * 1.664999786764383  0.001s
 * 1                  0.001s
 * 0.001999786764383  0.001ms     Capped sub milliseconds to 3 decimals
 * 0.000199786764383  0ms         Below sub milli 3 dec is just instant
 */
// tslint:disable:no-bitwise
export function formatMilli(a, k?, sub?, s?, m?, h?, e?){
  return k = Math.trunc(a % 1e3), sub = Math.floor((a % 1e3 - k) * 1000) / 1000, s = a / 1e3 % 60 | 0, e = (s + k / 1000 + '').length, m = a / 6e4 % 60 | 0, h = a / 36e5 % 24 | 0,
  (h ? h + 'h ' : '') +
  (m ? m + 'm' : '') +
  (h || m || s >= 10 ? (s != 0 ? (m ? ' ' : '') + s + 's' : '') : (s >= 1 ? (e <= 5 ? s + k / 1000 : (s + k / 1000).toFixed(3)) + 's' : '')) +
  (!h && !m && s == 0 && k >= 1 ? (k / 1000) + 's' : '') +
  (!h && !m && !s && !k ? sub + 'ms' : '');
}

// Produce a unique UUID, good for use as correlation IDs in NgRx actions/effects
export function getUuid() : string {
  // @ts-ignore
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}
// tslint:enable:no-bitwise

export function dedupeSimpleSet<T>(newValues: Set<T>, previousValues: Set<T>) : Set<T> {
  const result = new Set<T>();
  newValues.forEach(nv => {
    if (!previousValues.has(nv)) result.add(nv);
  });
  return result;
}

export const safe: any = { fieldname: ''};

export function pad(value: string | number, width: number, z: string = '0') : string {
  let str = '' + value;
  while (str.length < width) str = z + str;
  return str;
}

/**
 * Formats a date into a string that our current Fuse environment is capable of parsing
 * @param date - the date to format
 * @return string - the date formatted as 'YYYY-MM-DD'
 */
export function formatDateForFuse(date: Date) : string {
  const zeroPad = Intl.NumberFormat(undefined, { minimumIntegerDigits: 2 }).format;
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}-${zeroPad(month)}-${zeroPad(day)}`;
}

export function strToBool(value: string) : boolean {
  if (value == null) return false;
  const lcValue = value.toLowerCase();
  return /^true$|^t$|^yes$|^y$|^1$/.test(lcValue);
}

/**
 * Converts a value to a number if it is parsable as a number, otherwise returns null
 * @param value - the value to convert
 */
export function toNullOrNumber(value: any) : number | null {
  return isConvertibleToNumber(value) ? Number(value) : null;
}

export function mergeSets<T>(setA: Set<T>, setB: Set<T>) : Set<T> {
  if (isNil(setA) || setA.size === 0) return setB;
  if (isNil(setB) || setB.size === 0) return setA;
  return new Set(function*() { yield* setA; yield* setB; }());
}

export function convertKeys<T>(data: Record<string, T>, processor: (key: string) => string) : Record<string, T>;
export function convertKeys<T>(data: Record<string, T>, processor: (key: string) => number) : Record<number, T>;
export function convertKeys<T>(data: Record<number, T>, processor: (key: number) => string) : Record<string, T>;
export function convertKeys<T>(data: Record<number, T>, processor: (key: number) => number) : Record<number, T>;
export function convertKeys<T>(data: Record<any, T>, processor: (key: keyof typeof data) => string | number) : Record<string | number, T> {
  const result = {};
  Object.entries(data).forEach(([key, value]) => {
    const newKey = processor(key);
    result[newKey] = value;
  });
  return result;
}

export function encloseInQuotes(inputValue: any) : string {
  if (isNil(inputValue)) return inputValue;
  if (isString(inputValue)) {
    return (inputValue.slice(0, 1) === '"' ? '' : '"') + inputValue + (inputValue.slice(-1) === '"' ? '' : '"');
  } else {
    return `"${inputValue}"`;
  }
}

export function removeNonAlphaNumerics(value: string) : string {
  return value.replace(/\W/g, '_');
}

export function removeNonAsciiChars(value: string) : string {
  return value.replace(/[^\x00-\x7F]/g, '').replace(/&nbsp;/gi, ' ');
}

export function removeTabAndNewLineRegx(value: string): string{
  return value.replace(/[\t\n\r]/gm,'');
}
