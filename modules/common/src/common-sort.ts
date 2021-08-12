import { isConvertibleToNumber } from './type-checks';

function matchingState(a: boolean, b: boolean) : boolean {
  return (a && b) || (!a && !b);
}

export class CommonSort {

  public static StringsAsNumbers(a: string, b: string, nullSortsLast: boolean = true) {
    if (isConvertibleToNumber(a) && isConvertibleToNumber(b)) {
      return CommonSort.GenericNumber(Number(a), Number(b));
    } else {
      return CommonSort.NullableString(a, b, nullSortsLast);
    }
  }

  public static StringsAsNumbersReverse(a: string, b: string, nullSortsLast: boolean = true) {
    if (isConvertibleToNumber(a) && isConvertibleToNumber(b)) {
      return CommonSort.GenericNumberReverse(Number(a), Number(b));
    } else {
      return CommonSort.NullableStringReverse(a, b, nullSortsLast);
    }
  }

  public static NullableNumber = (a: number | null, b: number | null, nullSortsLast: boolean = true) => CommonSort.NullableSortWrapper(a, b, CommonSort.GenericNumber, nullSortsLast);
  public static NullableNumberReverse = (a: number | null, b: number | null, nullSortsLast: boolean = true) => CommonSort.NullableSortWrapper(a, b, CommonSort.GenericNumberReverse, nullSortsLast);
  public static NullableString = (a: string | null, b: string | null, nullSortsLast: boolean = true) => CommonSort.NullableSortWrapper(a, b, CommonSort.GenericString, nullSortsLast);
  public static NullableStringReverse = (a: string | null, b: string | null, nullSortsLast: boolean = true) => CommonSort.NullableSortWrapper(a, b, CommonSort.GenericStringReverse, nullSortsLast);

  public static GenericNumber = (a: number, b: number) => a - b;
  public static GenericNumberReverse = (a: number, b: number) => b - a;
  public static GenericString = (a: string, b: string) => a.localeCompare(b);
  public static GenericStringReverse = (a: string, b: string) => b.localeCompare(a);
  public static GenericBoolean = (a: boolean, b: boolean) => matchingState(a, b) ? 0 : a ? -1 : 1;
  public static GenericBooleanReverse = (a: boolean, b: boolean) => matchingState(a, b) ? 0 : b ? -1 : 1;

  public static NullableSortWrapper<T>(a: T, b: T, nonNullSorter: (x: T, y: T) => number, nullSortsLast: boolean = true) {
    const factor = nullSortsLast ? 1 : -1;
    return (a == null ? (b == null ? 0 : 1 * factor) : (b == null ? 1 * factor : nonNullSorter(a, b)));
  }
}
