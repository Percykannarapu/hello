import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RestResponse } from '../Models/RestResponse';
import { AccountLocation } from '../Models/AccountLocation';
import { GeocodingResponse } from '../Models/GeocodingResponse';
import { GeofootprintMaster } from '../Models/GeofootprintMaster';

import 'rxjs/add/operator/map';
import { AmSite } from '../val-modules/targeting/models/AmSite';
import { RequestOptionsArgs } from '@angular/http/src/interfaces';
import { Response } from '@angular/http/src/static_response';
import { AccountLocations } from '../Models/AccountLocations';

@Injectable()
export class GeocoderService {

  private restResponse: RestResponse;
  private xcoord: number;
  private ycoord: number;
  private GeocodingResponse;

  constructor(public http: HttpClient) {
    console.log('Fired GeocoderService ctor');
  }

  // invoke the geocoding service in Fuse
  geocode(amSite: AmSite){
    const accountLocation: AccountLocation = {
      street: amSite.address,
      city: amSite.city,
      state: amSite.state,
      postalCode: amSite.zip
    };
// _gridOptions:Map<string, Array<string>> = new Map([["1", ["test"]], ["2", ["test2"]]])    
    
   return this.http.post<RestResponse>('https://servicesdev.valassislab.com/services/v1/geocoder/singlesite', accountLocation);
  }

  multiplesitesGeocode(siteList: any[]){
    //console.log('fired multiplGeocode in GeocoderService2:: ' + JSON.stringify(siteList, null, 2));   
    return this.http.post<RestResponse>('https://servicesdev.valassislab.com/services/v1/geocoder/multiplesites', siteList);
  }
  
  saveGeofootprintMaster(geofootprintMaster: GeofootprintMaster){
    console.log('fired saveGeofootprintMaster in GeocoderService ' + JSON.stringify(geofootprintMaster, null, 4));    
    return this.http.post<RestResponse>('https://servicesdev.valassislab.com/services/v1/mediaexpress/base/geofootprintmaster/save', geofootprintMaster);
  }

}