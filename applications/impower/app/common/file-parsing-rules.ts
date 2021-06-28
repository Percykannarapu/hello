import { isConvertibleToNumber, isEmpty, isNil, toNullOrNumber } from '@val/common';
import { ValGeocodingRequest } from '../models/val-geocoding-request.model';
import { Parser, ParseRule } from '../val-modules/common/services/file.service';
import { stateCodes } from './state-names';

/**
 * ============================================
 *     Custom Audience File Parsing Rules
 */

export interface CustomDataRow {
  geocode: string;
  [key: string] : string;
}

export const customAudienceFileParser: Parser<CustomDataRow> = {
  columnParsers: [
    { headerIdentifier: ['GEO', 'ATZ', 'PCR', 'ZIP', 'DIG', 'ROUTE', 'GEOCODE', 'GEOGRAPHY'], outputFieldName: 'geocode', required: true }
  ],
  createNullParser: (header: string) : ParseRule => {
    return { headerIdentifier: '', outputFieldName: header, dataProcess: data => data };
  }
};

/**
 * ========================================
 *     Must Cover File Parsing Rules
 */

export interface MustCoverDataRow {
  geocode: string;
}

export const mustCoverFileParser: Parser<MustCoverDataRow> = {
  columnParsers: [
    { headerIdentifier: ['GEO', 'ATZ', 'PCR', 'ZIP', 'DIG', 'ROUTE', 'GEOCODE', 'GEOGRAPHY'], outputFieldName: 'geocode', required: true}
  ],
  createNullParser: (header: string) : ParseRule => {
    return { headerIdentifier: '', outputFieldName: header, dataProcess: data => data};
  }
};

/**
 * =============================================
 *     Custom Trade Area File Parsing Rules
 */

export interface TradeAreaDataRow {
  store: string;
  geocode: string;
  message: string;
}

export const tradeAreaFileParser: Parser<TradeAreaDataRow> = {
  columnParsers: [
    { headerIdentifier: ['STORE', 'SITE', 'LOC', 'Site #', 'NUMBER'], outputFieldName: 'store', required: true},
    { headerIdentifier: ['GEO', 'ATZ', 'PCR', 'ZIP', 'DIG', 'ROUTE', 'GEOCODE', 'GEOGRAPHY'], outputFieldName: 'geocode', required: true},
  ],

  createNullParser: (header: string) : ParseRule => {
    return { headerIdentifier: '', outputFieldName: header, dataProcess: data => data};
  }
};

/**
 * ============================================
 *        Site List File Parsing Rules
 */

const radiusIsValid = (field: any) => {
  return isConvertibleToNumber(field) && Number(field) > 0 && Number(field) <= 100;
};

const stateCodeProcessor = (data: string) => {
  const trimmedData = data?.trim();
  if (isEmpty(trimmedData) || trimmedData.length === 2) return trimmedData.toUpperCase();
  const result = stateCodes[trimmedData.toLowerCase()];
  if (isNil(result)) throw new Error('Please check the spelling of the States in your upload file');
  return result;
};

export const siteListFileParser: Parser<ValGeocodingRequest> = {

  columnParsers: [
    { headerIdentifier: ['street', 'address', 'addr'], outputFieldName: 'street', width: 60 },
    { headerIdentifier: ['city', 'cty'], outputFieldName: 'city' , width: 60},
    { headerIdentifier: ['state', 'st'], outputFieldName: 'state', dataProcess: stateCodeProcessor, width: 2 },
    { headerIdentifier: ['zip', 'zipcode', 'zip code', 'code', 'postal', 'postal code'], outputFieldName: 'zip', width: 10 },
    { headerIdentifier: ['y', 'y (optional)', 'y(optional)', 'y optional', 'latitude', 'lat'], outputFieldName: 'latitude', dataProcess: data => toNullOrNumber(data) ?? '' },
    { headerIdentifier: ['x', 'x (optional)', 'x(optional)', 'x optional', 'longitude', 'long', 'lon'], outputFieldName: 'longitude', dataProcess: data => toNullOrNumber(data) ?? '' },
    { headerIdentifier: ['market', 'mkt', 'market (optional)', 'market(optional)', 'market (opt)', 'market(opt)', 'Market Name', 'MARKET NAME'], outputFieldName: 'Market', width: 80 },
    { headerIdentifier: [/\bname\b/i, /\bfirm\b/i], outputFieldName: 'name', required: false, width: 80 },
    { headerIdentifier: [/\bnumber\b/i, /\bnbr\b/i, /\bid\b/i, /\bnum\b/i, /#/], outputFieldName: 'number', required: true, mustBeUnique: true, width: 80 },
    { headerIdentifier: ['marketCode', 'mktcode', 'market code', 'Market Code'], outputFieldName: 'Market Code', width: 30 },
    { headerIdentifier: ['description', 'desc', 'Description'], outputFieldName: 'Description', width: 240 },
    { headerIdentifier: ['group', 'groupname', ' group name', 'Group Name', 'Group'], outputFieldName: 'Group', width: 80 },
    { headerIdentifier: ['radius1', 'radius 1', 'RADIUS1', 'RADIUS 1', 'Radius1', 'Radius 1'], outputFieldName: 'RADIUS1' },
    { headerIdentifier: ['radius2', 'radius 2', 'RADIUS2', 'RADIUS 2', 'Radius2', 'Radius 2'], outputFieldName: 'RADIUS2' },
    { headerIdentifier: ['radius3', 'radius 3', 'RADIUS3', 'RADIUS 3', 'Radius3', 'Radius 3'], outputFieldName: 'RADIUS3' },
    { headerIdentifier: ['Home Zip Code', 'home zip code', 'Home ZIP Code', 'Home Zip', 'Home ZIP'], outputFieldName: 'Home Zip Code', width: 9 },
    { headerIdentifier: ['Home ATZ', 'home ATZ', 'home atz'], outputFieldName: 'Home ATZ', width: 8 },
    { headerIdentifier: ['Home Carrier Route', 'Home PCR', 'home pcr', 'Home pcr', 'home cr', 'Home cr', 'Home CR'], outputFieldName: 'Home Carrier Route', width: 9 },
    { headerIdentifier: ['Home Digital ATZ', 'Home DTZ', 'home dtz', 'Home dtz' , 'home digital atz'], outputFieldName: 'Home Digital ATZ', width: 9 },
    { headerIdentifier: ['Home County', 'home county'], outputFieldName: 'Home County', width: 5 },
    { headerIdentifier: ['Home DMA', 'home dma', 'Home dma'], outputFieldName: 'Home DMA', width: 5 }
  ],

  headerValidator: (foundHeaders: ParseRule[]) : boolean => {
    const cityFound = foundHeaders.some(h => h.outputFieldName === 'city');
    const stateFound = foundHeaders.some(h => h.outputFieldName === 'state');
    const zipFound = foundHeaders.some(h => h.outputFieldName === 'zip');

    if ((!cityFound || !stateFound) && !zipFound) throw new Error('Either a Postal Code or City + State columns must be present in the file.');
    return true;
  },

  fileValidator: (allData: ValGeocodingRequest[]) : boolean => {
    let hasBlank1: boolean = false;
    let hasBlank2: boolean = false;
    let hasBlank3: boolean = false;
    let numValues1: number = 0;
    let numValues2: number = 0;
    let numValues3: number = 0;
    let result: boolean = true;

    try {
      for (const geo of allData) {
        hasBlank1 = isEmpty(geo['RADIUS1']) || hasBlank1;
        hasBlank2 = isEmpty(geo['RADIUS2']) || hasBlank2;
        hasBlank3 = isEmpty(geo['RADIUS3']) || hasBlank3;
        if (radiusIsValid(geo['RADIUS1'])) numValues1++;
        if (radiusIsValid(geo['RADIUS2'])) numValues2++;
        if (radiusIsValid(geo['RADIUS3'])) numValues3++;
        if (toNullOrNumber(geo['RADIUS1']) === 0 ||
          toNullOrNumber(geo['RADIUS2']) === 0 ||
          toNullOrNumber(geo['RADIUS3']) === 0) {
          result = false;
          break;
        }
      }
      if ((hasBlank1 && numValues1 > 0) || (hasBlank2 && numValues2 > 0) || (hasBlank3 && numValues3 > 0)) {
        result = false;
      }
      if ((!hasBlank1 && numValues1 === 0) || (!hasBlank2 && numValues2 === 0) || (!hasBlank3 && numValues3 === 0)) {
        result = false;
      }
      if ((numValues1 > 0 && numValues1 !== allData.length) || (numValues2 > 0 && numValues2 !== allData.length) || (numValues3 > 0 && numValues3 !== allData.length)) {
        result = false;
      }
      if (result === false) console.error('Upload failed because there was a Blank or ZERO Radius');
    } catch (e) {
      console.error('Defined radii cannot be greater than 100 miles.');
      result = false;
    }
    return result;
  },

  createNullParser: (header: string, isUnique: boolean) : ParseRule => {
    const invalidLength = header.length > 30;
    return { headerIdentifier: '', outputFieldName: header, dataProcess: data => data , invalidLength: invalidLength, uniqueHeader: isUnique};
  }
};
