import { isEmpty } from './type-checks';

type AnyArray<T> = T[] | ReadonlyArray<T>;

/**
 * Splits an array into chunks of a maximum size
 * @param {T[] | U[]} arr: The original array to split
 * @param {number} chunkSize: The maximum size of each chunk in the output
 * @returns {(T[] | U[])[]}
 */
export function chunkArray<T, U>(arr: T[] | U[], chunkSize: number) : (T[] | U[])[] {
  const groups: (T[] | U[])[] = [];
  const len = arr.length;
  for (let i = 0; i < len; i += chunkSize) {
    groups.push(arr.slice(i, i + chunkSize));
  }
  return groups;
}

/**
 * Groups an array by the contents of a field identified by its name
 * @param {T[]} items: The array to group
 * @param {K} fieldName: The name of the field to extract grouping info from
 * @returns {Map<T[K], (T | R)[]>}
 */
export function groupBy<T extends { [key: string] : any }, K extends keyof T, R>(items: AnyArray<T>, fieldName: K) : Map<T[K], T[]>;
/**
 * Groups an array by the contents of a field identified by its name
 * @param {T[]} items: The array to group
 * @param {K} fieldName: The name of the field to extract grouping info from
 * @param {(T) => R} valueSelector: Optional callback to transform each item before the final grouping
 * @returns {Map<T[K], (T | R)[]>}
 */
export function groupBy<T extends { [key: string] : any }, K extends keyof T, R>(items: AnyArray<T>, fieldName: K, valueSelector: (item: T) => R) : Map<T[K], R[]>;
export function groupBy<T extends { [key: string] : any }, K extends keyof T, R>(items: AnyArray<T>, fieldName: K, valueSelector?: (item: T) => R) : Map<T[K], (T | R)[]> {
  return groupByExtended(items, (i) => i[fieldName], valueSelector);
}

/**
 * Groups an array by the result of a keySelector function
 * @param {T[]} items: The array to group
 * @param {function} keySelector: A callback function that is used to generate the keys for the dictionary
 * @returns {Map<K, (T | R)[]>}
 */
export function groupByExtended<T, K, R>(items: AnyArray<T>, keySelector: (item: T) => K) : Map<K, T[]>;
/**
 * Groups an array by the result of a keySelector function
 * @param {T[]} items: The array to group
 * @param {function} keySelector: A callback function that is used to generate the keys for the dictionary
 * @param {(T) => R} valueSelector: Optional callback to transform each item before the final grouping
 * @returns {Map<K, (T | R)[]>}
 */
export function groupByExtended<T, K, R>(items: AnyArray<T>, keySelector: (item: T) => K, valueSelector: (item: T) => R) : Map<K, R[]>;
export function groupByExtended<T, K, R>(items: AnyArray<T>, keySelector: (item: T) => K, valueSelector?: (item: T) => R) : Map<K, (T | R)[]> {
  const result = new Map<K, (T | R)[]>();
  if (isEmpty(items)) return result;
  for (const i of items) {
    const currentKey = keySelector(i);
    const currentValue = valueSelector?.(i) ?? i;
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
 */
export function groupToEntity<T>(items: AnyArray<T>, keySelector: (item: T) => string) : { [key: string] : T[] };
/**
 * Groups an array by the result of a keySelector function
 * @param {T[]} items: The array to group
 * @param {function} keySelector: A callback function that is used to generate the keys for the dictionary
 */
export function groupToEntity<T>(items: AnyArray<T>, keySelector: (item: T) => number) : { [key: number] : T[] };
/**
 * Groups an array by the result of a keySelector function
 * @param {T[]} items: The array to group
 * @param {function} keySelector: A callback function that is used to generate the keys for the dictionary
 * @param {(T) => R} valueSelector: Optional callback to transform each item before the final grouping
 */
export function groupToEntity<T, R>(items: AnyArray<T>, keySelector: (item: T) => string, valueSelector: (item: T) => R) : { [key: string] : R[] };
/**
 * Groups an array by the result of a keySelector function
 * @param {T[]} items: The array to group
 * @param {function} keySelector: A callback function that is used to generate the keys for the dictionary
 * @param {(T) => R} valueSelector: Optional callback to transform each item before the final grouping
 */
export function groupToEntity<T, R>(items: AnyArray<T>, keySelector: (item: T) => number, valueSelector: (item: T) => R) : { [key: number] : R[] };
export function groupToEntity<T, R>(items: AnyArray<T>, keySelector: ((item: T) => string) | ((item: T) => number), valueSelector?: (item: T) => T | R) : { [key: string] : (T | R)[] } | { [key: number] : (T | R)[] } {
  const result: { [k: string] : (T | R)[] } = {};
  if (isEmpty(items)) return result;
  for (const i of items) {
    const currentKey = keySelector(i);
    if (result[currentKey] == null) result[currentKey] = [];
    result[currentKey].push(valueSelector?.(i) ?? i);
  }
  return result;
}

/**
 * Groups an array of entities into a map keyed by the properties found on those entities.
 *
 * @param {T[]} items: The array to group
 * @param {function} keySelector: Optional callback function used to transform or filter the entity properties as keys for the dictionary
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
export function groupEntityToArray<T, R>(items: AnyArray<T>, keySelector?: (item: string) => string) : Map<string, R[]>;
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
export function groupEntityToArray<T, R>(items: AnyArray<T>, keySelector?: (item: string) => string, valueSelector?: (item: T) => R) : Map<string, R[]>;
export function groupEntityToArray<T, R>(items: AnyArray<T>, keySelector?: (item: string) => string, valueSelector?: (item: T) => R) : Map<string, R[]> {
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

/**
 * Maps an array by the contents of a field identified by its name
 * Note this method assumes that there will only be one instance for each key value
 * @param {T[]} items: The array to group
 * @param {K} fieldName: The name of the field to extract grouping info from
 */
export function mapBy<T extends { [key: string] : any }, K extends keyof T, R>(items: AnyArray<T>, fieldName: K) : Map<T[K], T>;
/**
 * Maps an array by the contents of a field identified by its name
 * Note this method assumes that there will only be one instance for each key value
 * @param {T[]} items: The array to group
 * @param {K} fieldName: The name of the field to extract grouping info from
 * @param {(T) => R} valueSelector: Optional callback to transform each item before the final grouping
 */
export function mapBy<T extends { [key: string] : any }, K extends keyof T, R>(items: AnyArray<T>, fieldName: K, valueSelector: (item: T) => R) : Map<T[K], R>;
export function mapBy<T extends { [key: string] : any }, K extends keyof T, R>(items: AnyArray<T>, fieldName: K, valueSelector?: (item: T) => R) : Map<T[K], T | R> {
  return mapByExtended(items, (i) => i[fieldName], valueSelector);
}

/**
 * Maps an array by the result of a keySelector function
 * Note this method assumes that there will only be one instance for each key value
 * @param {T[]} items: The array to group
 * @param {function} keySelector: A callback function that is used to generate the keys for the dictionary
 */
export function mapByExtended<T, K, R>(items: AnyArray<T>, keySelector: (item: T) => K) : Map<K, T>;
/**
 * Maps an array by the result of a keySelector function
 * Note this method assumes that there will only be one instance for each key value
 * @param {T[]} items: The array to group
 * @param {function} keySelector: A callback function that is used to generate the keys for the dictionary
 * @param {(T) => R} valueSelector: Optional callback to transform each item before the final grouping
 */
export function mapByExtended<T, K, R>(items: AnyArray<T>, keySelector: (item: T) => K, valueSelector: (item: T) => R) : Map<K, R>;
export function mapByExtended<T, K, R>(items: AnyArray<T>, keySelector: (item: T) => K, valueSelector?: (item: T) => R) : Map<K, T | R> {
  const result = new Map<K, T | R>();
  if (isEmpty(items)) return result;
  items.forEach(i => {
    result.set(keySelector(i), valueSelector?.(i) ?? i);
  });
  return result;
}

/**
 * Maps an array by the result of a keySelector function
 * Note this method assumes that there will only be one instance for each key value
 * @param {T[]} items: The array to group
 * @param {function} keySelector: A callback function that is used to generate the keys for the dictionary
 */
export function mapArrayToEntity<T, R>(items: AnyArray<T>, keySelector: (item: T) => string) : { [key: string] : T };
/**
 * Maps an array by the result of a keySelector function
 * Note this method assumes that there will only be one instance for each key value
 * @param {T[]} items: The array to group
 * @param {function} keySelector: A callback function that is used to generate the keys for the dictionary
 */
export function mapArrayToEntity<T, R>(items: AnyArray<T>, keySelector: (item: T) => number) : { [key: number] : T };
/**
 * Maps an array by the result of a keySelector function
 * Note this method assumes that there will only be one instance for each key value
 * @param {T[]} items: The array to group
 * @param {function} keySelector: A callback function that is used to generate the keys for the dictionary
 * @param {(T) => R} valueSelector: Optional callback to transform each item before the final grouping
 */
export function mapArrayToEntity<T, R>(items: AnyArray<T>, keySelector: (item: T) => string, valueSelector: (item: T) => R) : { [key: string] : R };
/**
 * Maps an array by the result of a keySelector function
 * Note this method assumes that there will only be one instance for each key value
 * @param {T[]} items: The array to group
 * @param {function} keySelector: A callback function that is used to generate the keys for the dictionary
 * @param {(T) => R} valueSelector: Optional callback to transform each item before the final grouping
 */
export function mapArrayToEntity<T, R>(items: AnyArray<T>, keySelector: (item: T) => number, valueSelector: (item: T) => R) : { [key: number] : R };
export function mapArrayToEntity<T, R>(items: AnyArray<T>, keySelector: ((item: T) => string) | ((item: T) => number), valueSelector?: (item: T) => T | R) : { [key: string] : (T | R) } | { [key: number] : (T | R) } {
  const result: { [k: string] : (T | R) } = {};
  if (isEmpty(items)) return result;
  for (const i of items) {
    result[keySelector(i)] = valueSelector?.(i) ?? i;
  }
  return result;
}

/**
 * Merges two array maps together based on matching keys. The accumulator map is mutated.
 * @param newValues
 * @param accumulator
 */
export function mergeArrayMaps<K, V>(newValues: Map<K, V[]>, accumulator: Map<K, V[]>) : void {
  newValues.forEach((v, k) => {
    let newItems = v;
    if (accumulator.has(k)) {
      newItems = accumulator.get(k).concat(v);
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
export function accumulateArrays<T>(accumulator: T[], currentData: AnyArray<T>, eliminateNulls: boolean = true, allocateNewAccumulator: boolean = false) : T[] {
  const newAccumulator: T[] = allocateNewAccumulator ? Array.from(accumulator ?? []) : accumulator ?? [];
  if (!isEmpty(currentData)) {
    const len = currentData.length;
    for (let i = 0; i < len; ++i) {
      if (!eliminateNulls || currentData[i] != null) newAccumulator.push(currentData[i]);
    }
  }
  return newAccumulator;
}

/**
 * Flattens a two dimensional array. Use completeFlatten() for an 3+ or arbitrary dimensional array
 * @param {T[][]} items
 */
export function simpleFlatten<T>(items: T[][]) : T[] {
  return items.flat();
}

/**
 * A filtering callback to be used in conjunction with array.filter() to allow a search for a value in one or more fields
 * @param searchTerm - The string to find
 * @param fieldsToSearch - An array of field names to search
 */
export function filterByFields<T, K extends keyof T>(searchTerm: string, fieldsToSearch: K[]) : (value: T, index: number, array: T[]) => boolean {
  return (value: T) => {
    for (const fieldName of fieldsToSearch) {
      if (`${value?.[fieldName]}`.toLowerCase().includes(searchTerm?.toLowerCase())) return true; // break out early if we find a match
    }
    return false; // no matches were found
  };
}

/**
 * Converts an array or readonly array of T into a Set<T> in the most performant way possible.
 * @param {T[]} items: The array to transform
 */
export function arrayToSet<T>(items: AnyArray<T>) : Set<T>;
/**
 * Converts an array or readonly array of T into a Set<T> in the most performant way possible.
 * @param {T[]} items: The array to transform
 * @param {(T) => boolean} filter: A callback function that is used to filter the array items from the final set
 */
export function arrayToSet<T>(items: AnyArray<T>, filter: (item: T) => boolean) : Set<T>;
/**
 * Converts an array or readonly array of T into a Set<R> in the most performant way possible.
 * @param {T[]} items: The array to transform
 * @param {(T) => boolean} filter: A callback function that is used to filter the array items from the final set
 * @param {(T) => R} valueSelector: A callback function to transform each item as it's inserted into the final set
 */
export function arrayToSet<T, R>(items: AnyArray<T>, filter: (item: T) => boolean, valueSelector: (item: T) => R) : Set<R>;
export function arrayToSet<T, R>(items: AnyArray<T>, filter?: (item: T) => boolean, valueSelector?: (item: T) => R) : Set<T | R> {
  const result = new Set<T | R>();
  if (isEmpty(items)) return result;
  const len = items.length;
  for (let i = 0; i < len; ++i) {
    const currentItem = items[i];
    if (filter?.(currentItem) ?? true) result.add(valueSelector?.(currentItem) ?? currentItem);
  }
  return result;
}
