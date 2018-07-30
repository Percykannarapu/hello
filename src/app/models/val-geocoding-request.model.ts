import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ValGeocodingResponse } from './val-geocoding-response.model';

export class ValGeocodingRequest {
  name: string;
  number: string;
  Market: string;
  'Market Code': string;
  'Description': string;
  'Group': string;
  street: string;
  city: string;
  state: string;
  zip: string;
  latitude?: string | null;
  longitude?: string | null;
  [key: string] : any;
  clientIdentifierId: string;  // Mandatory DB field
  clientLocationId: number;    // Mandatory DB field

  constructor();
  constructor(partial: Partial<ValGeocodingRequest>);
  constructor(location: ImpGeofootprintLocation, useOriginalAddress?: boolean);
  constructor(data?: ImpGeofootprintLocation | Partial<ValGeocodingRequest>, useOriginalAddress: boolean = false) {
    if (data != null) {
      if (data instanceof ImpGeofootprintLocation) {
        this.fromLocation(data, useOriginalAddress);
      } else {
        Object.assign(this, data);
      }
    }
  }

  public canBeGeocoded() : boolean {
    const notEmpty = (s: string) => s != null && s.trim() !== '';
    return this.hasLatAndLong() || notEmpty(this.zip) || (notEmpty(this.state) && notEmpty(this.city));
  }

  public hasLatAndLong() : boolean {
    const notEmpty = (s: string) => s != null && s.trim() !== '';
    return notEmpty(this.longitude) && notEmpty(this.latitude);
  }

  public cleanUploadRequest() : ValGeocodingRequest {
    delete this.latitude;
    delete this.longitude;
    return this;
  }

  public toGeocodingResponse() : ValGeocodingResponse {
    const nonAttributeProps = ['name', 'number', 'Market', 'Market Code', 'Description', 'Group', 'street', 'city', 'state', 'zip', 'latitude', 'longitude'];
    const result = new ValGeocodingResponse({
      Name: this.name,
      Market: this.Market,
      'Market Code': this['Market Code'],
      'Description': this['Description'],
      'Group': this['Group'],
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

  private fromLocation(loc: ImpGeofootprintLocation, useOriginal: boolean) {
    this.name = loc.locationName;
    this.number = loc.locationNumber;
    this.Market = loc.marketName;
    this['Market Code'] = loc.marketCode;
    this.Description = loc.description;
    this.street = useOriginal ? loc.origAddress1 : loc.locAddress;
    this.city = useOriginal ? loc.origCity : loc.locCity;
    this.state = useOriginal ? loc.origState : loc.locState;
    this.zip = useOriginal ? loc.origPostalCode : loc.locZip;
    this.latitude = loc.ycoord == null ? null : loc.ycoord.toLocaleString();
    this.longitude = loc.xcoord == null ? null : loc.xcoord.toLocaleString();
    if (loc.impGeofootprintLocAttribs != null) {
      loc.impGeofootprintLocAttribs.forEach(attribute => {
        this[attribute.attributeCode] = attribute.attributeValue;
      });
    }
  }
}
