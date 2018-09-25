import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';
import { AppConfig } from '../app.config';
import { map } from 'rxjs/operators';
import { RestResponse } from '../models/RestResponse';
import { RestDataService } from '../val-modules/common/services/restdata.service';

export interface BusinessSearchResponse {
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

export interface BusinessSearchRequest {
  radius: string;
  name: string;
  city: string;
  state: string;
  zip: string;
  countyName: string;
  eliminateBlankFirmNames: 'True';
  siteLimit: string;
  sites: { x: number, y: number, homeGeocode: string, locationName: string }[];
  sics: { sic: string }[];
}

export interface BusinessSearchCategory {
  category: number;
  sic: string;
  name: string;
}

@Injectable()
export class AppBusinessSearchService {
  private readonly businessSearch = 'v1/targeting/base/targetingsearch/search';
  private readonly categoryList = 'assets/data/categories.json';

  constructor(private restService: RestDataService, private config: AppConfig, private http: HttpClient) { }

  //load values from the json
  public getCategories() : Observable<BusinessSearchCategory[]> {
    // gotta use http rather than restService because restService is tied to Fuse base url
    return this.http.get<RestResponse>(this.config.impowerBaseUrl + this.categoryList).pipe(
      map(result => result.payload.rows as BusinessSearchCategory[])
    );
  }

  public getBusinesses(paramObj: BusinessSearchRequest) : Observable<BusinessSearchResponse[]> {
    return this.restService.post(this.businessSearch, paramObj).pipe(
      map(result => result.payload.rows as BusinessSearchResponse[])
    );
  }
}
