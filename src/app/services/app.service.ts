// Added nallana: US6087  
import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import { RestResponse } from '../Models/RestResponse';

@Injectable()
export class AppService {

    public categoriesList = [
        {name: 'CLINICS', sic: '8011-04'},
        {name: 'PHYSICIANS & SURGEONS-EMERGENCY SERVICE', sic: '8011-05'},
        {name:'PSYCHOANALYSTS', sic: '8011-06'},
        {name:'TATTOOS-REMOVED', sic: '8011-07'},
        {name:'ANESTHETISTS', sic: '8011-08'},
        {name:'OPHTHALMOLOGISTS', sic: '8011-11'},
        {name:'PSYCHIATRY-ADULT CHILD & ADOLESCENT', sic: '8011-13'},
        {name:'PHYSICIANS & SURGEONS', sic: '8011-01'},
        {name:'SPORTS MEDICINE & INJURIES', sic: '8011-02'},
        {name:'ALLERGY PHYSICIANS', sic: '8011-20'},
        {name:'INDIAN GOODS', sic: '5947-09'},
        {name:'PIZZA', sic:'5812-22'}
    ]

   /* saveTargetingProfile(targetingprofile : TargetingProfile){
        
                console.log("fired GeoFootPrint saveTarhetingProfile Service "+JSON.stringify(targetingprofile,null,4));
               
                return this.http.post("http://servicesdev.valassislab.com/services/v1/targeting/base/targetingprofile/save", targetingprofile).map(res => res.json() as RestResponse);
        
            } */
    private readonly searchbusiness = 'https://servicesdev.valassislab.com/services/v1/targeting/base/targetingsearch/search';
    
        constructor(private http: Http) { }
        public getbusinesses(paramObj): Observable<any> {
        
            return this.http.post(`${this.searchbusiness}`, paramObj)
                .map((resp: Response) => resp.json() as RestResponse);
                
        }

        businessSearch(paramObj){
            console.log("Fired business Search Api")
            return this.http.post("https://servicesdev.valassislab.com/services/v1/targeting/base/targetingsearch/search",paramObj).map(res => res.json() as RestResponse);
        }
        

}

