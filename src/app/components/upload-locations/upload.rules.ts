import { ParseRule } from '../../val-modules/common/services/file.service';

const latLongProcessor = (data: string) => {
  if (data != null && data !== '' && !Number.isNaN(Number(data)))
    return Number(data);
  else
    return null;
};

export const siteListUploadRules: ParseRule[] = [
  { headerIdentifier: ['street', 'address', 'addr'], outputFieldName: 'street'},
  { headerIdentifier: ['city', 'cty'], outputFieldName: 'city'},
  { headerIdentifier: ['state', 'st'], outputFieldName: 'state'},
  { headerIdentifier: ['zip', 'zipcode', 'zip code', 'code', 'postal', 'postal code'], outputFieldName: 'zip'},
  { headerIdentifier: ['y', 'y (optional)', 'y(optional)', 'y optional', 'latitude', 'lat'], outputFieldName: 'latitude', dataProcess: latLongProcessor },
  { headerIdentifier: ['x', 'x (optional)', 'x(optional)', 'x optional', 'longitude', 'long', 'lon'], outputFieldName: 'longitude', dataProcess: latLongProcessor },
  { headerIdentifier: [/\bname\b/i, /\bfirm\b/i], outputFieldName: 'name', required: true },
  { headerIdentifier: [/\bnumber\b/i, /\bnbr\b/i, /\bid\b/i, /\bnum\b/i, /#/], outputFieldName: 'number', required: true },
  { headerIdentifier: ['market', 'mkt', 'market (optional)', 'market(optional)', 'market (opt)', 'market(opt)'], outputFieldName: 'market'}
];

export const siteUploadHeaderValidator = (foundHeaders: ParseRule[]) : boolean => {
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
};
