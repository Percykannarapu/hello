import { ValGeocodingRequest } from '../../models/val-geocoding-request.model';
import { Parser, ParseRule } from '../../val-modules/common/services/file.service';


const latLongProcessor = (data: string) => {
  if (data != null && data !== '' && !Number.isNaN(Number(data)))
    return data;
  else
    return '';
};

const radiusIsBlank = (field: any) => {
  return field == null || field === '';
};

const radiusIsValid = (field: any) => {
  return (Number(field) > 0 && Number(field) <= 50);
};

const radiusIsZero = (field: any) => {
  return field != null && field !== '' && Number(field) === 0;
};

const stateCodeProcessor = (data: string) => {
  if (data == null) return data;
  const trimmedData = data.trim();
  if (trimmedData.length === 0 || trimmedData.length === 2) return trimmedData;
  const localData = trimmedData.toLowerCase();
  const stateCodes = {
    arizona    	: 'AZ',
    alabama    	: 'AL',
    alaska     	: 'AK',
    arkansas   	: 'AR',
    california 	: 'CA',
    colorado   	: 'CO',
    connecticut	: 'CT',
    delaware   	: 'DE',
    florida    	: 'FL',
    georgia    	: 'GA',
    hawaii     	: 'HI',
    idaho      	: 'ID',
    illinois   	: 'IL',
    indiana    	: 'IN',
    iowa       	: 'IA',
    kansas     	: 'KS',
    kentucky   	: 'KY',
    louisiana  	: 'LA',
    maine      	: 'ME',
    maryland   	: 'MD',
    massachusetts : 'MA',
    michigan    : 'MI',
    minnesota   : 'MN',
    mississippi : 'MS',
    missouri    : 'MO',
    montana     : 'MT',
    nebraska    : 'NE',
    nevada      : 'NV',
    'new hampshire' : 'NH',
    'new jersey'    : 'NJ',
    'new mexico' : 'NM',
    'new york'   : 'NY',
    'north carolina' : 'NC',
    'north dakota'   : 'ND',
    ohio         :  'OH',
    oklahoma    : 'OK',
    oregon       : 'OR',
    pennsylvania : 'PA',
    'rhode island'   : 'RI',
    'south carolina' : 'SC',
    'south dakota'   : 'SD',
    tennessee   : 'TN',
    texas       : 'TX',
    utah        : 'UT',
    vermont     : 'VT',
    virginia    : 'VA',
    washington  : 'WA',
    'west virginia' : 'WV',
    wisconsin : 'WI',
    wyoming : 'WY'
  };
  if (stateCodes[localData] == null) throw new Error('Please check the spelling of the States in your upload file');
  return stateCodes[localData];
} ;

export const siteListUpload: Parser<ValGeocodingRequest> = {
  
  columnParsers: [
    { headerIdentifier: [/street/i, /address/i, /addr/i], outputFieldName: 'street', width: 60 },
    { headerIdentifier: [/city/i, /cty/i], outputFieldName: 'city' , width: 60},
    { headerIdentifier: [/state/i, /st/i], outputFieldName: 'state', dataProcess: stateCodeProcessor, width: 2 },
    { headerIdentifier: [/zip/i, /\bzipcode\b/i, /zip code/i, /code/i, /postal/i, /postal code/i], outputFieldName: 'zip', width: 10 },
    { headerIdentifier: [/y/i, /y (optional)/i, /\by(optional)\b/i, /y optional/i, /latitude/i, /lat/i], outputFieldName: 'latitude', dataProcess: latLongProcessor },
    { headerIdentifier: [/x/i, /x (optional)/i, /\bx(optional)\b/i, /x optional/i, /longitude/i, /long/i, /lon/i], outputFieldName: 'longitude', dataProcess: latLongProcessor },
    { headerIdentifier: [/\bname\b/i, /\bfirm\b/i], outputFieldName: 'name', required: false, width: 80 },
    { headerIdentifier: [/\bnumber\b/i, /\bnbr\b/i, /\bid\b/i, /\bnum\b/i, /#/], outputFieldName: 'number', required: true, mustBeUnique: true, width: 80 },
    { headerIdentifier: [/market/i, /mkt/i, /market (optional)/i, /\bmarket(opt)\b/i, /market name/i], outputFieldName: 'Market', width: 80 },
    { headerIdentifier: [/\bmarketcode\b/i, /mktcode/i, /market code/i], outputFieldName: 'Market Code', width: 30 },
    { headerIdentifier: [/description/i, /desc/i], outputFieldName: 'Description', width: 240 },
    { headerIdentifier: [/group/i, /groupname/i, /\bgroup name\b/i], outputFieldName: 'Group', width: 80 },
    { headerIdentifier: [/\bradius1\b/i, /radius 1/i], outputFieldName: 'RADIUS1' },
    { headerIdentifier: [/\bradius2\b/i, /radius 2/i], outputFieldName: 'RADIUS2' },
    { headerIdentifier: [/\bradius3\b/i, /radius 3/i], outputFieldName: 'RADIUS3' },
    { headerIdentifier: [/homezipcode/i, /home zip code/i, /home zip/i], outputFieldName: 'Home Zip Code', width: 9 },
    { headerIdentifier: [/home atz/i], outputFieldName: 'Home ATZ', width: 8 },
    { headerIdentifier: [/home carrier route/i, /home pcr/i, /home cr/i], outputFieldName: 'Home Carrier Route', width: 9 },
    { headerIdentifier: [/home dtz/i, /home digital atz/i], outputFieldName: 'Home Digital ATZ', width: 9 },
    { headerIdentifier: [/home county/i], outputFieldName: 'Home County', width: 5 },
    { headerIdentifier: [/home dma/i], outputFieldName: 'Home DMA', width: 5 }
  ],
  
  headerValidator: (foundHeaders: ParseRule[]) : boolean => {
    let cityFound = false;
    let stateFound = false;
    let zipFound = false;
    
    for (const header of foundHeaders) {
      cityFound = cityFound || (header.outputFieldName === 'city');
      stateFound = stateFound || (header.outputFieldName === 'state');
      zipFound = zipFound || (header.outputFieldName === 'zip');
    }
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
        hasBlank1 = radiusIsBlank(geo['RADIUS1']) || hasBlank1;
        hasBlank2 = radiusIsBlank(geo['RADIUS2']) || hasBlank2;
        hasBlank3 = radiusIsBlank(geo['RADIUS3']) || hasBlank3;
        if (radiusIsValid(geo['RADIUS1'])) numValues1++;
        if (radiusIsValid(geo['RADIUS2'])) numValues2++;
        if (radiusIsValid(geo['RADIUS3'])) numValues3++;
        if (radiusIsZero(geo['RADIUS1']) || radiusIsZero(geo['RADIUS2']) || radiusIsZero(geo['RADIUS3'])) {
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
      console.error('Defined radii cannot be greater than 50 miles.');
      result = false;
    }
    return result;
  },

   createNullParser: (header: string, isUnique: boolean) : ParseRule => {
     const invalidLength = header.length > 30 ? true : false;
     return { headerIdentifier: '', outputFieldName: header, dataProcess: data => data , invalidLength: invalidLength, uniqueHeader: isUnique};
   } 
}; 
