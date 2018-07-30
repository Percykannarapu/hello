import { ImpGeofootprintLocAttrib } from '../val-modules/targeting/models/ImpGeofootprintLocAttrib';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ValGeocodingRequest } from './val-geocoding-request.model';

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
  'Market Code': string;
  'Description': string;
  'Group': string;
  get LatLon() : string { return `${this.Latitude}, ${this.Longitude}`; }
  set LatLon(value: string) {  this.parseLatLon(value); }
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
    if (this['Geocode Status'] !== 'PROVIDED') {
      if (this['Match Quality'] === 'E' || (this['Match Code'].startsWith('E') && !this['Match Quality'].startsWith('Z'))) {
        this['Geocode Status'] = 'ERROR';
      } else if ((this['Match Quality'].startsWith('Z') && !this['Match Quality'].startsWith('ZT9')) /*|| this['Match Code'] === 'Z'*/) {
        this['Geocode Status'] = 'CENTROID';
      } else {
        this['Geocode Status'] = 'SUCCESS';
      }
    }
  }

  private parseLatLon(value: string) : void {
        const temp = value.split(',');
        if (temp[0] != null && !Number.isNaN(Number(temp[0])) && temp[1] != null && !Number.isNaN(Number(temp[1])) ) {
          this.userHasEdited = true;
          this.Latitude = temp[0];
          this.Longitude = temp[1];
        }

  }

  public toGeoLocation(siteType?: string, analysisLevel?: string) : ImpGeofootprintLocation {

    const nonAttributeProps = ['Latitude', 'Longitude', 'Address', 'City', 'State', 'ZIP', 'Number', 'Name', 'Market','Market Code','Group','Description', 'Original Address', 'Original City', 'Original State', 'Original ZIP', 'Match Code', 'Match Quality', 'Geocode Status'];
    const result = new ImpGeofootprintLocation({
      locationName: this.Name,
      marketName: this.Market,
      marketCode: this['Market Code'],
      description: this['Description'],
      groupName: this['Group'],
      locAddress: this.Address,
      locCity: this.City,
      locState: this.State,
      locZip: this.ZIP,
      origAddress1: this['Original Address'],
      origCity: this['Original City'],
      origState: this['Original State'],
      origPostalCode: this['Original ZIP'],
      recordStatusCode: this['Geocode Status'],
      geocoderMatchCode: this['Match Code'],
      geocoderLocationCode: this['Match Quality'],
      clientIdentifierTypeCode: 'PROJECT_ID',
      isActive: true
    });
    if (result.recordStatusCode === 'SUCCESS' || result.recordStatusCode === 'PROVIDED') {
      result.clientLocationTypeCode = siteType;
      result.xcoord = Number(this.Longitude);
      result.ycoord = Number(this.Latitude);
    } else {
      result.clientLocationTypeCode = `Failed ${siteType}`;
    }
    if (analysisLevel) {
      switch (analysisLevel) {
        case 'ZIP': {
          for (const key of Object.keys(this)) {
            if (key.toLowerCase().match('home') && key.toLowerCase().match('zip')) {
              result.homeGeocode = this[key];
            }
          }
          break;
        }
        case 'ATZ': {
          for (const key of Object.keys(this)) {
            if (key.toLowerCase().match('home') && key.toLowerCase().match('atz')) {
              result.homeGeocode = this[key];
            }
          }
          break;
        }
        case 'Digital ATZ': {
          for (const key of Object.keys(this)) {
            if (key.toLowerCase().match('home') && key.toLowerCase().match('digital') && key.toLowerCase().match('atz')) {
              result.homeGeocode = this[key];
            }
          }
          break;
        }
        case 'PCR': {
          for (const key of Object.keys(this)) {
            if (key.toLowerCase().match('home') && key.toLowerCase().match('carrier') && key.toLowerCase().match('route')) {
              result.homeGeocode = this[key];
            }
          }
          break;
        }
      }
    }
    if (this.Number != null ) {
      result.locationNumber = this.Number;
    }
    for (const [k, v] of Object.entries(this)) {
      if (k === '' || v === '') {
        continue;
      }
      if (nonAttributeProps.indexOf(k) < 0 && typeof v !== 'function') {
        const locationAttribute = new ImpGeofootprintLocAttrib({
          attributeCode: k,
          attributeValue: v,
          impGeofootprintLocation: result
        });
        result.impGeofootprintLocAttribs.push(locationAttribute);
      }
    }
    return result;
  }

  public toGeocodingRequest() : ValGeocodingRequest {
    const nonAttributeProps = ['Latitude', 'Longitude', 'Address', 'City', 'State', 'ZIP', 'Number', 'Name', 'Original Address', 'Original City', 'Original State', 'Original ZIP', 'Match Code', 'Match Quality', 'Geocode Status'];
    const result: ValGeocodingRequest = new ValGeocodingRequest({
      name:  this.Name,
      number: this.Number,
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
