import { ImpGeofootprintLocAttrib } from '../val-modules/targeting/models/ImpGeofootprintLocAttrib';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ValGeocodingRequest } from './val-geocoding-request.model';

export class ValGeocodingResponse {
  Latitude: number;
  Longitude: number;
  Address: string;
  City: string;
  State: string;
  ZIP: string;
  Number: string;
  Name: string;
  Market: string;
  'Original Address': string;
  'Original City': string;
  'Original State': string;
  'Original ZIP': string;
  'Geocode Status': string;
  'Match Code': string;
  'Match Quality': string;
  [key: string] : any;

  constructor(initializer: any) {
    Object.assign(this, initializer);
  }

  public toGeoLocation(siteType?: string) : ImpGeofootprintLocation {
    const nonAttributeProps = ['Latitude', 'Longitude', 'Address', 'City', 'State', 'ZIP', 'Number', 'Name', 'Market', 'Original Address', 'Original City', 'Original State', 'Original ZIP', 'Match Code', 'Match Quality'];
    const result = new ImpGeofootprintLocation({
      locationName: this.Name,
      marketName: this.Market,
      locAddress: this.Address,
      locCity: this.City,
      locState: this.State,
      locZip: this.ZIP,
      xcoord: this.Longitude,
      ycoord: this.Latitude,
      origAddress1: this['Original Address'],
      origCity: this['Original City'],
      origState: this['Original State'],
      origPostalCode: this['Original ZIP'],
      geocoderMatchCode: this['Match Code'],
      geocoderLocationCode: this['Match Quality'],
      impClientLocationType: siteType
    });
    if (this.Number != null && !Number.isNaN(Number(this.Number))) {
      result.locationNumber = Number(this.Number);
      result.glId = Number(this.Number);
    }
    const attributes: ImpGeofootprintLocAttrib[] = [];
    for (const [k, v] of Object.entries(this)) {
      if (nonAttributeProps.indexOf(k) < 0 && typeof v !== 'function') {
        const locationAttribute = new ImpGeofootprintLocAttrib({
          attributeCode: k,
          attributeValue: v,
          impGeofootprintLocation: location
        });
        attributes.push(locationAttribute);
      }
    }
    result['_attributes'] = attributes;
    return result;
  }

  public toGeocodingRequest() : ValGeocodingRequest {
    const nonAttributeProps = ['Latitude', 'Longitude', 'Address', 'City', 'State', 'ZIP', 'Number', 'Name', 'Market', 'Original Address', 'Original City', 'Original State', 'Original ZIP', 'Match Code', 'Match Quality'];
    const result: ValGeocodingRequest = new ValGeocodingRequest({
      name:  this.Name,
      number: this.Number,
      market: this.Market,
      street: this['Original Address'],
      city: this['Original City'],
      state: this['Original State'],
      zip: this['Original ZIP']
    });
    for (const [k, v] of Object.entries(this)) {
      if (nonAttributeProps.indexOf(k) < 0 && typeof v !== 'function') {
        result[k] = v;
      }
    }
    return result;
  }

}
