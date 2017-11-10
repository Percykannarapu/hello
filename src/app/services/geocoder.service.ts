import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { RestResponse } from '../Models/RestResponse';
import { AccountLocation } from '../Models/AccountLocation';

import 'rxjs/add/operator/map'

@Injectable()
export class GeocoderService {

  private restResponse: RestResponse;
  private xcoord: number;
  private ycoord: number;

  constructor(public http: Http) {
    console.log('Fired GeocoderService ctor');
  }

  geocode(accountLocation: AccountLocation){
    console.log("fired geocode() in GeocoderService");
    /*this.http.post("http://vallomjbs002vm/services/v1/geocoder/singlesite", accountLocation).subscribe((response) => {
      console.log("Received response from remote geocoding service: " + response);
    });*/
    var observable = this.http.post("http://vallomjbs002vm/services/v1/geocoder/singlesite", accountLocation).map(res => res.json() as RestResponse);
    observable.subscribe((res) => {
      console.log("Received response from remote geocoding service: " + JSON.stringify(res, null, 4));
    });
  }

}