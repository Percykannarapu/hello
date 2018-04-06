import { Subject } from 'rxjs/Subject';
import { Injectable, EventEmitter } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import { RestResponse } from '../models/RestResponse';
import { EsriLoaderWrapperService } from './esri-loader-wrapper.service';
import { MapService } from './map.service';
import { AppConfig } from '../app.config';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

export interface BusinessSearchResult {
  firm: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  zip4: string;
  cart: string;
  atz: string;
  atz_name: string;
  carrier_route_name: string;
  x: number;
  y: number;
  location_type: string;
  primarysic: string;
  primarylob: string;
  fran_1: string;
  fran_2: string;
  sic2: string;
  sic_name2: string;
  sic3: string;
  sic_name3: string;
  sic4: string;
  sic_name4: string;
  abino: string;
  match_code: string;
  cbsa_code: string;
  cbsa_name: string;
  dma_code: string;
  dma_name: string;
  county_code: string;
  county_name: string;
  wrap_id: number;
  wrap_name: string;
  wrap_secondary_id: number;
  wrap_secondary_name: string;
  sdm_id: number;
  sdm_name: string;
  pricing_market_id: number;
  pricing_market_name: string;
  fk_site: number;
  site_name: string;
  dist_to_site: number;
}

@Injectable()
export class AppService {
  private readonly businessSearch = 'v1/targeting/base/targetingsearch/search';
  private readonly categoryList = './assets/demo/data/categories.json';

  public closeOverLayPanel: Subject<any> = new Subject<any>();

  constructor(private http: HttpClient, private config: AppConfig) { }
  //load values from the json
  public getList() : Observable<any> {
    return this.http.get(this.categoryList);
  }

  public getBusinesses(paramObj) : Observable<BusinessSearchResult[]> {
    return this.http.post(this.config.valServiceBase + this.businessSearch, paramObj).pipe(
      map(result => result['payload'].rows as BusinessSearchResult[])
    );
  }
}
