import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { RestResponse } from '../Models/RestResponse';
import { AccountLocation } from '../Models/AccountLocation';
import { GeocodingResponse } from '../Models/GeocodingResponse';
import { GeofootprintMaster } from '../Models/GeofootprintMaster';

import 'rxjs/add/operator/map'

@Injectable()
export class GeocoderService {

  private restResponse: RestResponse;
  private xcoord: number;
  private ycoord: number;
  private GeocodingResponse;

  constructor(public http: Http) {
    console.log('Fired GeocoderService ctor');
  }

  geocode(accountLocation: AccountLocation){
    console.log("fired geocode() in GeocoderService");
    /*this.http.post("http://vallomjbs002vm/services/v1/geocoder/singlesite", accountLocation).subscribe((response) => {
      console.log("Received response from remote geocoding service: " + response);
    });*/
    return this.http.post("http://vallomjbs002vm/services/v1/geocoder/singlesite", accountLocation).map(res => res.json() as RestResponse);
  }
  
  saveGeofootprintMaster(geofootprintMaster : GeofootprintMaster){
    //JSON mapper = new JSON();
    console.log("fired saveGeofootprintMaster in GeocoderService "+JSON.stringify(geofootprintMaster,null,4));
    
    return this.http.post("http://valwgpjbs002vm:8181/cxf/services/v1/mediaexpress/base/geofootprintmaster/save", geofootprintMaster).map(res => res.json() as RestResponse);
  }

}