import { ParseRule } from '../../../val-modules/common/services/file.service';

export const headerCache = {
  variableName: ''
};

export const audienceUploadRules: ParseRule[] = [
  { headerIdentifier: ['GEO', 'ATZ', 'PCR', 'ZIP', 'DIG', 'ROUTE', 'GEOCODE', 'GEOGRAPHY'], outputFieldName: 'geocode', required: true},
  { headerIdentifier: (header) => {
      if (['GEO', 'ATZ', 'PCR', 'ZIP', 'DIG', 'ROUTE', 'GEOCODE', 'GEOGRAPHY'].includes(header.toUpperCase())) return false;
      headerCache.variableName = header;
      return true;
    }, outputFieldName: 'data', required: true }
];
