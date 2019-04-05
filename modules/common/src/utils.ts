// fixes Array.isArray not typing a readonly array as an array

declare global {
  interface ArrayConstructor {
    isArray(arg: any) : arg is ReadonlyArray<any>;
  }
}

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
 * @param {(T) => R} valueSelector: Optional callback to transform each item before the final grouping
 * @returns {Map<K, (T | R)[]>}
 */
export function groupByExtended<T, K, R>(items: T[] | ReadonlyArray<T>, keySelector: (item: T) => K) : Map<K, T[]>;
export function groupByExtended<T, K, R>(items: T[] | ReadonlyArray<T>, keySelector: (item: T) => K, valueSelector: (item: T) => R) : Map<K, R[]>;
export function groupByExtended<T, K, R>(items: T[] | ReadonlyArray<T>, keySelector: (item: T) => K, valueSelector?: (item: T) => R) : Map<K, (T | R)[]> {
  const result = new Map<K, (T | R)[]>();
  if (items == null || items.length === 0) return result;
  const tx: ((item: T) => T | R) = valueSelector != null ? valueSelector : (i) => i;
  for (const i of items) {
    const currentKey = keySelector(i);
    const currentValue = tx(i);
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
export function groupToEntity<T, R>(items: T[] | ReadonlyArray<T>, keySelector: (item: T) => string, valueSelector: (item: T) => R) : { [key: string] : R[] };
export function groupToEntity<T, R>(items: T[] | ReadonlyArray<T>, keySelector: (item: T) => number, valueSelector: (item: T) => R) : { [key: number] : R[] };
export function groupToEntity<T, R>(items: T[] | ReadonlyArray<T>, keySelector: ((item: T) => string) | ((item: T) => number), valueSelector: (item: T) => T | R = (i) => i) : { [key: string] : (T | R)[] } | { [key: number] : (T | R)[] } {
  const result: { [k: string] : (T | R)[] } = {};
  if (items == null || items.length === 0) return result;
  for (const i of items) {
    const currentKey = keySelector(i);
    if (result[currentKey] == null) {
      result[currentKey] = [valueSelector(i)];
    } else {
      result[currentKey].push(valueSelector(i));
    }
  }
  return result;
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
export function mapBy<T extends { [key: string] : any }, K extends keyof T, R>(items: T[], fieldName: K) : Map<T[K], T>;
export function mapBy<T extends { [key: string] : any }, K extends keyof T, R>(items: T[], fieldName: K, valueSelector: (item: T) => R) : Map<T[K], R>;
export function mapBy<T extends { [key: string] : any }, K extends keyof T, R>(items: T[], fieldName: K, valueSelector?: (item: T) => R) : Map<T[K], T | R> {
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
export function mapByExtended<T, K, R>(items: T[], keySelector: (item: T) => K) : Map<K, T>;
export function mapByExtended<T, K, R>(items: T[], keySelector: (item: T) => K, valueSelector: (item: T) => R) : Map<K, R>;
export function mapByExtended<T, K, R>(items: T[], keySelector: (item: T) => K, valueSelector?: (item: T) => R) : Map<K, T | R> {
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

export function isFunction (obj: any) : obj is Function {
  return (obj && obj.constructor && obj.call && obj.apply);
}

export function isNumber(value: any) : value is number {
  return value != null && value !== '' && !Number.isNaN(Number(value));
}

/**
 *  Formats millisecond input into h:m:s.nnn
 *
 *  Usage:
 *    let startTime = performance.now();
 *    ...
 *    let endTime = performance.now();
 *    console.log("Process took", formatMilli(endTime - startTime));
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
export function formatMilli(a,k?,sub?,s?,m?,h?,e?){
  return k=Math.trunc(a%1e3), sub=Math.floor((a%1e3-k)*1000)/1000, s=a/1e3%60|0, e=(s+k/1000+"").length, m=a/6e4%60|0, h=a/36e5%24|0,
    (h?h+'h ':'')+
    (m?m+'m':'')+
    (h || m || s >= 10 ? (s != 0 ? (m?' ':'')+s+'s':''): (s >= 1 ? (e <= 5 ? s+k/1000 : (s+k/1000).toFixed(3)) + 's' : '')) +
    (!h && !m && s == 0 && k >= 1 ? (k/1000) + 's' : '') +
    (!h && !m && !s && !k ? sub + 'ms' : '');
}

export function dedupeSimpleSet<T>(newValues: Set<T>, previousValues: Set<T>) : Set<T> {
  return new Set(Array.from(newValues).filter(v => !previousValues.has(v)));
}
