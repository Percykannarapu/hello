// fixes Array.isArray not typing a readonly array as an array

declare global {
  interface ArrayConstructor {
    isArray(arg: any) : arg is ReadonlyArray<any>;
  }
}

/**
 * Groups an array by the contents of a field identified by its name
 * @param {T[]} items: The array to group
 * @param {K} fieldName: The name of the field to extract grouping info from
 * @param {(T) => R} valueSelector: Optional callback to transform each item before the final grouping
 * @returns {Map<T[K], (T | R)[]>}
 */
export function groupBy<T extends { [key: string] : any }, K extends keyof T, R>(items: T[], fieldName: K) : Map<T[K], T[]>;
export function groupBy<T extends { [key: string] : any }, K extends keyof T, R>(items: T[], fieldName: K, valueSelector: (T) => R) : Map<T[K], R[]>;
export function groupBy<T extends { [key: string] : any }, K extends keyof T, R>(items: T[], fieldName: K, valueSelector?: (T) => R) : Map<T[K], (T | R)[]> {
  return groupByExtended(items, (i) => i[fieldName], valueSelector);
}

/**
 * Groups an array by the result of a keySelector function
 * @param {T[]} items: The array to group
 * @param {function} keySelector: A callback function that is used to generate the keys for the dictionary
 * @param {(T) => R} valueSelector: Optional callback to transform each item before the final grouping
 * @returns {Map<K, (T | R)[]>}
 */
export function groupByExtended<T, K, R>(items: T[], keySelector: (item: T) => K) : Map<K, T[]>;
export function groupByExtended<T, K, R>(items: T[], keySelector: (item: T) => K, valueSelector: (item: T) => R) : Map<K, R[]>;
export function groupByExtended<T, K, R>(items: T[], keySelector: (item: T) => K, valueSelector?: (item: T) => R) : Map<K, (T | R)[]> {
  const result = new Map<K, (T | R)[]>();
  if (items == null || items.length === 0) return result;
  const tx: ((T) => T | R) = valueSelector != null ? valueSelector : (i) => i;
  items.forEach(i => {
    const currentKey = keySelector(i);
    const currentValue = tx(i);
    if (result.has(currentKey)) {
      result.get(currentKey).push(currentValue);
    } else {
      result.set(currentKey, [currentValue]);
    }
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
export function mapBy<T extends { [key: string] : any }, K extends keyof T, R>(items: T[], fieldName: K, valueSelector: (T) => R) : Map<T[K], R>;
export function mapBy<T extends { [key: string] : any }, K extends keyof T, R>(items: T[], fieldName: K, valueSelector?: (T) => R) : Map<T[K], T | R> {
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
export function mapByExtended<T, K, R>(items: T[], keySelector: (item: T) => K, valueSelector: (T) => R) : Map<K, R>;
export function mapByExtended<T, K, R>(items: T[], keySelector: (item: T) => K, valueSelector?: (T) => R) : Map<K, T | R> {
  const result = new Map<K, T | R>();
  const tx: ((T) => T | R) = valueSelector != null ? valueSelector : (i) => i;
  if (items == null || items.length === 0) return result;
  items.forEach(i => {
    result.set(keySelector(i), tx(i));
  });
  return result;
}

/**
 * Flattens a two dimensional array. Use completeFlatten() for an 3+ or arbitrary dimensional array
 * @param {T[][]} items
 * @returns {T[]}
 */
export function simpleFlatten<T>(items: T[][]) : T[] {
  return [].concat(...items);
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

export function resolveFieldData(data: any, field: any): any {
   if(data && field) {
       if (isFunction(field)) {
           return field(data);
       }
       else if(field.indexOf('.') == -1) {
           return data[field];
       }
       else {
           let fields: string[] = field.split('.');
           let value = data;
           for(let i = 0, len = fields.length; i < len; ++i) {
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

export function isFunction (obj: any) { !!(obj && obj.constructor && obj.call && obj.apply); }

export function roundTo(value: number, precision: number): number {
   let pow: number = Math.pow(10, precision);
   return parseFloat(String(Math.round((value * pow)) / pow));
}
