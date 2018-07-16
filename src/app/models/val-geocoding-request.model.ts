import { ValGeocodingResponse } from './val-geocoding-response.model';

export class ValGeocodingRequest {
  name: string;
  number: string;
  Market: string;
  'Market Code': string;
  'Description': string;
  street: string;
  city: string;
  state: string;
  zip: string;
  latitude?: string | null;
  longitude?: string | null;
  [key: string] : any;
  clientIdentifierId: string;  // Mandatory DB field
  clientLocationId: number;    // Mandatory DB field

  constructor(initializer: any) {
    Object.assign(this, initializer);
  }

  public canBeGeocoded() : boolean {
    const notEmpty = (s: string) => s != null && s.trim() !== '';
    return this.hasLatAndLong() || notEmpty(this.zip) || (notEmpty(this.state) && notEmpty(this.city));
  }

  public hasLatAndLong() : boolean {
    return this.hasOwnProperty('longitude') && this.hasOwnProperty('latitude') && this.longitude != null && this.latitude != null;
  }

  public cleanUploadRequest() : ValGeocodingRequest {
    delete this.latitude;
    delete this.longitude;
    return this;
  }

  public toGeocodingResponse() : ValGeocodingResponse {
    const nonAttributeProps = ['name', 'number', 'Market', 'Market Code','Description', 'street', 'city', 'state', 'zip', 'latitude', 'longitude'];
    const result = new ValGeocodingResponse({
      Name: this.name,
      Market: this.Market,
      'Market Code': this['Market Code'],
      'Description': this['Description'],
      Number: this.number,
      Address: this.street,
      City: this.city,
      State: this.state,
      ZIP: this.zip,
      Latitude: this.latitude,
      Longitude: this.longitude,
      'Geocode Status': 'PROVIDED'
    });
    for (const [k, v] of Object.entries(this)) {
      if (nonAttributeProps.indexOf(k) < 0 && typeof v !== 'function') {
        result[k] = v;
      }
    }
    return result;
  }

}
