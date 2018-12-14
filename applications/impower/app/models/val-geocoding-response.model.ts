export class ValGeocodingResponse {
  Latitude: string;
  Longitude: string;
  Address: string;
  City: string;
  State: string;
  ZIP: string;
  Number: string;
  Name: string;
  Market: string;
  Description: string;
  Group: string;
  'Market Code': string;
  'Original Address': string;
  'Original City': string;
  'Original State': string;
  'Original ZIP': string;
  'Geocode Status': string;
  'Match Code': string;
  'Match Quality': string;
  'CarrierRoute': string;
  [key: string] : any;

  constructor(initializer: any) {
    Object.assign(this, initializer);
    if (this['Geocode Status'] !== 'PROVIDED' && this['Geocode Status'] !== 'BAD XY') {
      if (this['Match Quality'] === 'E' || (this['Match Code'].startsWith('E') && !this['Match Quality'].startsWith('Z'))) {
        this['Geocode Status'] = 'ERROR';
      } else if ((this['Match Quality'].startsWith('Z') && !this['Match Quality'].startsWith('ZT9')) /*|| this['Match Code'] === 'Z'*/) {
        this['Geocode Status'] = 'CENTROID';
      } else {
        this['Geocode Status'] = 'SUCCESS';
      }
    }
  }
}
