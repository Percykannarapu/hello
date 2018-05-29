import { ImpGeofootprintLocAttrib } from '../val-modules/targeting/models/ImpGeofootprintLocAttrib';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ValGeocodingRequest } from './val-geocoding-request.model';

export const valGeocodingAttributeKey = '_attributes';

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
  get LatLon() : string { return `${this.Latitude}, ${this.Longitude}`; }
  set LatLon(value: string) { this.parseLatLon(value); }
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

  private parseLatLon(value: string) : void {
    const temp = value.split(',');
    this.Latitude = temp[0];
    this.Longitude = temp[1];
  }

  public toGeoLocation(siteType?: string) : ImpGeofootprintLocation {
    const nonAttributeProps = ['Latitude', 'Longitude', 'Address', 'City', 'State', 'ZIP', 'Number', 'Name', 'Market', 'Original Address', 'Original City', 'Original State', 'Original ZIP', 'Match Code', 'Match Quality', 'Geocode Status'];
    const result = new ImpGeofootprintLocation({
      locationName: this.Name,
      marketName: this.Market,
      locAddress: this.Address,
      locCity: this.City,
      locState: this.State,
      locZip: this.ZIP,
      xcoord: Number(this.Longitude),
      ycoord: Number(this.Latitude),
      origAddress1: this['Original Address'],
      origCity: this['Original City'],
      origState: this['Original State'],
      origPostalCode: this['Original ZIP'],
      recordStatusCode: this['Geocode Status'],
      geocoderMatchCode: this['Match Code'],
      geocoderLocationCode: this['Match Quality'],
      clientLocationTypeCode: siteType, //new ImpClientLocationType({clientLocationType: siteType}),
      isActive: true
    });
    if (this.Number != null && !Number.isNaN(Number(this.Number))) {
      result.locationNumber = Number(this.Number);
      result.glId = null; // Number(this.Number);
    }
    const attributes: ImpGeofootprintLocAttrib[] = [];
    for (const [k, v] of Object.entries(this)) {
      if (nonAttributeProps.indexOf(k) < 0 && typeof v !== 'function') {
        const locationAttribute = new ImpGeofootprintLocAttrib({
          attributeCode: k,
          attributeValue: v,
          impGeofootprintLocation: result
        });
        attributes.push(locationAttribute);
      }
    }
    result[valGeocodingAttributeKey] = attributes;
    return result;
  }

  public toGeocodingRequest() : ValGeocodingRequest {
    const nonAttributeProps = ['Latitude', 'Longitude', 'Address', 'City', 'State', 'ZIP', 'Number', 'Name', 'Market', 'Original Address', 'Original City', 'Original State', 'Original ZIP', 'Match Code', 'Match Quality', 'Geocode Status'];
    const result: ValGeocodingRequest = new ValGeocodingRequest({
      name:  this.Name,
      number: this.Number,
      Market: this.Market,
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
