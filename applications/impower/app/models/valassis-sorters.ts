/* tslint:disable:semicolon */
import { isConvertibleToNumber } from '@val/common';
import { TradeAreaTypeCodes } from '../val-modules/targeting/targeting.enums';

export class ValSort {

  // Generic sorters
  public static GenericNumber(a: number, b: number) {
    return a - b;
  }

  // Trade Area Sorters
  public static TradeAreaByTaNumber = (a: { taNumber: number }, b: { taNumber: number }) => Number(a.taNumber) - Number(b.taNumber);
  public static TradeAreaByRadius = (a: { taRadius: number }, b: { taRadius: number }) => Number(a.taRadius) - Number(b.taRadius);
  public static TradeAreaByType(a: { taNumber: number, taType: TradeAreaTypeCodes }, b: { taNumber: number, taType: TradeAreaTypeCodes }) {
    if (a.taType === b.taType) {
      return this.TradeAreaByTaNumber(a, b);
    } else {
      return this.getTradeAreaTypeNumericSort(TradeAreaTypeCodes.parse(a.taType)) -
             this.getTradeAreaTypeNumericSort(TradeAreaTypeCodes.parse(b.taType));
    }
  };
  public static TradeAreaByTypeString(a: string, b: string) {
    const aType = this.getTradeAreaTypesFromString(a);
    const bType = this.getTradeAreaTypesFromString(b);
    return this.TradeAreaByType(aType, bType);
  };

  // Location Sorters
  public static LocationBySiteNum(a: { locationNumber: string }, b: { locationNumber: string }) {
    if (isConvertibleToNumber(a.locationNumber) && isConvertibleToNumber(b.locationNumber)) {
      return Number(a.locationNumber) - Number(b.locationNumber);
    } else {
      return a.locationNumber.localeCompare(b.locationNumber);
    }
  };

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

  private static getTradeAreaTypesFromString(legendString: string) : { taNumber: number, taType: TradeAreaTypeCodes } {
    const workingValue = legendString.toLowerCase();
    if (workingValue.startsWith('trade area')) {
      const numberCandidate = workingValue.substring(10).trim();
      return { taType: TradeAreaTypeCodes.Radius, taNumber: isConvertibleToNumber(numberCandidate) ? Number(numberCandidate) : 0 }
    }
    switch (workingValue) {
      case 'custom':
        return { taType: TradeAreaTypeCodes.Custom, taNumber: 0 };
      case 'manual':
        return { taType: TradeAreaTypeCodes.Manual, taNumber: 0 };
      case 'must cover':
        return { taType: TradeAreaTypeCodes.MustCover, taNumber: 0 };
    }
    return { taType: TradeAreaTypeCodes.HomeGeo, taNumber: 0 };
  }
}
