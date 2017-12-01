// Added nallana: US6087  
import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import { RestResponse } from '../Models/RestResponse';
import { EsriLoaderWrapperService } from './esri-loader-wrapper.service';
import { MapService } from './map.service';

@Injectable()
export class AppService {
    private static mapView: __esri.MapView;
    //public categoryList = '/assets/demo/searchData/categories.json'; 
    public categoryList = [
        { category: 52, sic: '5211-14', name: 'ROOFING MATERIALS' },
        { category: 52, sic: '5211-15', name: 'SHINGLES & SHAKES' },
        { category: 52, sic: '5211-16', name: 'SCREENS-DOOR & WINDOW' },
        { category: 73, sic: '7342-08', name: 'SPRAYING-INSECT CONTROL' },
        { category: 73, sic: '7342-09', name: 'SMOKE ODOR COUNTERACTING' },
        { category: 73, sic: '7342-10', name: 'BEE REMOVAL' },
        { category: 75, sic: '7539-36', name: 'STEERING SYSTEMS & EQUIPMENT-REPAIRING' },
        { category: 75, sic: '7539-38', name: 'WHEEL SUSPENSION SYSTEMS' },
        { category: 75, sic: '7539-39', name: 'TRUCK AIR CONDITIONING EQUIP-REPAIRING' },
        { category: 80, sic: '8099-33', name: 'AIDS INFORMATION & TESTING' },
        { category: 80, sic: '8099-34', name: 'INSURANCE-MEDICAL EXAMINATIONS' },
        { category: 80, sic: '8099-35', name: 'BED WETTING CONTROL SYSTEMS' },
        { category: 80, sic: '8099-36', name: 'HEALTH EDUCATION' },
        { category: 54, sic: '5461-05', name: 'DOUGHNUTS' },
        { category: 54, sic: '5461-06', name: 'CAKE DECORATING' },
        { category: 54, sic: '5461-07', name: 'COOKIES & CRACKERS' },
        { category: 54, sic: '5461-08', name: 'PRETZELS-RETAIL' },
        { category: 55, sic: '5511-04', name: 'FOUR WHEEL DRIVE VEHICLES' },
        { category: 55, sic: '5511-05', name: 'TRUCK-DEALERS' },
        { category: 56, sic: '5641-14', name: 'UNDERWEAR-CHILDRENS' },
        { category: 56, sic: '5641-15', name: 'BABY ACCESSORIES-RENTAL' },,
        { category: 57, sic: '5712-05', name: 'TABLE TOPS' },
        { category: 57, sic: '5712-06', name: 'WATER BEDS' },
        { category: 57, sic: '5712-07', name: 'FURNITURE-WICKER' },
        { category: 57, sic: '5712-08', name: 'APARTMENT FURNISHINGS' },
        { category: 72, sic: '7251-03', name: 'SHOE SHINING' },
        { category: 72, sic: '7251-04', name: 'SHOE DYERS' },
        { category: 82, sic: '8299-21', name: 'CERAMICS-INSTRUCTION' },
        { category: 82, sic: '8299-22', name: 'BATON TWIRLING INSTRUCTION' },
        { category: 82, sic: '8299-23', name: 'CRAFT-INSTRUCTION' },
    ];

    /* saveTargetingProfile(targetingprofile : TargetingProfile){
         
                 console.log("fired GeoFootPrint saveTarhetingProfile Service "+JSON.stringify(targetingprofile,null,4));
                
                 return this.http.post("http://servicesdev.valassislab.com/services/v1/targeting/base/targetingprofile/save", targetingprofile).map(res => res.json() as RestResponse);
         
             } */
    private readonly searchbusiness = 'https://servicesdev.valassislab.com/services/v1/targeting/base/targetingsearch/search';


    constructor(private http: Http, private mapService: MapService) { }
    // //load values from the json 
    // public getList(): Observable<any> {
    //     return this.http.get(`${this.categoryList}`)
    //         .map((resp: Response) => resp.json());
    // }

    //use the getbusiness method to get the data from the service
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