// noinspection CommaExpressionJS

import { isConvertibleToNumber, isFunction, isNil, isNumber, isString, isSymbol } from './type-checks';

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

export function toNullOrString(value: any) : string | null {
  return isNil(value) ? null : `${ value }`;
}

export function unionSets<T>(setA: Set<T>, setB: Set<T>) : Set<T> {
  if (isNil(setA) || setA.size === 0) return setB;
  if (isNil(setB) || setB.size === 0) return setA;
  return new Set(function*() { yield* setA; yield* setB; }());
}

export function disjointSets<T>(setA: Set<T>, setB: Set<T>) : Set<T> {
  if (isNil(setA) || setA.size === 0) return setB;
  if (isNil(setB) || setB.size === 0) return setA;
  return new Set<T>(([...setA].filter(x => !setB.has(x))).concat([...setB].filter(x => !setA.has(x))));
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

export function convertValues<T, U>(data: Record<any, T>, processor: (value: T) => U) : Record<any, U> {
  const result = {};
  Object.entries(data).forEach(([key, value]) => {
    result[key] = processor(value);
  });
  return result;
}

export function encloseInQuotes(inputValue: any) : string {
  if (isNil(inputValue)
    || (isString(inputValue) && inputValue.startsWith('"') && inputValue.endsWith('"'))
  ) {
    return inputValue;
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

export function removeTabAndNewLineRegx(value: string) : string{
  return value.replace(/[\t\n\r]/gm, '');
}

export function removeNullProperties(obj) {
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    const hasProperties = value && Object.keys(value).length > 0;
    if (value === null) {
      delete obj[key];
    }
    else if ((!isString(value)) && hasProperties) {
      removeNullProperties(value);
    }
  });
  return obj;
}


/**
 * Formats millisecond input into h:m:s.nnn
 * @example
 *    const startTime = performance.now();
 *    // code to measure
 *    const endTime = performance.now();
 *    console.log('Process took', formatMilli(endTime - startTime));
 *
 * Milliseconds       Output      Notes
 * -----------------  ----------  ----------------------------------------
 * 99152612           3h 32m 32s  Handles Long running processes
 * 1152612            19m 12s
 * 152612             2m 32s      Anything above a minute rounds seconds
 * 10500              10s         Anything above 10s truncates sub seconds
 * 3125               3.125s      Anything under 10s shows sub second
 * 2516               2.516s      A maximum of 3 decimals for sub seconds
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

/**
 * Produces a unique UUID, good for use as correlation IDs in NgRx actions/effects
 */
export function getUuid() : string {
  // @ts-ignore
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

// shamelessly stolen from lodash
const MAX_ARRAY_LENGTH = 4294967295;
const MAX_ARRAY_INDEX = MAX_ARRAY_LENGTH - 1;
const HALF_MAX_ARRAY_LENGTH = MAX_ARRAY_LENGTH >>> 1;

/**
 * Performs a binary search to return the index at which a value needs to be inserted into an array to maintain the array's sort order
 * @param array The array to search
 * @param value The value to search for
 * @param retHighest In case of ties, return the highest qualified index
 */
export function sortedIndex(array: number[], value: number, retHighest: boolean) : number {
  let low = 0;
  let high = array == null ? low : array.length;
  if (isNumber(value) && high <= HALF_MAX_ARRAY_LENGTH) {
    while (low < high) {
      const mid = (low + high) >>> 1;
      const computed = array[mid];
      if (computed !== null && !isSymbol(computed) &&
        (retHighest ? (computed <= value) : (computed < value))) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    return high;
  }
  return baseSortedIndexBy(array, value, (v) => v, retHighest);
}

// tslint:enable:no-bitwise
function baseSortedIndexBy(array: number[], value: number, iteratee: (v: number) => number, retHighest: boolean) : number {
  let low = 0;
  let high = array == null ? 0 : array.length;
  if (high == 0) {
    return 0;
  }

  value = iteratee(value);

  const valIsNaN = value !== value;
  const valIsNull = value === null;
  const valIsSymbol = isSymbol(value);
  const valIsUndefined = value === undefined;

  while (low < high) {
    let setLow;
    const mid = Math.floor((low + high) / 2);
    const computed = iteratee(array[mid]);
    const othIsDefined = computed !== undefined;
    const othIsNull = computed === null;
    const othIsReflexive = computed === computed;
    const othIsSymbol = isSymbol(computed);

    if (valIsNaN) {
      setLow = retHighest || othIsReflexive;
    } else if (valIsUndefined) {
      setLow = othIsReflexive && (retHighest || othIsDefined);
    } else if (valIsNull) {
      setLow = othIsReflexive && othIsDefined && (retHighest || !othIsNull);
    } else if (valIsSymbol) {
      setLow = othIsReflexive && othIsDefined && !othIsNull && (retHighest || !othIsSymbol);
    } else if (othIsNull || othIsSymbol) {
      setLow = false;
    } else {
      setLow = retHighest ? (computed <= value) : (computed < value);
    }
    if (setLow) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return Math.min(high, MAX_ARRAY_INDEX);
}
