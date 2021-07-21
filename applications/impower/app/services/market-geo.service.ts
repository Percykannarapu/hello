import { Injectable } from '@angular/core';
import { groupToEntity, isEmpty } from '@val/common';
import { EMPTY, Observable, of, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { RestPayload, ServiceError } from '../../worker-shared/data-model/core.interfaces';
import { ContainerPayload, ContainerValue, KeyedGeocodes } from '../../worker-shared/data-model/other/market-geo.model';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { AppLoggingService } from './app-logging.service';
import { AppStateService } from './app-state.service';

interface GetGeosForContainerResponse {
  geocode:   string;
  state:     string;
  county:    string;
  city:      string;
  dma:       string;
  sdmId:     number;
  cbsa:      string;
  infoscan:  string;
  scantrack: string;
  wrapMktId: number;
  wrapMktIdSecondary: number;
  pricingMktId: number;
}

@Injectable({
  providedIn: 'root'
})
export class MarketGeoService {

  private readonly geoContainerLookupUrl = 'v1/targeting/base/geoinfo/geocontainerlookup';
  private readonly getGeosForContainerUrl = 'v1/targeting/base/geoinfo/getGeosForContainer';

  constructor(private appStateService: AppStateService,
              private logger: AppLoggingService,
              private restService: RestDataService) { }

  getContainerData(container: string, states?: string) : Observable<ContainerValue[]> {
    let gridKey: keyof ContainerPayload;
    switch (container) {
      case 'PRICING':
      case 'WRAP':
      case 'WRAP2':
      case 'SDM':
        gridKey = 'id';
        break;
      case 'STATE':
        gridKey = 'state';
        break;
      default:
        gridKey = 'code';
    }
    const lookupUrl = `${this.geoContainerLookupUrl}/${container}` + (states != null ? `?states=${states}` : '');
    return this.restService.get(lookupUrl).pipe(
      map((result: any) => result.payload.rows || []),
      map(data => data.map(result => new ContainerValue(result, gridKey)))
    );
  }

  getGeographies(geocodes: string[], container: string) : Observable<KeyedGeocodes> {
    if (isEmpty(geocodes) || isEmpty(container)) return EMPTY;
    const analysisLevel = this.appStateService.analysisLevel$.getValue();
    if (isEmpty(analysisLevel)) return throwError(new Error('You must select an analysis level before retrieving geography.'));
    const inputData = {
      chunks: 1,
      analysisLevel,
      geocodes,
      container
    };
    if (inputData.analysisLevel === 'Digital ATZ') inputData.analysisLevel = 'DTZ';
    return this.restService.post<RestPayload<GetGeosForContainerResponse>>(this.getGeosForContainerUrl, [inputData]).pipe(
      map(results => {
        if (results?.returnCode === 200) {
          return this.transformMarketGeoResponse(results.payload.rows, container);
        } else {
          throw new ServiceError('Error getting market geos', this.getGeosForContainerUrl, [inputData], results);
        }
      }),
    );
  }

  private transformMarketGeoResponse(result: GetGeosForContainerResponse[], requestedContainer: string) : KeyedGeocodes {
    return groupToEntity(result, geo => {
      switch (requestedContainer) {
        case 'DMA':       return geo.dma;
        case 'PRICING':   return `${geo.pricingMktId}`;
        case 'WRAP':      return `${geo.wrapMktId}`;
        case 'WRAP2':     return `${geo.wrapMktIdSecondary}`;
        case 'SDM':       return `${geo.sdmId}`;
        case 'CBSA':      return geo.cbsa;
        case 'INFOSCAN':  return geo.infoscan;
        case 'SCANTRACK': return geo.scantrack;
        case 'COUNTY':    return geo.county;
        case 'CITY':      return geo.city;
        case 'STATE':     return geo.state;
      }
    }, geo => geo.geocode);
  }
}
