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

    private readonly searchbusiness = 'url';
    
        constructor(private http: Http) { }
        public getbusinesses(paramObj): Observable<any> {
            return this.http.post(`${this.searchbusiness}`, paramObj)
                .map((resp: Response) => resp.json());
        }

}

