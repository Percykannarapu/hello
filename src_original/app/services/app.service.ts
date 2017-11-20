// Added nallana: US6087  
import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

@Injectable()
export class AppService {

    public categoriesList = [
        {name: 'CLINICS', primarysic: '8011-04'},
        {name: 'PHYSICIANS & SURGEONS-EMERGENCY SERVICE', primarysic: '8011-05'},
        {name:'PSYCHOANALYSTS', primarysic: '8011-06'},
        {name:'TATTOOS-REMOVED', primarysic: '8011-07'},
        {name:'ANESTHETISTS', primarysic: '8011-08'},
        {name:'OPHTHALMOLOGISTS', primarysic: '8011-11'},
        {name:'PSYCHIATRY-ADULT CHILD & ADOLESCENT', primarysic: '8011-13'},
        {name:'PHYSICIANS & SURGEONS', primarysic: '8011-01'},
        {name:'SPORTS MEDICINE & INJURIES', primarysic: '8011-02'},
        {name:'ALLERGY PHYSICIANS', primarysic: '8011-20'},
        {name:'INDIAN GOODS', primarysic: '5947-09'},
    ]

    // public readonly categoryList = 'assets/categories.json'; 

    // constructor(private http: Http) { }
    // public getList(): Observable<any> {
    //     return this.http.get(`${this.categoryList}`)
    //         .map((resp: Response) => resp.json());
    // }

    private readonly searchbusiness = 'https://services.valassislab.com/services/v1/mediaexpress/base/targetingsearch/search';
    
        constructor(private http: Http) { }
        public getbusinesses(): Observable<any> {

            let paramObj = {
                "sites": [
                    {
                        "x": "-117.351856",
                        "y": "34.470195"
                    },
                    {
                        "x": "-117.156703",
                        "y": "33.684842"
                    },
                    {
                        "x": "-84.30181",
                        "y": "33.898628"
                    }
                    
                ],
                "sics": [
                    {
                        "sic": "8011-01"
                    },
                    {
                        "sic": "8011-05"
                    }
                ],
                "radius": "3",
                "name": "INSTITUTE",
                "city": "ST LOUIS",
                "state": "MO",
                "zip": "63127",
                "countyName": "SAINT LOUIS",
                "eliminateBlankFirmNames": "True",
                "siteLimit": "200"
            };

            return this.http.post(`${this.searchbusiness}`, paramObj)
                .map((resp: Response) => resp.json());
        }

}

