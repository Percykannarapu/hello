import { CommonSort, isConvertibleToNumber, toNullOrNumber } from '@val/common';
import { TradeAreaTypeCodes } from '../../worker-shared/data-model/impower.data-model.enums';

// Location Sorters
export function LocationBySiteNum(a: { locationNumber: string }, b: { locationNumber: string }, reverse: boolean = false) {
  if (reverse) {
    return CommonSort.StringsAsNumbersReverse(a.locationNumber, b.locationNumber);
  } else {
    return CommonSort.StringsAsNumbers(a.locationNumber, b.locationNumber);
  }
}

// Trade Area Sorters
export const TradeAreaByTaNumber = (a: { taNumber: number }, b: { taNumber: number }) => Number(a.taNumber) - Number(b.taNumber);
export const TradeAreaByRadius = (a: { taRadius: number }, b: { taRadius: number }) => Number(a.taRadius) - Number(b.taRadius);
export function TradeAreaByType(a: { taRadius: number, taType: TradeAreaTypeCodes }, b: { taRadius: number, taType: TradeAreaTypeCodes }) {
  if (a.taType === b.taType) {
    return TradeAreaByRadius(a, b);
  } else {
    return getTradeAreaTypeNumericSort(TradeAreaTypeCodes.parse(a.taType)) -
      getTradeAreaTypeNumericSort(TradeAreaTypeCodes.parse(b.taType));
  }
}

export function TradeAreaByTypeString(a: string, b: string) {
  const aType = getTradeAreaTypesFromString(a);
  const bType = getTradeAreaTypesFromString(b);
  return TradeAreaByType(aType, bType);
}

// Geo Sorters
interface GeoSortSurrogate {
  geocode: string;
  distance: number;
  hhc: number;
  impGeofootprintLocation: { locationNumber: string, homeGeocode: string };
}

export function GeosByHomeGeoPriority(a: GeoSortSurrogate, b: GeoSortSurrogate) {
  const isHomeGeoA: boolean = (a?.geocode === a?.impGeofootprintLocation?.homeGeocode);
  const isHomeGeoB: boolean = (b?.geocode === b?.impGeofootprintLocation?.homeGeocode);
  return CommonSort.GenericBoolean(isHomeGeoA, isHomeGeoB);
}

export function PrettyGeoSort(a: GeoSortSurrogate, b: GeoSortSurrogate) {
  return LocationBySiteNum(a?.impGeofootprintLocation, b?.impGeofootprintLocation)
    || CommonSort.NullableNumber(toNullOrNumber(a?.distance), toNullOrNumber(b?.distance))
    || CommonSort.NullableNumberReverse(toNullOrNumber(a?.hhc), toNullOrNumber(b?.hhc))
    || CommonSort.NullableString(a?.geocode, b?.geocode);
}

export function RankGeoSort(a: GeoSortSurrogate, b: GeoSortSurrogate) {
  return CommonSort.NullableString(a?.geocode, b?.geocode)
    || GeosByHomeGeoPriority(a, b)
    || CommonSort.NullableNumber(toNullOrNumber(a?.distance), toNullOrNumber(b?.distance))
    || CommonSort.NullableNumberReverse(toNullOrNumber(a?.hhc), toNullOrNumber(b?.hhc))
    || LocationBySiteNum(a?.impGeofootprintLocation, b?.impGeofootprintLocation);
}

//---------------------------------
// Internal help functions

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

function getTradeAreaTypesFromString(legendString: string) : { taRadius: number, taType: TradeAreaTypeCodes } {
  const workingValue = legendString.toLowerCase();
  if (workingValue.endsWith('mile radius')) {
    const numberCandidate = workingValue.replace('mile radius', '').trim();
    return { taType: TradeAreaTypeCodes.Radius, taRadius: isConvertibleToNumber(numberCandidate) ? Number(numberCandidate) : 0 };
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

