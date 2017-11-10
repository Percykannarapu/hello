import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { RestResponse } from '../Models/RestResponse';
import { AccountLocation } from '../Models/AccountLocation';

import 'rxjs/add/operator/map'

@Injectable()
export class GeocoderService {

  constructor(public http: Http) {
    console.log('Fired GeocoderService ctor');
  }

  geocode(accountLocation: AccountLocation){
    console.log("fired geocode() in GeocoderService");
    this.http.post("http://vallomjbs002vm/services/v1/geocoder/singlesite", accountLocation).subscribe((response) => {
      console.log("Received response from remote geocoding service: " + response);
    });
     // .map(res => res.json() as RestResponse);
  }

}