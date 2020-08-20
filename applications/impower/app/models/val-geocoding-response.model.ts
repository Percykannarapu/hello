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
  RADIUS1: number;
  RADIUS2: number;
  RADIUS3: number;
  'Market Code': string;
  'Original Address': string;
  'Original City': string;
  'Original State': string;
  'Original ZIP': string;
  'Geocode Status': string;
  'Match Code': string;
  'Match Quality': string;
  'CarrierRoute': string;
  'Home ATZ': string;
  'Home Zip Code': string;
  'Home Carrier Route': string;
  'Home Digital ATZ': string;
  'Home County': string;
  'Home DMA': string;
  [key: string] : any;

  constructor(initializer: any) {
    Object.assign(this, initializer);
    if (this['Geocode Status'] !== 'PROVIDED' && this['Geocode Status'] !== 'BAD XY') {
      const matchCode = this['Match Code'].toUpperCase();
      const matchQuality = this['Match Quality'].toUpperCase();
      if (matchQuality === 'E' || (matchCode.startsWith('E') && !matchQuality.startsWith('Z'))) {
        this['Geocode Status'] = 'ERROR';
      } else if (matchQuality.startsWith('Z') && !matchQuality.startsWith('ZT9')) {
        this['Geocode Status'] = 'CENTROID';
      } else {
        this['Geocode Status'] = 'SUCCESS';
      }
    }
  }
}
