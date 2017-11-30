// Added nallana: US6087  
import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import { RestResponse } from '../Models/RestResponse';
import { EsriLoaderWrapperService} from './esri-loader-wrapper.service';
import { MapService } from './map.service';

@Injectable()
export class AppService {
    private static mapView: __esri.MapView;

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
        {name:'PIZZA', sic:'5812-22'},
        {sic:'5211-01',name:'DOORS-GARAGE'},
        {sic:'5211-02',name:'DOOR & GATE OPERATING DEVICES'},
        {sic:'5211-03',name:'WINDOWS-LOUVERED'},
        {sic:'5211-04',name:'WALLBOARD & PLASTERBOARD'},
        {sic:'5211-05',name:'WINDOWS-PLASTIC'},
        {sic:'5211-06',name:'WINDOWS-METAL'},
        {sic:'5211-07',name:'WINDOWS'},
        {sic:'5211-08',name:'WINDOWS-WOOD'},
        {sic:'5211-09',name:'WINDOWS-VINYL'},
        {sic:'5211-10',name:'PLUMBING FIXTURES & SUPPLIES-NEW-RETAIL'},
        {sic:'5211-11',name:'PANELING'},
        {sic:'5211-12',name:'PLYWOOD & VENEERS'}
        
    ]

   /* saveTargetingProfile(targetingprofile : TargetingProfile){
        
                console.log("fired GeoFootPrint saveTarhetingProfile Service "+JSON.stringify(targetingprofile,null,4));
               
                return this.http.post("http://servicesdev.valassislab.com/services/v1/targeting/base/targetingprofile/save", targetingprofile).map(res => res.json() as RestResponse);
        
            } */
    private readonly searchbusiness = 'https://servicesdev.valassislab.com/services/v1/targeting/base/targetingsearch/search';
    
    //use the getbusiness method to get the data from the service
        constructor(private http: Http, private mapService: MapService) { }
        public getBusinesses(paramObj): Observable<any> {
        
            console.log("Fired getbusiness");
            return this.http.post(`${this.searchbusiness}`, paramObj)
                .map((resp: Response) => resp.json() as RestResponse);
                
        }
        
        // businessSearch(paramObj){
        //     console.log("Fired business Search Api")
        //     return this.http.post("https://servicesdev.valassislab.com/services/v1/targeting/base/targetingsearch/search",paramObj).map(res => res.json() as RestResponse);
        // }
        

}