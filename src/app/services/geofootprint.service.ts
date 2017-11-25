import { Injectable } from '@angular/core';
import { Http,Headers,RequestOptions } from '@angular/http';
import { RestResponse } from '../Models/RestResponse';

import 'rxjs/add/operator/map'
import { TargetingProfile } from '../Models/TargetingProfile';



@Injectable()
export class GeoFootPrint {

    constructor(public http: Http) {
        console.log('Fired GeoFootPrint services');
      }

    private restResponse    : RestResponse;
    private profileId       : number;
    private siteid          : number;



    saveTargetingProfile(targetingprofile : TargetingProfile){

        console.log("fired GeoFootPrint saveTarhetingProfile Service "+JSON.stringify(targetingprofile,null,4));
       
        return this.http.post("http://vallomjbs002vm/services/v1/targeting/base/targetingprofile/save", targetingprofile).map(res => res.json() as RestResponse);

    }

    loadTargetingProfile(profileid : number){

        console.log("url:::"+"http://vallomjbs002vm/services/v1/targeting/base/targetingprofile/load/"+profileid);
        return this.http.get("http://vallomjbs002vm/services/v1/targeting/base/targetingprofile/load/"+profileid).map(res => res.json() as RestResponse);

    }
}