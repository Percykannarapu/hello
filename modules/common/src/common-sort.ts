import { isConvertibleToNumber, isNil } from './type-checks';

export type SortCallback<T> = (a: T, b: T) => number;

function matchingState(a: boolean, b: boolean) : boolean {
  return (a && b) || (!a && !b);
}

export class CommonSort {

  public static FieldNameAsStringParsedToNumber(fieldName: string, a: {}, b: {}, reverse: boolean = false) {
    if (reverse) {
      return CommonSort.StringsAsNumbersReverse(a[fieldName], b[fieldName]);
    } else {
      return CommonSort.StringsAsNumbers(a[fieldName], b[fieldName]);
    }
  }

  public static FieldNameAsNumber(fieldName: string, a: {}, b: {}, reverse: boolean = false) {
    if (reverse) {
      return CommonSort.NullableNumberReverse(a[fieldName], b[fieldName]);
    } else {
      return CommonSort.NullableNumber(a[fieldName], b[fieldName]);
    }
  }

  public static FieldNameAsString(fieldName: string, a: {}, b: {}, reverse: boolean = false) {
    if (reverse) {
      return CommonSort.NullableStringReverse(a[fieldName], b[fieldName]);
    } else {
      return CommonSort.NullableString(a[fieldName], b[fieldName]);
    }
  }

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

  public static NullableSortWrapper<T>(a: T, b: T, nonNullSorter: SortCallback<T>, nullSortsLast: boolean = true) {
    if (isNil(a) && isNil(b)) return 0;
    if (isNil(a)) return nullSortsLast ? 1 : -1;
    if (isNil(b)) return nullSortsLast ? -1 : 1;
    return nonNullSorter(a, b);
  }
}
