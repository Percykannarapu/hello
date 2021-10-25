import { isConvertibleToNumber, isEmpty, isFunction } from '@val/common';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { ValGeocodingResponse } from './val-geocoding-response.model';

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
  RADIUS1?: number;
  RADIUS2?: number;
  RADIUS3?: number;
  latitude?: string | null;
  longitude?: string | null;
  previousAddress1?: string;
  previousCity?: string;
  previousState?: string;
  previousZip?: string;
  [key: string] : any;
  clientIdentifierId: string;  // Mandatory DB field
  clientLocationId: number;    // Mandatory DB field
  'Home ATZ': string;
  'Home Zip Code': string;
  'Home Carrier Route': string;
  'Home Digital ATZ': string;
  'Home County': string;
  'Home DMA': string;

  constructor();
  constructor(partial: Partial<ValGeocodingRequest>);
  constructor(location: ImpGeofootprintLocation, useOriginalAddress?: boolean, setRadii?: boolean);
  constructor(data?: ImpGeofootprintLocation | Partial<ValGeocodingRequest>, useOriginalAddress: boolean = false, setRadii: boolean = false) {
    if (data != null) {
      if (data instanceof ImpGeofootprintLocation) {
        this.fromLocation(data, useOriginalAddress, setRadii);
      } else {
        Object.assign(this, data);
      }
    }
  }

  // values are not empty, numeric, and inside the specified bounds
  public hasGoodLatAndLong() : boolean {
    return (isConvertibleToNumber(this.longitude) && Number(this.longitude) >= -180 && Number(this.latitude) <= 180) &&
           (isConvertibleToNumber(this.latitude) && Number(this.latitude) >= -90 && Number(this.latitude) <= 90);
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
    const nonAttributeProps = new Set<string>(['name', 'number', 'Market', 'Market Code', 'Description', 'Group', 'street',
      'city', 'state', 'zip', 'latitude', 'longitude', 'Home Zip Code', 'Home ATZ', 'Home Carrier Route',
      'Home Digital ATZ', 'Home County', 'Home DMA']);
    const result = new ValGeocodingResponse({
      Name: this.name,
      Market: this.Market,
      'Market Code': this['Market Code'],
      Description: this.Description,
      Group: this.Group,
      Number: this.number,
      Latitude: this.latitude,
      Longitude: this.longitude,
      RADIUS1: this.RADIUS1,
      RADIUS2: this.RADIUS2,
      RADIUS3: this.RADIUS3,
      'Geocode Status': status,
      'Home ATZ' : this['Home ATZ'],
      'Home Zip Code' : this['Home Zip Code'],
      'Home Carrier Route' : this['Home Carrier Route'],
      'Home Digital ATZ': this['Home Digital ATZ'],
      'Home County' : this['Home County'],
      'Home DMA' : this['Home DMA'],
    });
    if (status === 'PROVIDED') {
      result.Address = this.street;
      result.City = this.city;
      result.State = this.state;
      result.ZIP = this.zip;
    } else {
      result['Original Address'] = this.street;
      result['Original City'] = this.city;
      result['Original State'] = this.state;
      result['Original ZIP'] = this.zip;
    }
    for (const [k, v] of Object.entries(this)) {
      if (!nonAttributeProps.has(k) && !isFunction(v)) {
        result[k] = v;
      }
    }
    return result;
  }

  private fromLocation(loc: ImpGeofootprintLocation, useOriginal: boolean, setRadii: boolean) {
    this.name = loc.locationName;
    this.number = loc.locationNumber;
    this.Market = loc.marketName;
    this['Market Code'] = loc.marketCode;
    this.Description = loc.description;
    this.street = useOriginal ? loc.origAddress1 : loc.locAddress;
    this.city = useOriginal ? loc.origCity : loc.locCity;
    this.state = useOriginal ? loc.origState : loc.locState;
    this.zip = useOriginal ? loc.origPostalCode : loc.locZip;
    this.latitude = loc.ycoord == null ? null : loc.ycoord.toString();
    this.longitude = loc.xcoord == null ? null : loc.xcoord.toString();
    this.RADIUS1 = setRadii ? loc.radius1 : null;
    this.RADIUS2 = setRadii ? loc.radius2 : null;
    this.RADIUS3 = setRadii ? loc.radius3 : null;
    if (loc.impGeofootprintLocAttribs != null) {
      loc.impGeofootprintLocAttribs.forEach(attribute => {
        this[attribute.attributeCode] = attribute.attributeValue;
      });
    }
  }
}
