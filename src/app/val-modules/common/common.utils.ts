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

