/* tslint:disable:semicolon */
import { isConvertibleToNumber } from '@val/common';
import { TradeAreaTypeCodes } from '../val-modules/targeting/targeting.enums';

export class ValSort {

  // Generic sorters
  public static GenericNumber(a: number, b: number) {
    return a - b;
  }

  public static StringsAsNumbers(a: string, b: string) {
    if (isConvertibleToNumber(a) && isConvertibleToNumber(b)) {
      return Number(a) - Number(b);
    } else {
      return a.localeCompare(b);
    }
  }

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

  // Location Sorters
  public static LocationBySiteNum(a: { locationNumber: string }, b: { locationNumber: string }) {
    return this.StringsAsNumbers(a.locationNumber, b.locationNumber)
  };
  
  // Proxy Sorters

  public static classBreakByMaxValue(a: {classMaxValue: number}, b: {classMaxValue: number}){
    return ValSort.GenericNumber(a.classMaxValue, b.classMaxValue);
  }

  //---------------------------------
  // Internal help functions

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
