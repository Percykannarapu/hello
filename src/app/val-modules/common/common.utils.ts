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
 * @param {(T) => R} itemTransformer: Optional callback to transform each item before the final grouping
 * @returns {Map<T[K], T[]>}
 */
export function groupBy<T extends { [key: string] : any }, K extends keyof T, R>(items: T[], fieldName: K) : Map<T[K], T[]>;
export function groupBy<T extends { [key: string] : any }, K extends keyof T, R>(items: T[], fieldName: K, itemTransformer: (T) => R) : Map<T[K], R[]>;
export function groupBy<T extends { [key: string] : any }, K extends keyof T, R>(items: T[], fieldName: K, itemTransformer?: (T) => R) : Map<T[K], (T | R)[]> {
  const result = new Map<T[K], (T | R)[]>();
  if (items == null || items.length === 0) return result;
  const tx: ((T) => T | R) = itemTransformer != null ? itemTransformer : (i) => i;
  items.forEach(i => {
    if (result.has(i[fieldName])) {
      result.get(i[fieldName]).push(tx(i));
    } else {
      result.set(i[fieldName], [tx(i)]);
    }
  });
  return result;
}

/**
 * Maps an array by the contents of a field identified by its name
 * Note this method assumes that there will only be one instance for each key value
 * @param {T[]} items: The array to group
 * @param {K} fieldName: The name of the field to extract grouping info from
 * @param {(T) => R} itemTransformer: Optional callback to transform each item before the final grouping
 * @returns {Map<T[K], T>}
 */
export function mapBy<T extends { [key: string] : any }, K extends keyof T, R>(items: T[], fieldName: K) : Map<T[K], T>;
export function mapBy<T extends { [key: string] : any }, K extends keyof T, R>(items: T[], fieldName: K, itemTransformer: (T) => R) : Map<T[K], R>;
export function mapBy<T extends { [key: string] : any }, K extends keyof T, R>(items: T[], fieldName: K, itemTransformer?: (T) => R) : Map<T[K], (T | R)> {
  const result = new Map<T[K], (T | R)>();
  if (items == null || items.length === 0) return result;
  const tx: ((T) => T | R) = itemTransformer != null ? itemTransformer : (i) => i;
  items.forEach(i => {
    result.set(i[fieldName], tx(i));
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
 * Flattens any arbitrarily-deep nested array structure. Use simpleFlatten for a more performant solution to 2-dimensional arrays.
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

