import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { RestResponse } from '../Models/RestResponse';
import { AccountLocation } from '../Models/AccountLocation';
import { GeocodingResponse } from '../Models/GeocodingResponse';
import { TargetingProfile } from '../Models/TargetingProfile';

import 'rxjs/add/operator/map'

@Injectable()
export class Targetingservice{
    
    constructor(public http: Http) {
        console.log('Fired TargetingService');
      }
    private targetingProfile : TargetingProfile;


    loadTargetingProfile(profileid : number){
        console.log("load Targeting profile:::"+profileid)
        
    }
}