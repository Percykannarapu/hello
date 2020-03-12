/* tslint:disable:semicolon */
import { isConvertibleToNumber, toNullOrNumber } from '@val/common';
import { TradeAreaTypeCodes } from '../val-modules/targeting/targeting.enums';

export class ValSort {

  // Generic sorters
  public static GenericNumber = (a: number, b: number) => a - b;
  public static StringsAsNumbers(a: string, b: string) {
    if (isConvertibleToNumber(a) && isConvertibleToNumber(b)) {
      return Number(a) - Number(b);
    } else {
      return ValSort.NullableSortWrapper(a, b, (x, y) => x.localeCompare(y));
    }
  }

  // Location Sorters
  public static LocationBySiteNum(a: { locationNumber: string }, b: { locationNumber: string }) {
    return this.StringsAsNumbers(a.locationNumber, b.locationNumber)
  };

  // Trade Area Sorters
  public static TradeAreaByTaNumber = (a: { taNumber: number }, b: { taNumber: number }) => Number(a.taNumber) - Number(b.taNumber);
  public static TradeAreaByRadius = (a: { taRadius: number }, b: { taRadius: number }) => Number(a.taRadius) - Number(b.taRadius);
  public static TradeAreaByType(a: { taRadius: number, taType: TradeAreaTypeCodes }, b: { taRadius: number, taType: TradeAreaTypeCodes }) {
    if (a.taType === b.taType) {
      return ValSort.TradeAreaByRadius(a, b);
    } else {
      return ValSort.getTradeAreaTypeNumericSort(TradeAreaTypeCodes.parse(a.taType)) -
             ValSort.getTradeAreaTypeNumericSort(TradeAreaTypeCodes.parse(b.taType));
    }
  };
  public static TradeAreaByTypeString(a: string, b: string) {
    const aType = ValSort.getTradeAreaTypesFromString(a);
    const bType = ValSort.getTradeAreaTypesFromString(b);
    return ValSort.TradeAreaByType(aType, bType);
  };

  // Geo Sorters
  public static GeoByDistance(a: { distance: number }, b: { distance: number }) {
    return ValSort.NullableSortWrapper(toNullOrNumber(a.distance), toNullOrNumber(b.distance), ValSort.GenericNumber);
  }

  // Print Task Proxy Sorters
  public static classBreakByMaxValue(a: {classMaxValue: number}, b: {classMaxValue: number}){
    return ValSort.GenericNumber(a.classMaxValue, b.classMaxValue);
  }

  //---------------------------------
  // Internal help functions

  private static NullableSortWrapper<T>(a: T, b: T, nonNullSorter: (x: T, y: T) => number, nullSortsLast: boolean = true) {
    const factor = nullSortsLast ? 1 : -1;
    return (a == null ? (b == null ? 0 : 1 * factor) : (b == null ? 1 * factor : nonNullSorter(a, b)));
  }

  private static getTradeAreaTypeNumericSort(t: TradeAreaTypeCodes) : number {
    switch (t) {
      case TradeAreaTypeCodes.Radius:
        return 0;
      case TradeAreaTypeCodes.Custom:
        return 1;
      case TradeAreaTypeCodes.MustCover:
        return 2;
      case TradeAreaTypeCodes.Manual:
        return 3;
      default:
        return 99;
    }
  }

  private static getTradeAreaTypesFromString(legendString: string) : { taRadius: number, taType: TradeAreaTypeCodes } {
    const workingValue = legendString.toLowerCase();
    if (workingValue.endsWith('mile radius')) {
      const numberCandidate = workingValue.replace('mile radius', '').trim();
      return { taType: TradeAreaTypeCodes.Radius, taRadius: isConvertibleToNumber(numberCandidate) ? Number(numberCandidate) : 0 }
    }
    switch (workingValue) {
      case 'custom':
        return { taType: TradeAreaTypeCodes.Custom, taRadius: 0 };
      case 'manual':
        return { taType: TradeAreaTypeCodes.Manual, taRadius: 0 };
      case 'must cover':
        return { taType: TradeAreaTypeCodes.MustCover, taRadius: 0 };
    }
    return { taType: TradeAreaTypeCodes.HomeGeo, taRadius: 0 };
  }
}
