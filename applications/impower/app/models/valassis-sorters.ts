/* tslint:disable:semicolon */
import { isConvertibleToNumber } from '@val/common';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { TradeAreaTypeCodes } from '../val-modules/targeting/targeting.enums';

function getTradeAreaTypeNumericSort(t: TradeAreaTypeCodes) : number {
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

function getTradeAreaTypesFromString(legendString: string) : TradeAreaTypeCodes {
  const workingValue = legendString.toLowerCase();
  if (workingValue.startsWith('trade area')) return TradeAreaTypeCodes.Radius;
  switch (workingValue) {
    case 'custom':
      return TradeAreaTypeCodes.Custom;
    case 'manual':
      return TradeAreaTypeCodes.Manual;
    case 'must cover':
      return TradeAreaTypeCodes.MustCover;
  }
  return TradeAreaTypeCodes.HomeGeo;
}

export class ValSort {

  public static GenericNumber = (a: number, b: number) => a - b;

  public static TradeAreaByTaNumber = (a: { taNumber: number }, b: { taNumber: number }) => Number(a.taNumber) - Number(b.taNumber);
  public static TradeAreaByRadius = (a: { taRadius: number }, b: { taRadius: number }) => Number(a.taRadius) - Number(b.taRadius);
  public static TradeAreaByType = (a: ImpGeofootprintTradeArea, b: ImpGeofootprintTradeArea) => {
    if (a.taType === b.taType) {
      return ValSort.TradeAreaByTaNumber(a, b);
    } else {
      return getTradeAreaTypeNumericSort(TradeAreaTypeCodes.parse(a.taType)) - getTradeAreaTypeNumericSort(TradeAreaTypeCodes.parse(b.taType));
    }
  };
  public static TradeAreaStrings = (a: string, b: string) => {
    const aType = getTradeAreaTypesFromString(a);
    const bType = getTradeAreaTypesFromString(b);
    if (aType === TradeAreaTypeCodes.Radius && aType === bType) {
      return a.localeCompare(b); // this will sort them by the ta number that's part of the string
    } else {
      return getTradeAreaTypeNumericSort(aType) - getTradeAreaTypeNumericSort(bType);
    }
  };
  public static LocationBySiteNum = (a: { locationNumber: string }, b: { locationNumber: string }) => {
    if (isConvertibleToNumber(a.locationNumber) && isConvertibleToNumber(b.locationNumber)) {
      return Number(a.locationNumber) - Number(b.locationNumber);
    } else {
      return a.locationNumber.localeCompare(b.locationNumber);
    }
  };
}
