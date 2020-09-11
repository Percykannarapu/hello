// tslint:disable:no-bitwise

import { isConvertibleToNumber, isFunction, isNil, isNull, isUndefined } from './type-checks';

/**
 * Splits an array into chunks of a maximum size
 * @param {T[] | U[]} arr: The original array to split
 * @param {number} chunkSize: The maximum size of each chunk in the output
 * @returns {(T[] | U[])[]}
 */
export function chunkArray<T, U>(arr: T[] | U[], chunkSize: number) : (T[] | U[])[] {
  const groups: (T[] | U[])[] = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    groups.push(arr.slice(i, i + chunkSize));
  }
  return groups;
}

/**
 * Groups an array by the contents of a field identified by its name
 * @param {T[]} items: The array to group
 * @param {K} fieldName: The name of the field to extract grouping info from
 * @param {(T) => R} valueSelector: Optional callback to transform each item before the final grouping
 * @returns {Map<T[K], (T | R)[]>}
 */
export function groupBy<T extends { [key: string] : any }, K extends keyof T, R>(items: T[] | ReadonlyArray<T>, fieldName: K) : Map<T[K], T[]>;
export function groupBy<T extends { [key: string] : any }, K extends keyof T, R>(items: T[] | ReadonlyArray<T>, fieldName: K, valueSelector: (item: T) => R) : Map<T[K], R[]>;
export function groupBy<T extends { [key: string] : any }, K extends keyof T, R>(items: T[] | ReadonlyArray<T>, fieldName: K, valueSelector?: (item: T) => R) : Map<T[K], (T | R)[]> {
  return groupByExtended(items, (i) => i[fieldName], valueSelector);
}

/**
 * Groups an array by the result of a keySelector function
 * @param {T[]} items: The array to group
 * @param {function} keySelector: A callback function that is used to generate the keys for the dictionary
 * @returns {Map<K, (T | R)[]>}
 */
export function groupByExtended<T, K, R>(items: T[] | ReadonlyArray<T>, keySelector: (item: T) => K) : Map<K, T[]>;
/**
 * Groups an array by the result of a keySelector function
 * @param {T[]} items: The array to group
 * @param {function} keySelector: A callback function that is used to generate the keys for the dictionary
 * @param {(T) => R} valueSelector: Optional callback to transform each item before the final grouping
 * @returns {Map<K, (T | R)[]>}
 */
export function groupByExtended<T, K, R>(items: T[] | ReadonlyArray<T>, keySelector: (item: T) => K, valueSelector: (item: T, index: number) => R) : Map<K, R[]>;
/**
 * Groups an array by the result of a keySelector function
 * @param {T[]} items: The array to group
 * @param {function} keySelector: A callback function that is used to generate the keys for the dictionary
 * @param {(T) => R} valueSelector: Optional callback to transform each item before the final grouping
 * @returns {Map<K, (T | R)[]>}
 */
export function groupByExtended<T, K, R>(items: T[] | ReadonlyArray<T>, keySelector: (item: T) => K, valueSelector?: (item: T, index: number) => R) : Map<K, (T | R)[]> {
  const result = new Map<K, (T | R)[]>();
  if (items == null || items.length === 0) return result;
  const tx: ((item: T, idx: number) => T | R) = valueSelector != null ? valueSelector : (i) => i;
  let idx = 0;
  for (const i of items) {
    const currentKey = keySelector(i);
    const currentValue = tx(i, idx++);
    if (result.has(currentKey)) {
      result.get(currentKey).push(currentValue);
    } else {
      result.set(currentKey, [currentValue]);
    }
  }
  return result;
}

/**
 * Groups an array by the result of a keySelector function
 * @param {T[]} items: The array to group
 * @param {function} keySelector: A callback function that is used to generate the keys for the dictionary
 * @param {(T) => R} valueSelector: Optional callback to transform each item before the final grouping
 */
export function groupToEntity<T, R>(items: T[] | ReadonlyArray<T>, keySelector: (item: T) => string) : { [key: string] : T[] };
export function groupToEntity<T, R>(items: T[] | ReadonlyArray<T>, keySelector: (item: T) => number) : { [key: number] : T[] };
export function groupToEntity<T, R>(items: T[] | ReadonlyArray<T>, keySelector: (item: T) => string, valueSelector: (item: T, index: number) => R) : { [key: string] : R[] };
export function groupToEntity<T, R>(items: T[] | ReadonlyArray<T>, keySelector: (item: T) => number, valueSelector: (item: T, index: number) => R) : { [key: number] : R[] };
export function groupToEntity<T, R>(items: T[] | ReadonlyArray<T>, keySelector: ((item: T) => string) | ((item: T) => number), valueSelector: (item: T, index: number) => T | R = (i) => i) : { [key: string] : (T | R)[] } | { [key: number] : (T | R)[] } {
  const result: { [k: string] : (T | R)[] } = {};
  if (items == null || items.length === 0) return result;
  let idx = 0;
  for (const i of items) {
    const currentKey = keySelector(i);
    if (result[currentKey] == null) {
      result[currentKey] = [valueSelector(i, idx++)];
    } else {
      result[currentKey].push(valueSelector(i, idx++));
    }
  }
  return result;
}

/**
 * Groups an array of entities into a map keyed by the properties found on those entities.
 *
 * @param {T[]} items: The array to group
 * @param {function} keySelector: Optional callback function used to transform or filter the entity properties as keys for the dictionary
 * @param {(T) => R} valueSelector: Optional callback to transform each item value before the final grouping
 * @returns {Map<string, (T | R)[]>}
 *
 * Example - Basic Array of entities as input:
 * -------------------------------------------
 * const geoVarArray  = [ {1016: '.08',  31068: '97.56', 31934: '109.31', 96063: '113.08', 151126: '143.9',  textvar: 'One',   geocode: '48152'},
 *                        {1016: '.12',  31068: '80.63', 31934: '101.16', 96063: '116.57', 151126: '173.4',  textvar: 'One',   geocode: '48154'},
 *                        {1016: '.45',  31068: '97.79', 31934:  '99.74', 96063: '151.13', 151126: '158.79', textvar: 'Two',   geocode: '48335'},
 *                        {1016: '.16',  31068: '92.04', 31934: '100.56', 96063: '142.65', 151126: '227.63', textvar: 'Two',   geocode: '48336'},
 *                        {1016: '3.14', 31068: '77.74', 31934: '102.33', 96063: '104.45', 151126: '149.15', textvar: 'Three', geocode: '48375'}];
 * const geoVarArray = [ {geocode: '48152', 31068: '1', 151126: '2', textvar: 'One'},
 *                       {geocode: '48375', 31068: '3', 151126: '4', textvar: 'Two'}];
 * const arrayMap: Map<string, any> = groupEntityToArray(geoVarArray);
 * arrayMap.forEach((value, key) => console.log(`m[${key}] = ${value}`));
 *
 * Example - An ngrx entity keyed by geocode as input:
 * ---------------------------------------------------
 * const geoVarEntity = { 48152: {geocode: '48152', 31068: '1', 151126: '2', textvar: 'One'},
 *                        48375: {geocode: '48375', 31068: '3', 151126: '4', textvar: 'Two'}};
 * const entityMap: Map<string, any> = groupEntityToArray(Object.keys(geoVarEntity).map(key => geoVarEntity[key]));  // In this case, convert entity into an array of objects
 * entityMap.forEach((value, key) => console.log(`m[${key}] = ${value}`));
 *
 * Both produce results:
 *    m[31068]   = 1,3
 *    m[151126]  = 2,4
 *    m[geocode] = 48152,48375
 *    m[textvar] = One,Two
 *
 * Example - An ngrx entity keyed by geocode as input and keys and values are transformed:
 * ---------------------------------------------------------------------------------------
 * const geoVarEntity = { 48152: {geocode: '48152', 31068: '1', 151126: '2', textvar: 'One'},
 *                        48375: {geocode: '48375', 31068: '3', 151126: '4', textvar: 'Two'}};
 *
 * const entityMap: Map<string, any> = groupEntityToArray(Object.keys(geoVarEntity).map(key => geoVarEntity[key]),
 *                                                       (key) => key !== 'geocode' ? 'namespace.' + key : null, // Omit 'geocode', add namespace to key
 *                                                       (value) => isNaN(value) ? value : value * 2);           // Double numeric values
 * entityMap.forEach((value, key) => console.log(`m[${key}] = ${value}`));
 *
 * Results:
 *    m[namespace.31068]   = 2,6
 *    m[namespace.151126]  = 4,8
 *    m[namespace.textvar] = One,Two
 */
export function groupEntityToArray<T, R>(items: T[] | ReadonlyArray<T>, keySelector?: (item: string) => string) : Map<string, R[]>;
export function groupEntityToArray<T, R>(items: T[] | ReadonlyArray<T>, keySelector?: (item: string) => string, valueSelector?: (item: T) => R) : Map<string, R[]>;
export function groupEntityToArray<T, R>(items: T[] | ReadonlyArray<T>, keySelector?: (item: string) => string, valueSelector?: (item: T) => R) : Map<string, R[]> {
  const result = new Map<string, R[]>();
  if (items == null || items.length === 0) return result;
  const tx: ((item: T) => R) = valueSelector != null ? valueSelector : (i) => (i as unknown) as R;
  for (const i of items) {
    for (const field of Object.keys(i)) {
      const currentKey = (keySelector == null) ? field : keySelector(field);
      if (currentKey == null)
        continue;
      const currentValue = tx(i[field]);
      if (result.has(currentKey))
        result.get(currentKey).push(currentValue);
      else
        result.set(currentKey, [currentValue]);
    }
  }
  return result;
}

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

/**
 * Converts Map<string | number, T> into an entity in the form of { [key: string | number] : T }
 */
export function mapToEntity<T>(sourceMap: Map<string, T>) : { [key: string] : T };
export function mapToEntity<T>(sourceMap: Map<number, T>) : { [key: number] : T };
export function mapToEntity<T>(sourceMap: Map<string | number, T>) : { [key: string] : T } | { [key: number] : T } {
  const result: { [k: string] : T } = {};
  sourceMap.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

/**
 * Maps an array by the contents of a field identified by its name
 * Note this method assumes that there will only be one instance for each key value
 * @param {T[]} items: The array to group
 * @param {K} fieldName: The name of the field to extract grouping info from
 * @param {(T) => R} valueSelector: Optional callback to transform each item before the final grouping
 * @returns {Map<T[K], T | R>}
 */
export function mapBy<T extends { [key: string] : any }, K extends keyof T, R>(items: T[] | ReadonlyArray<T>, fieldName: K) : Map<T[K], T>;
export function mapBy<T extends { [key: string] : any }, K extends keyof T, R>(items: T[] | ReadonlyArray<T>, fieldName: K, valueSelector: (item: T) => R) : Map<T[K], R>;
export function mapBy<T extends { [key: string] : any }, K extends keyof T, R>(items: T[] | ReadonlyArray<T>, fieldName: K, valueSelector?: (item: T) => R) : Map<T[K], T | R> {
  return mapByExtended(items, (i) => i[fieldName], valueSelector);
}

/**
 * Maps an array by the result of a keySelector function
 * Note this method assumes that there will only be one instance for each key value
 * @param {T[]} items: The array to group
 * @param {function} keySelector: A callback function that is used to generate the keys for the dictionary
 * @param {(T) => R} valueSelector: Optional callback to transform each item before the final grouping
 * @returns {Map<T[K], T | R>}
 */
export function mapByExtended<T, K, R>(items: T[] | ReadonlyArray<T>, keySelector: (item: T) => K) : Map<K, T>;
export function mapByExtended<T, K, R>(items: T[] | ReadonlyArray<T>, keySelector: (item: T) => K, valueSelector: (item: T) => R) : Map<K, R>;
export function mapByExtended<T, K, R>(items: T[] | ReadonlyArray<T>, keySelector: (item: T) => K, valueSelector?: (item: T) => R) : Map<K, T | R> {
  const result = new Map<K, T | R>();
  const tx: ((item: T) => T | R) = valueSelector != null ? valueSelector : (i) => i;
  if (items == null || items.length === 0) return result;
  items.forEach(i => {
    result.set(keySelector(i), tx(i));
  });
  return result;
}

/**
 * Maps an array by the result of a keySelector function
 * Note this method assumes that there will only be one instance for each key value
 * @param {T[]} items: The array to group
 * @param {function} keySelector: A callback function that is used to generate the keys for the dictionary
 * @param {(T) => R} valueSelector: Optional callback to transform each item before the final grouping
 */
export function mapArrayToEntity<T, R>(items: T[] | ReadonlyArray<T>, keySelector: (item: T) => string) : { [key: string] : T };
export function mapArrayToEntity<T, R>(items: T[] | ReadonlyArray<T>, keySelector: (item: T) => number) : { [key: number] : T };
export function mapArrayToEntity<T, R>(items: T[] | ReadonlyArray<T>, keySelector: (item: T) => string, valueSelector: (item: T) => R) : { [key: string] : R };
export function mapArrayToEntity<T, R>(items: T[] | ReadonlyArray<T>, keySelector: (item: T) => number, valueSelector: (item: T) => R) : { [key: number] : R };
export function mapArrayToEntity<T, R>(items: T[] | ReadonlyArray<T>, keySelector: ((item: T) => string) | ((item: T) => number), valueSelector: (item: T) => T | R = (i) => i) : { [key: string] : (T | R) } | { [key: number] : (T | R) } {
  const result: { [k: string] : (T | R) } = {};
  if (items == null || items.length === 0) return result;
  for (const i of items) {
    result[keySelector(i)] = valueSelector(i);
  }
  return result;
}

export function mergeArrayMaps<K, V>(newValues: Map<K, V[]>, accumulator: Map<K, V[]>) : void {
  newValues.forEach((v, k) => {
    let newItems = v;
    if (accumulator.has(k)) {
      newItems = [...accumulator.get(k), ...v];
    }
    accumulator.set(k, newItems);
  });
}

/**
 * A helper function to allow succinct array accumulation without the need for spread syntax, which can error out with very large arrays.
 * @param accumulator - The accumulator. If null, will be initialized with an empty array.
 * @param currentData - The current array to concat into the accumulator. If null, will be ignored, and accumulator will simply pass through.
 * @param eliminateNulls - Remove nulls and undefined values before accumulating (optional, defaults to true)
 * @param allocateNewAccumulator - Allocate a new array reference for the accumulator (optional, defaults to false)
 */
export function accumulateArrays<T>(accumulator: T[], currentData: T[], eliminateNulls: boolean = true, allocateNewAccumulator: boolean = false) : T[] {
  const newAccumulator: T[] = allocateNewAccumulator ? Array.from(accumulator || []) : accumulator || [];
  if (currentData != null && currentData.length > 0) {
    for (let i = 0; i < currentData.length; ++i) {
      if (!eliminateNulls || currentData[i] != null) newAccumulator.push(currentData[i]);
    }
  }
  return newAccumulator;
}

/**
 * Flattens a two dimensional array. Use completeFlatten() for an 3+ or arbitrary dimensional array
 * @param {T[][]} items
 * @returns {T[]}
 */
export function simpleFlatten<T>(items: T[][]) : T[] {
  return items.reduce((p, c) => p.concat(c), []);
}

/**
 * Flattens any arbitrarily-deep nested array structure. Use simpleFlatten() for a more performant solution to 2-dimensional arrays.
 * @param {T[]} items
 * @returns {T[]}
 */
export function completeFlatten<T>(items: any[]) : T[] {
  const arr = Array.from(items);
  let i = 0;
  while (i < arr.length) {
    if (Array.isArray(arr[i])) {
      arr.splice(i, 1, ...arr[i]);
    } else {
      i++;
    }
  }
  return arr;
}

/**
 * A filtering callback to be used in conjunction with array.filter() to allow a search for a value in one or more fields
 * @param searchTerm - The string to find
 * @param fieldsToSearch - An array of field names to search
 */
export function filterByFields<T, K extends keyof T>(searchTerm: string, fieldsToSearch: K[]) : (value: T, index: number, array: T[]) => boolean {
  return (value: T, index: number, array: T[]) => {
    for (const fieldName of fieldsToSearch) {
      const match = value[fieldName] != null ? value[fieldName].toString().toLowerCase().includes(searchTerm.toLowerCase()) : false;
      if (match) return true; // break out early if we find a match
    }
    return false; // no matches were found
  };
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
export function formatMilli(a, k?, sub?, s?, m?, h?, e?){
  return k = Math.trunc(a % 1e3), sub = Math.floor((a % 1e3 - k) * 1000) / 1000, s = a / 1e3 % 60 | 0, e = (s + k / 1000 + '').length, m = a / 6e4 % 60 | 0, h = a / 36e5 % 24 | 0,
    (h ? h + 'h ' : '') +
    (m ? m + 'm' : '') +
    (h || m || s >= 10 ? (s != 0 ? (m ? ' ' : '') + s + 's' : '') : (s >= 1 ? (e <= 5 ? s + k / 1000 : (s + k / 1000).toFixed(3)) + 's' : '')) +
    (!h && !m && s == 0 && k >= 1 ? (k / 1000) + 's' : '') +
    (!h && !m && !s && !k ? sub + 'ms' : '');
}

export function dedupeSimpleSet<T>(newValues: Set<T>, previousValues: Set<T>) : Set<T> {
  const result = new Set<T>();
  newValues.forEach(nv => {
    if (!previousValues.has(nv)) result.add(nv);
  });
  return result;
}

export const safe: any = { fieldname: ''};

// Produce a unique UUID, good for use as correlation IDs in NgRx actions/effects
export function getUuid() : string {
  // @ts-ignore
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

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

function HSBtoRGB(hsb: { h: number, s: number, b: number }) {
  let rgb = {
    r: null, g: null, b: null
  };
  let h: number = hsb.h;
  const s: number = hsb.s * 255 / 100;
  const v: number = hsb.b * 255 / 100;
  if (s == 0) {
    rgb = {
      r: v,
      g: v,
      b: v
    };
  }
  else {
    const t1: number = v;
    const t2: number = (255 - s) * v / 255;
    const t3: number = (t1 - t2) * (h % 60) / 60;
    if (h == 360) h = 0;
    if (h < 60) {rgb.r = t1;	rgb.b = t2; rgb.g = t2 + t3; }
    else if (h < 120) {rgb.g = t1; rgb.b = t2;	rgb.r = t1 - t3; }
    else if (h < 180) {rgb.g = t1; rgb.r = t2;	rgb.b = t2 + t3; }
    else if (h < 240) {rgb.b = t1; rgb.r = t2;	rgb.g = t1 - t3; }
    else if (h < 300) {rgb.b = t1; rgb.g = t2;	rgb.r = t2 + t3; }
    else if (h < 360) {rgb.r = t1; rgb.g = t2;	rgb.b = t1 - t3; }
    else {rgb.r = 0; rgb.g = 0;	rgb.b = 0; }
  }
  return [Math.round(rgb.r), Math.round(rgb.g), Math.round(rgb.b)];
}

export function hsbToHex(hsb, withAlpha: boolean = true) {
  return rgbToHex(HSBtoRGB(hsb));
}

export function rgbToHex(color: number[], withAlpha: boolean = true) : string {
  const red = pad(Number(color[0]).toString(16), 2);
  const green = pad(Number(color[1]).toString(16), 2);
  const blue = pad(Number(color[2]).toString(16), 2);
  //const alpha = color.length > 3 ? pad(Number(color[3]).toString(16), 2) : 'FF';
  const hexColor = `#${red}${green}${blue}`;
  return withAlpha ? `${hexColor}ff` : hexColor;
}

/**
 * Converts and array of T into a Set<T> in the most performant way possible.
 * Optional parameters allow you to filter the items or map them to another type <R>
 * @param items
 */
export function arrayToSet<T>(items: T[] | ReadonlyArray<T>) : Set<T>;
export function arrayToSet<T>(items: T[] | ReadonlyArray<T>, filter?: (item: T) => boolean) : Set<T>;
export function arrayToSet<T, R>(items: T[] | ReadonlyArray<T>, filter?: (item: T) => boolean, valueSelector?: (item: T) => R) : Set<T | R> {
  if (isUndefined(items)) return undefined;
  if (isNull(items)) return null;
  const result = new Set<T | R>();
  const len = items.length;
  const effectiveFilter = filter || (() => true);
  const effectiveSelector = valueSelector || ((i) => i);
  for (let i = 0; i < len; ++i) {
    const currentItem = items[i];
    if (effectiveFilter(currentItem)) result.add(effectiveSelector(currentItem));
  }
  return result;
}

/**
 * Converts a value to a number if it is parsable as a number, otherwise returns null
 * @param value - the value to convert
 */
export function toNullOrNumber(value: any) : number | null {
  if (!isNil(value) && isConvertibleToNumber(value)) return Number(value);
  return null;
}
