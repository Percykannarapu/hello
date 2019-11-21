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
    { headerIdentifier: ['street', 'address', 'addr'], outputFieldName: 'street', width: 60 },
    { headerIdentifier: ['city', 'cty'], outputFieldName: 'city' , width: 60},
    { headerIdentifier: ['state', 'st'], outputFieldName: 'state', dataProcess: stateCodeProcessor, width: 2 },
    { headerIdentifier: ['zip', 'zipcode', 'zip code', 'code', 'postal', 'postal code'], outputFieldName: 'zip', width: 10 },
    { headerIdentifier: ['y', 'y (optional)', 'y(optional)', 'y optional', 'latitude', 'lat'], outputFieldName: 'latitude', dataProcess: latLongProcessor, width: 11 },
    { headerIdentifier: ['x', 'x (optional)', 'x(optional)', 'x optional', 'longitude', 'long', 'lon'], outputFieldName: 'longitude', dataProcess: latLongProcessor, width: 11 },
    { headerIdentifier: [/\bname\b/i, /\bfirm\b/i], outputFieldName: 'name', required: false, width: 80 },
    { headerIdentifier: [/\bnumber\b/i, /\bnbr\b/i, /\bid\b/i, /\bnum\b/i, /#/], outputFieldName: 'number', required: true, mustBeUnique: true, width: 80 },
    { headerIdentifier: ['market', 'mkt', 'market (optional)', 'market(optional)', 'market (opt)', 'market(opt)'], outputFieldName: 'Market', width: 80 },
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
