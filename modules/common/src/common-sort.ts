import { isConvertibleToNumber } from './type-checks';

function matchingState(a: boolean, b: boolean) : boolean {
  return (a && b) || (!a && !b);
}

export class CommonSort {

  public static GenericNumber = (a: number, b: number) => a - b;
  public static GenericNumberReverse = (a: number, b: number) => b - a;
  public static GenericString = (a: string, b: string) => a.localeCompare(b);
  public static GenericBoolean = (a: boolean, b: boolean) => matchingState(a, b) ? 0 : a ? -1 : 1;

  public static StringsAsNumbers(a: string, b: string) {
    if (isConvertibleToNumber(a) && isConvertibleToNumber(b)) {
      return Number(a) - Number(b);
    } else {
      return CommonSort.NullableSortWrapper(a, b, CommonSort.GenericString);
    }
  }

  public static NullableSortWrapper<T>(a: T, b: T, nonNullSorter: (x: T, y: T) => number, nullSortsLast: boolean = true) {
    const factor = nullSortsLast ? 1 : -1;
    return (a == null ? (b == null ? 0 : 1 * factor) : (b == null ? 1 * factor : nonNullSorter(a, b)));
  }
}
