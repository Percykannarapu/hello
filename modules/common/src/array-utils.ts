import { KeyedSet } from './keyed-set';
import { isEmpty, isNil, isNotNil } from './type-checks';

type AnyArray<T> = T[] | ReadonlyArray<T>;

/**
 * Splits an array into chunks of a maximum size
 * @param {T[]} items The original array to split
 * @param {number} chunkSize The maximum size of each chunk in the output
 * @returns {T[][]}
 * @template T
 */
export function chunkArray<T>(items: AnyArray<T>, chunkSize: number) : T[][] {
  const groups: T[][] = [];
  const len = items.length;
  for (let i = 0; i < len; i += chunkSize) {
    groups.push(items.slice(i, i + chunkSize));
  }
  return groups;
}

/**
 * Groups an array by the contents of a field identified by its name
 * @param {T[]} items The array to group
 * @param {K} fieldName The name of the field to extract grouping info from
 * @returns {Map<T[K], T[]>}
 * @template T, K
 */
export function groupBy<T extends { [key: string] : any }, K extends keyof T, R>(items: AnyArray<T>, fieldName: K) : Map<T[K], T[]>;
/**
 * Groups an array by the contents of a field identified by its name
 * @param {T[]} items: The array to group
 * @param {K} fieldName: The name of the field to extract grouping info from
 * @param {(T) => R} valueSelector: Optional callback to transform each item before the final grouping
 * @returns {Map<T[K], R[]>}
 * @template T, K, R
 */
export function groupBy<T extends { [key: string] : any }, K extends keyof T, R>(items: AnyArray<T>, fieldName: K, valueSelector: (item: T) => R) : Map<T[K], R[]>;
export function groupBy<T extends { [key: string] : any }, K extends keyof T, R>(items: AnyArray<T>, fieldName: K, valueSelector?: (item: T) => R) : Map<T[K], (T | R)[]> {
  return groupByExtended(items, (i) => i[fieldName], valueSelector);
}

/**
 * Groups an array by the result of a keySelector function
 * @param {T[]} items The array to group
 * @param {(T) => K} keySelector A callback function that is used to generate the keys for the dictionary
 * @returns {Map<K, T[]>}
 * @template T, K
 */
export function groupByExtended<T, K, R>(items: AnyArray<T>, keySelector: (item: T) => K) : Map<K, T[]>;
/**
 * Groups an array by the result of a keySelector function
 * @param {T[]} items: The array to group
 * @param {(T) => K} keySelector: A callback function that is used to generate the keys for the dictionary
 * @param {(T) => R} valueSelector: Optional callback to transform each item before the final grouping
 * @returns {Map<K, R[]>}
 * @template T, K, R
 */
export function groupByExtended<T, K, R>(items: AnyArray<T>, keySelector: (item: T) => K, valueSelector: (item: T) => R) : Map<K, R[]>;
/**
 * Groups an array by the result of a keySelector function with a filter applied to the results
 * @param {T[]} items The array to group
 * @param {(T) => K} keySelector A callback function that is used to generate the keys for the dictionary
 * @param {(T) => R} valueSelector Optional callback to transform each item before the final grouping
 * @param {(T) => boolean} filter Optional callback to determine if the item should be presented in the final grouping
 * @returns {Map<K, R[]>}
 * @template T, K, R
 */
export function groupByExtended<T, K, R>(items: AnyArray<T>, keySelector: (item: T) => K, valueSelector: (item: T) => R, filter: (item: T) => boolean) : Map<K, R[]>;
export function groupByExtended<T, K, R>(items: AnyArray<T>, keySelector: (item: T) => K, valueSelector?: (item: T) => R, filter?: (item: T) => boolean) : Map<K, (T | R)[]> {
  const canonicalKeys = new Map<string, K>();
  const result = new Map<K, (T | R)[]>();
  if (isEmpty(items)) return result;
  for (const i of items) {
    const isAllowed = filter?.(i) ?? true;
    if (isAllowed) {
      const canonicalKey = keySelector(i);
      const exemplarKey = JSON.stringify(canonicalKey);
      if (!canonicalKeys.has(exemplarKey)) canonicalKeys.set(exemplarKey, canonicalKey);
      const currentKey = canonicalKeys.get(exemplarKey);
      const currentValue = valueSelector?.(i) ?? i;
      if (result.has(currentKey)) {
        result.get(currentKey).push(currentValue);
      } else {
        result.set(currentKey, [currentValue]);
      }
    }
  }
  return result;
}

/**
 * Groups an array by the result of a keySelector function
 * @param {T[]} items The array to group
 * @param {(T) => string} keySelector A callback function that is used to generate the keys for the dictionary
 * @returns {Object.<string, T[]>}
 * @template T
 */
export function groupToEntity<T>(items: AnyArray<T>, keySelector: (item: T) => string) : { [key: string] : T[] };
/**
 * Groups an array by the result of a keySelector function
 * @param {T[]} items The array to group
 * @param {(T) => number} keySelector A callback function that is used to generate the keys for the dictionary
 * @returns {Object.<number, T[]>}
 * @template T
 */
export function groupToEntity<T>(items: AnyArray<T>, keySelector: (item: T) => number) : { [key: number] : T[] };
/**
 * Groups an array by the result of a keySelector function
 * @param {T[]} items The array to group
 * @param {(T) => string} keySelector A callback function that is used to generate the keys for the dictionary
 * @param {(T) => R} valueSelector Optional callback to transform each item before the final grouping
 * @returns {Object.<string, R[]>}
 * @template T, R
 */
export function groupToEntity<T, R>(items: AnyArray<T>, keySelector: (item: T) => string, valueSelector: (item: T) => R) : { [key: string] : R[] };
/**
 * Groups an array by the result of a keySelector function
 * @param {T[]} items The array to group
 * @param {(T) => number} keySelector A callback function that is used to generate the keys for the dictionary
 * @param {(T) => R} valueSelector Optional callback to transform each item before the final grouping
 * @returns {Object.<number, R[]>}
 * @template T, R
 */
export function groupToEntity<T, R>(items: AnyArray<T>, keySelector: (item: T) => number, valueSelector: (item: T) => R) : { [key: number] : R[] };
export function groupToEntity<T, R>(items: AnyArray<T>, keySelector: ((item: T) => string) | ((item: T) => number), valueSelector?: (item: T) => T | R) : { [key: string] : (T | R)[] } | { [key: number] : (T | R)[] } {
  const result: { [k: string] : (T | R)[] } = {};
  if (isEmpty(items)) return result;
  for (const i of items) {
    const currentKey = keySelector(i);
    if (isNil(result[currentKey])) result[currentKey] = [];
    result[currentKey].push(valueSelector?.(i) ?? i);
  }
  return result;
}

/**
 * Maps an array by the contents of a field identified by its name.
 * Note this method assumes that there will only be one instance of T per key value.
 * @param {T[]} items The array to group
 * @param {K} fieldName The name of the field to extract grouping info from
 * @returns {Map<T[K], T>}
 * @template T, K
 */
export function mapBy<T extends { [key: string] : any }, K extends keyof T, R>(items: AnyArray<T>, fieldName: K) : Map<T[K], T>;
/**
 * Maps an array by the contents of a field identified by its name.
 * Note this method assumes that there will only be one instance of T per key value.
 * @param {T[]} items The array to group
 * @param {K} fieldName The name of the field to extract grouping info from
 * @param {(T) => R} valueSelector A callback to transform each item before the final grouping
 * @returns {Map<T[K], R>}
 * @template T, K, R
 */
export function mapBy<T extends { [key: string] : any }, K extends keyof T, R>(items: AnyArray<T>, fieldName: K, valueSelector: (item: T) => R) : Map<T[K], R>;
export function mapBy<T extends { [key: string] : any }, K extends keyof T, R>(items: AnyArray<T>, fieldName: K, valueSelector?: (item: T) => R) : Map<T[K], T | R> {
  return mapByExtended(items, (i) => i[fieldName], valueSelector);
}

/**
 * Maps an array by the result of a keySelector function.
 * Note this method assumes that there will only be one instance of T per key value.
 * @param {T[]} items The array to group
 * @param {(T) => K} keySelector A callback function that is used to generate the keys for the dictionary
 * @returns {Map<K, T>}
 * @template T, K
 */
export function mapByExtended<T, K, R>(items: AnyArray<T>, keySelector: (item: T) => K) : Map<K, T>;
/**
 * Maps an array by the result of a keySelector function.
 * Note this method assumes that there will only be one instance of T per key value.
 * @param {T[]} items The array to group
 * @param {(T) => K} keySelector A callback function that is used to generate the keys for the dictionary
 * @param {(T) => R} valueSelector Optional callback to transform each item before the final grouping
 * @returns {Map<K, R>}
 * @template T, K, R
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
 * Maps an array to a dictionary by the result of a keySelector function.
 * Note this method assumes that there will only be one instance of T per key value.
 * @param {T[]} items The array to group
 * @param {(T) => string} keySelector A callback function that is used to generate the keys for the dictionary
 * @returns {Object<string, T>}
 * @template T
 */
export function mapArrayToEntity<T>(items: AnyArray<T>, keySelector: (item: T) => string) : { [key: string] : T };
/**
 * Maps an array to a dictionary by the result of a keySelector function.
 * Note this method assumes that there will only be one instance of T per key value.
 * @param {T[]} items The array to group
 * @param {(T) => number} keySelector A callback function that is used to generate the keys for the dictionary
 * @returns {Object<number, T>}
 * @template T
 */
export function mapArrayToEntity<T>(items: AnyArray<T>, keySelector: (item: T) => number) : { [key: number] : T };
/**
 * Maps an array to a dictionary by the result of a keySelector function.
 * Note this method assumes that there will only be one instance of T per key value.
 * @param {T[]} items The array to group
 * @param {(T) => string} keySelector A callback function that is used to generate the keys for the dictionary
 * @param {(T) => R} valueSelector Optional callback to transform each item before the final grouping
 * @returns {Object<string, R>}
 * @template T, R
 */
export function mapArrayToEntity<T, R>(items: AnyArray<T>, keySelector: (item: T) => string, valueSelector: (item: T) => R) : { [key: string] : R };
/**
 * Maps an array to a dictionary by the result of a keySelector function.
 * Note this method assumes that there will only be one instance of T per key value.
 * @param {T[]} items The array to group
 * @param {(T) => number} keySelector A callback function that is used to generate the keys for the dictionary
 * @param {(T) => R} valueSelector Optional callback to transform each item before the final grouping
 * @returns {Object<number, R>}
 * @template T, R
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
 * Merges two array maps together based on matching keys via array concatenation.
 * @param {Map<K, T[]>} newValues The new values to merge into the accumulator.
 * @param {Map<K, T[]>} accumulator The final result. This value gets mutated by the function.
 * @returns {void}
 * @template K, T
 */
export function mergeArrayMaps<K, T>(newValues: Map<K, AnyArray<T>>, accumulator: Map<K, T[]>) : void {
  newValues.forEach((v, k) => {
    let newItems = Array.from(v);
    if (accumulator.has(k)) {
      newItems = accumulator.get(k).concat(v);
    }
    accumulator.set(k, newItems);
  });
}

/**
 * A helper function to allow succinct array accumulation without the need for spread syntax, which can error out with very large arrays.
 * @param {T[]} accumulator The accumulator. If null, will be initialized with an empty array. May be mutated, based on other parameter values.
 * @param {T[]} currentData The current array to concat into the accumulator. If null, will be ignored, and accumulator will simply pass through.
 * @param {boolean} eliminateNulls Remove nulls and undefined values from the currentData array before accumulating (optional, defaults to true)
 * @param {boolean} allocateNewAccumulator Allocate a new array reference for the accumulator (optional, defaults to false)
 * @returns {T[]} The accumulator, which may or may not be the same instance as the accumulator passed in, based on the allocateNewAccumulator flag
 * @template T
 */
export function accumulateArrays<T>(accumulator: T[], currentData: AnyArray<T>, eliminateNulls: boolean = true, allocateNewAccumulator: boolean = false) : T[] {
  const newAccumulator: T[] = allocateNewAccumulator ? Array.from(accumulator ?? []) : accumulator ?? [];
  if (!isEmpty(currentData)) {
    const len = currentData.length;
    for (let i = 0; i < len; ++i) {
      if (!eliminateNulls || isNotNil(currentData[i])) newAccumulator.push(currentData[i]);
    }
  }
  return newAccumulator;
}

/**
 * Flattens a two-dimensional array.
 * @param {T[][]} items The two-dimensional array to flatten
 * @returns {T[]} The flattened array
 * @template T
 */
export function simpleFlatten<T>(items: AnyArray<AnyArray<T>>) : T[] {
  return items.flat();
}

/**
 * A filtering callback to be used in conjunction with array.filter() to allow a search for a value in one or more fields
 * @param {string} searchTerm The string to find
 * @param {K[]} fieldsToSearch An array of field names to search
 * @returns {(T, number, T[]) => boolean} A callback that can be passed directly to the array.filter() function
 * @template T, K
 */
export function filterByFields<T, K extends keyof T>(searchTerm: string, fieldsToSearch: AnyArray<K>) : (value: T, index: number, array: T[]) => boolean {
  return (value: T) => {
    for (const fieldName of fieldsToSearch) {
      if (`${value?.[fieldName] ?? ''}`.toLowerCase().includes(searchTerm?.toLowerCase())) return true; // break out early if we find a match
    }
    return false; // no matches were found
  };
}

/**
 * Converts an array or readonly array of T into a Set<T> in the most performant way possible.
 * @param {T[]} items The array to transform
 * @returns {Set<T>}
 * @template T
 */
export function arrayToSet<T>(items: AnyArray<T>) : Set<T>;
/**
 * Converts an array or readonly array of T into a Set<T> in the most performant way possible.
 * @param {T[]} items The array to transform
 * @param {(T) => boolean} filter A callback function that is used to filter the array items from the final set
 * @returns {Set<T>}
 * @template T
 */
export function arrayToSet<T>(items: AnyArray<T>, filter: (item: T) => boolean) : Set<T>;
/**
 * Converts an array or readonly array of T into a Set<R> in the most performant way possible.
 * @param {T[]} items The array to transform
 * @param {(T) => boolean} filter A callback function that is used to filter the array items from the final set
 * @param {(T) => R} valueSelector A callback function to transform each item as it's inserted into the final set
 * @returns {Set<R>}
 * @template T, R
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

/**
 * Removes duplicates from an array based on the key value specified.
 * @param {T[]} items The array to dedupe
 * @param {(T) => K} keySelector A callback function that is used to generate a unique key for each array item
 * @returns {T[]} A new array with all duplicates removed
 * @template T, K
 */
export function arrayDedupe<T, K>(items: AnyArray<T>, keySelector: (item: T) => K) : T[] {
  const result = new KeyedSet(keySelector, items);
  return Array.from(result);
}
