import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { RestResponse } from '../Models/RestResponse';
import { AccountLocation } from '../Models/AccountLocation';
import { GeocodingResponse } from '../Models/GeocodingResponse';
import { GeofootprintMaster } from '../Models/GeofootprintMaster';

import 'rxjs/add/operator/map';
import { AmSite } from '../val-modules/targeting/models/AmSite';

@Injectable()
export class GeocoderService {

  private restResponse: RestResponse;
  private xcoord: number;
  private ycoord: number;
  private GeocodingResponse;

  constructor(public http: Http) {
    console.log('Fired GeocoderService ctor');
  }

  // invoke the geocoding service in Fuse
  geocode(amSite: AmSite){
    const accountLocation: AccountLocation = {
      street: amSite.address,
      city: amSite.city,
      state: amSite.state,
      postalCode: Number(amSite.zip)
    };
    return this.http.post('https://servicesdev.valassislab.com/services/v1/geocoder/singlesite', accountLocation).map(res => res.json() as RestResponse);
  }
  
  saveGeofootprintMaster(geofootprintMaster: GeofootprintMaster){
    //JSON mapper = new JSON();
    console.log('fired saveGeofootprintMaster in GeocoderService ' + JSON.stringify(geofootprintMaster, null, 4));
     
    return this.http.post('https://servicesdev.valassislab.com/services/v1/mediaexpress/base/geofootprintmaster/save', geofootprintMaster).map(res => res.json() as RestResponse);
  }

}