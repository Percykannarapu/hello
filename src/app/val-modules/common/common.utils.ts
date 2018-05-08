
/**
 * Groups an array by the contents of a field identified by its name
 * @param {T[]} items: The array to group
 * @param {K} fieldName: The name of the field to extract grouping info from
 * @returns {Map<keyof T, T[]>}
 */
export function groupBy<T extends { [key: string] : any }, K extends keyof T>(items: T[], fieldName: K) : Map<keyof T, T[]> {
  const result = new Map<keyof T, T[]>();
  if (items == null || items.length === 0) return result;
  items.forEach(i => {
    if (result.has(i[fieldName])) {
      result.get(i[fieldName]).push(i);
    } else {
      result.set(i[fieldName], [i]);
    }
  });
  return result;
}
