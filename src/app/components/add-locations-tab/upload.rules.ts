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

export const siteListUpload: Parser<ValGeocodingRequest> = {
  columnParsers: [
    { headerIdentifier: ['street', 'address', 'addr'], outputFieldName: 'street' },
    { headerIdentifier: ['city', 'cty'], outputFieldName: 'city' },
    { headerIdentifier: ['state', 'st'], outputFieldName: 'state' },
    { headerIdentifier: ['zip', 'zipcode', 'zip code', 'code', 'postal', 'postal code'], outputFieldName: 'zip' },
    { headerIdentifier: ['y', 'y (optional)', 'y(optional)', 'y optional', 'latitude', 'lat'], outputFieldName: 'latitude', dataProcess: latLongProcessor },
    { headerIdentifier: ['x', 'x (optional)', 'x(optional)', 'x optional', 'longitude', 'long', 'lon'], outputFieldName: 'longitude', dataProcess: latLongProcessor },
    { headerIdentifier: [/\bname\b/i, /\bfirm\b/i], outputFieldName: 'name', required: false },
    { headerIdentifier: [/\bnumber\b/i, /\bnbr\b/i, /\bid\b/i, /\bnum\b/i, /#/], outputFieldName: 'number', required: true, mustBeUnique: true },
    { headerIdentifier: ['market', 'mkt', 'market (optional)', 'market(optional)', 'market (opt)', 'market(opt)'], outputFieldName: 'Market' },
    { headerIdentifier: ['marketCode', 'mktcode', 'market code', 'Market Code'], outputFieldName: 'Market Code' },
    { headerIdentifier: ['description', 'desc', 'Description'], outputFieldName: 'Description' },
    { headerIdentifier: ['group', 'groupname', ' group name', 'Group Name', 'Group'], outputFieldName: 'Group' },
    { headerIdentifier: ['radius1', 'radius 1', 'RADIUS1', 'RADIUS 1', 'Radius1', 'Radius 1'], outputFieldName: 'RADIUS1' },
    { headerIdentifier: ['radius2', 'radius 2', 'RADIUS2', 'RADIUS 2', 'Radius2', 'Radius 2'], outputFieldName: 'RADIUS2' },
    { headerIdentifier: ['radius3', 'radius 3', 'RADIUS3', 'RADIUS 3', 'Radius3', 'Radius 3'], outputFieldName: 'RADIUS3' }
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
    const errorMessage: string = 'Failed';

    try {
      allData.forEach(geo => {
        hasBlank1 = radiusIsBlank(geo['RADIUS1']) || hasBlank1;
        hasBlank2 = radiusIsBlank(geo['RADIUS2']) || hasBlank2;
        hasBlank3 = radiusIsBlank(geo['RADIUS3']) || hasBlank3;
        if (radiusIsValid(geo['RADIUS1'])) numValues1++;
        if (radiusIsValid(geo['RADIUS2'])) numValues2++;
        if (radiusIsValid(geo['RADIUS3'])) numValues3++;
        if (radiusIsZero(geo['RADIUS1']) || radiusIsZero(geo['RADIUS2']) || radiusIsZero(geo['RADIUS3'])) {
          result = false;
          throw new Error(errorMessage);
        }
      });
      if ((hasBlank1 && numValues1 > 0) || (hasBlank2 && numValues2 > 0) || (hasBlank3 && numValues3 > 0)) {
        result = false;
        throw new Error(errorMessage);
      }
      if ((!hasBlank1 && numValues1 === 0) || (!hasBlank2 && numValues2 === 0) || (!hasBlank3 && numValues3 === 0)) {
        result = false;
        throw new Error(errorMessage);
      }
      if ((numValues1 > 0 && numValues1 !== allData.length) || (numValues2 > 0 && numValues2 !== allData.length) || (numValues3 > 0 && numValues3 !== allData.length)) {
        result = false;
        throw new Error(errorMessage);
      }
    } catch (e) {
      if ((<Error>e).message === errorMessage) {
        console.error('Upload failed because there was a Blank or ZERO Radius');
      } else {
        console.error('Defined radii cannot be greater than 50 miles.');
      }
    }
    return result;
  }
};
