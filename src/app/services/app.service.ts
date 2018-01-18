// Added nallana: US6087  
import { Subject } from 'rxjs/Subject';
import { Injectable, EventEmitter } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import { RestResponse } from '../Models/RestResponse';
import { EsriLoaderWrapperService } from './esri-loader-wrapper.service';
import { MapService } from './map.service';

@Injectable()
export class AppService {
    private static mapView: __esri.MapView;
    // updateColorBoxValue: EventEmitter<any> = new EventEmitter<any>();
    closeOverLayPanel: Subject<any> = new Subject<any>();
    public categoryList = './assets/demo/data/categories.json'; 
    
    /* saveTargetingProfile(targetingprofile : TargetingProfile){
         
                 console.log("fired GeoFootPrint saveTarhetingProfile Service "+JSON.stringify(targetingprofile,null,4));
                
                 return this.http.post("http://servicesdev.valassislab.com/services/v1/targeting/base/targetingprofile/save", targetingprofile).map(res => res.json() as RestResponse);
         
             } */
    private readonly searchbusiness = 'https://servicesdev.valassislab.com/services/v1/targeting/base/targetingsearch/search';

    constructor(private http: Http, private mapService: MapService) { }
    //load values from the json 
    public getList() : Observable<any> {
        return this.http.get(`${this.categoryList}`)
            .map((resp: Response) => resp.json());
    }

    //use the getbusiness method to get the data from the service
    public getBusinesses(paramObj) : Observable<any> {

        console.log('Fired getbusiness');
        return this.http.post(`${this.searchbusiness}`, paramObj)
            .map((resp: Response) => resp.json() as RestResponse);

    }

    // businessSearch(paramObj){
    //     console.log("Fired business Search Api")
    //     return this.http.post("https://servicesdev.valassislab.com/services/v1/targeting/base/targetingsearch/search",paramObj).map(res => res.json() as RestResponse);
    // }


}