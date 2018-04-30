import { ParseRule } from '../../val-modules/common/services/file.service';

const AtzZipProcessor = (data: string) => {
  if (data != null && data !== '' && !Number.isNaN(Number(data)))
    return Number(data);
  else
    return null;
};

export const siteListUploadRules: ParseRule[] = [
    { headerIdentifier: ['STORE', 'SITE', 'LOC', 'Site #', 'NUMBER'], outputFieldName: 'STORE', required: true},
    { headerIdentifier: ['GEO', 'ATZ', 'PCR', 'ZIP', 'DIG', 'ROUTE', 'GEOCODE', 'GEOGRAPHY'], outputFieldName: 'Geo', required: true},
    
  ];

// export const siteUploadHeaderValidator = (foundHeaders: ParseRule[]) : boolean => {
//     let storeFound = false;
//     let zipFound = false;
//     for (const header of foundHeaders) {
//       storeFound = storeFound || (header.outputFieldName.includes('Site'));
//       zipFound = zipFound || (header.outputFieldName.includes('zip'));
//     }
//     if (!storeFound && !zipFound || !storeFound || !zipFound){
      
//       throw new Error('The file must contain two columns: Site Number and Geocode.');
//     // } else if (!storeFound){
//     //   throw new Error('The file must contain at least Site Number column or a Geocode column.');
//     // } 
//     // else if (!zipFound){
//     //   throw new Error('The file must contain a Geocode column.');
//      } 
//     return true;
//   };