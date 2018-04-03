export function chunkArray<T, U>(arr: T[] | U[], chunkSize: number) : (T[] | U[])[] {
  const groups: (T[] | U[])[] = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    groups.push(arr.slice(i, i + chunkSize));
  }
  return groups;
}

export function isNumber(value: any) : boolean {
  return value != null && value != '' && !Number.isNaN(Number(value));
}
