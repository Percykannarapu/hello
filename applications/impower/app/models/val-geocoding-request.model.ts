import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ValGeocodingResponse } from './val-geocoding-response.model';

const isEmpty = (s: any) => s == null || s.toString().trim().length === 0;
const isNumber = (s: any) => !isEmpty(s) && !Number.isNaN(Number(s));
const isBetween = (min: number, max: number, s: any) => isNumber(s) && s >= min && s <= max;

export class ValGeocodingRequest {
  name: string;
  number: string;
  Market: string;
  'Market Code': string;
  Description: string;
  Group: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  latitude?: string | null;
  longitude?: string | null;
  previousAddress1?: string;
  previousCity?: string;
  previousState?: string;
  previousZip?: string;
  [key: string] : any;
  clientIdentifierId: string;  // Mandatory DB field
  clientLocationId: number;    // Mandatory DB field
  'Home ATZ' : string;
  'Home ZIP' : string;
  'Home PCR' : string;
  'Home Digital ATZ' : string;
  'Home County' : string;
  'Home DMA' : string;

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

  // values are not empty, numeric, and inside the specified bounds
  public hasGoodLatAndLong() : boolean {
    return isBetween(-180, 180, this.longitude) && isBetween(-90, 90, this.latitude);
  }

  // values are not empty, and either non-numeric, or numeric and outside the specified bounds
  public hasBadLatAndLong() : boolean {
    return !this.hasNoLatAndLong() && !this.hasGoodLatAndLong();
  }

  // either value is empty
  public hasNoLatAndLong() : boolean {
    return isEmpty(this.longitude) || isEmpty(this.latitude);
  }

  public cleanUploadRequest() : ValGeocodingRequest {
    delete this.latitude;
    delete this.longitude;
    return this;

  }

  public toGeocodingResponse(status: 'PROVIDED' | 'BAD XY') : ValGeocodingResponse {
    const nonAttributeProps = ['name', 'number', 'Market', 'Market Code', 'Description', 'Group',
                               'street', 'city', 'state', 'zip', 'latitude', 'longitude', 'Home ZIP', 'Home ATZ', 'Home PCR', 'Home Digital ATZ', 'Home County', 'Home DMA'];
    const result = new ValGeocodingResponse({
      Name: this.name,
      Market: this.Market,
      'Market Code': this['Market Code'],
      Description: this.Description,
      Group: this.Group,
      Number: this.number,
      Latitude: this.latitude,
      Longitude: this.longitude,
      'Geocode Status': status,
      'Home ATZ' : this['Home ATZ'],
      'Home ZIP' : this['Home ZIP'],
      'Home PCR' : this['Home PCR'],
      'Home Digital ATZ': this['Home Digital ATZ'],
      'Home County' : this['Home County'],
      'Home DMA' : this['Home DMA']
    
    });
    if (status === 'PROVIDED') {
      result.Address = this.street;
      result.City = this.city;
      //commented as a part of user story : US9232
      //result.LocalState = this.state;
      result.State = this.state;
      result.ZIP = this.zip;
    } else {
      result['Original Address'] = this.street;
      result['Original City'] = this.city;
      result['Original State'] = this.state;
      result['Original ZIP'] = this.zip;
    }
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
