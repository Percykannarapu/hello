import { ValGeocodingResponse } from './val-geocoding-response.model';

export class ValGeocodingRequest {
  name: string;
  number: string;
  market: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  latitude?: number | null;
  longitude?: number | null;
  [key: string] : any;

  constructor(initializer: any) {
    Object.assign(this, initializer);
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
    const nonAttributeProps = ['name', 'number', 'market', 'street', 'city', 'state', 'zip', 'latitude', 'longitude'];
    const result = new ValGeocodingResponse({
      Name: this.name,
      Market: this.market,
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
