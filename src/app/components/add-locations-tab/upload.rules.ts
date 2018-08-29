import { ValGeocodingRequest } from '../../models/val-geocoding-request.model';
import { Parser, ParseRule } from '../../val-modules/common/services/file.service';

const latLongProcessor = (data: string) => {
  if (data != null && data !== '' && !Number.isNaN(Number(data)))
    return data;
  else
    return '';
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
  headerValidator: (foundHeaders: ParseRule[]): boolean => {
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
  fileValidator: (allData: ValGeocodingRequest[]): boolean => {
    let hasBlank: boolean = false;
    let inValid: boolean = false;
    let numValues: number = 0;
    let result: boolean = true;
    const errorMessage: string = 'Failed';

    try {
      allData.forEach(geo => {
        if ((geo['RADIUS1'] === '0' || geo['RADIUS1'] == null || geo['RADIUS1'] === '') ||
          (geo['RADIUS2'] === '0' || geo['RADIUS2'] == null || geo['RADIUS2'] === '') ||
          (geo['RADIUS3'] === '0' || geo['RADIUS3'] == null || geo['RADIUS3'] === '')) {

          hasBlank = true;
        } else {
          if ((Number(geo['RADIUS1']) > 50) || (Number(geo['RADIUS2']) > 50) || (Number(geo['RADIUS3']) > 50)) {
            inValid = true;
            result = false;
          } else {
            numValues++;
          }

        }
        
      });
      if (hasBlank && numValues > 0){
        result = false;
        throw new Error(errorMessage);
      }
      if (inValid) {
        throw new Error('Defined radii cannot be greater than 50 miles.');
      }
    }
    catch (e) {
      if ((<Error>e).message === errorMessage) {
        console.error('Upload failed because there was a Blank or ZERO Radius');
      } else {
        console.error('Defined radii cannot be greater than 50 miles.');
      }
    }
    return result;
  }
};
