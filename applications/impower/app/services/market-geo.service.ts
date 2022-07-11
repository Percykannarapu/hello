import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { accumulateArrays, groupToEntity, isEmpty, mapByExtended } from '@val/common';
import { EsriConfigService, EsriQueryService, LayerTypes } from '@val/esri';
import { StartLiveIndicator, StopLiveIndicator, WarningNotification } from '@val/messaging';
import { AppLocationService } from 'app/services/app-location.service';
import { FullAppState } from 'app/state/app.interfaces';
import { ImpGeofootprintGeo } from 'app/val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintLocation } from 'app/val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintTradeArea } from 'app/val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpProject } from 'app/val-modules/targeting/models/ImpProject';
import { ImpDomainFactoryService } from 'app/val-modules/targeting/services/imp-domain-factory.service';
import { ImpGeofootprintGeoService } from 'app/val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintLocationService } from 'app/val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintTradeAreaService } from 'app/val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { BehaviorSubject, EMPTY, merge, Observable, throwError } from 'rxjs';
import { finalize, map, reduce, switchMap, tap } from 'rxjs/operators';
import { RestPayload, ServiceError } from 'worker-shared/data-model/core.interfaces';
import { DAOBaseStatus, ImpClientLocationTypeCodes, TradeAreaTypeCodes } from 'worker-shared/data-model/impower.data-model.enums';
import { ContainerPayload, ContainerValue, KeyedGeocodes } from 'worker-shared/data-model/other/market-geo.model';
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

  private busyStateKey = 'Create Market Locations';
  private liveBusyState$ = new BehaviorSubject<string>('Creating Locations From Markets');

  private readonly geoContainerLookupUrl = 'v1/targeting/base/geoinfo/geocontainerlookup';
  private readonly getGeosForContainerUrl = 'v1/targeting/base/geoinfo/getGeosForContainer';

  constructor(private appStateService: AppStateService,
              private logger: AppLoggingService,
              private restService: RestDataService,
              private store$: Store<FullAppState>,
              private impGeofootprintLocationService: ImpGeofootprintLocationService,
              private impGeofootprintTradeAreaService: ImpGeofootprintTradeAreaService,
              private impGeofootprintGeoService: ImpGeofootprintGeoService,
              private esriService: EsriConfigService,
              private esriQueryService: EsriQueryService,
              private factoryService: ImpDomainFactoryService,
              private locationService: AppLocationService) { }

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

  public createMarketLocations(container: string,  containerName: string,  markets: string[], selectedContainers: ContainerValue[]) : Observable<any> {
    this.liveBusyState$.next(`Determining geos for ${markets.length} ${containerName} markets`);
    this.store$.dispatch(new StartLiveIndicator({ key: this.busyStateKey, messageSource: this.liveBusyState$}));
    return this.getGeographies(markets, container).pipe(
      map(geoResults => selectedContainers.map(cv => ({ ...cv, geocodes: geoResults[cv.gridKey] }))),
      tap(() => this.liveBusyState$.next('Finished retrieving geos, starting to create locations')),
      switchMap(enrichedContainers => this.createLocations(container, enrichedContainers)),
      finalize(() => this.store$.dispatch(new StopLiveIndicator({ key: this.busyStateKey })))
    );
  }

  private createLocations(marketCode: string, marketList: ContainerValue[]) : Observable<any> {
    this.logger.info.log('createLocations fired: marketCode: ' + marketCode);
    const locationMap = mapByExtended(this.impGeofootprintLocationService.get(), loc => loc.locationNumber);
    const centroidGeos: string[] = [];
    const currentProject = this.appStateService.currentProject$.getValue();
    let localMarketList = Array.from(marketList);
    let numGeos = 0;

    // Build an array of markets to process and count total number of geos
    const existingMarkets: string[] = [];
    const existingIds = new Set<string>();
    const emptyMarkets: ContainerValue[] = [];
    this.logger.info.groupCollapsed('Market Geo Counts');
    localMarketList.forEach(d => {
      if (isEmpty(d.geocodes)) {
        emptyMarkets.push(d);
      } else if (locationMap.has(`${d.id ?? d.code}`)) {
        existingMarkets.push(`${d.code} - ${d.name}`);
        existingIds.add(`${d.id ?? d.code}`);
      } else {
        numGeos += d.geocodes.length;
        centroidGeos.push(d.geocodes[0]);
        this.logger.info.log('Market: ' + (d.name != null ? d.name : d.code) + ' has ' + d.geocodes.length + ' geos');
      }
    });
    this.logger.info.groupEnd();
    if (!isEmpty(emptyMarkets)) {
      this.store$.dispatch(WarningNotification({ message: emptyMarkets.map(w => w.name).join('\n'), notificationTitle: 'These markets have no geos'}));
      this.logger.warn.groupCollapsed('Market Geo Warnings');
      emptyMarkets.forEach(w => this.logger.warn.log('Empty Market:', w));
      this.logger.warn.groupEnd();
      // remove empty markets from further processing
      localMarketList = localMarketList.filter(market => market.geocodes?.length ?? 0 !== 0);
    }

    if (!isEmpty(existingMarkets)) {
      this.store$.dispatch(WarningNotification({ message: existingMarkets.join('\n'), notificationTitle: 'These locations already exist' }));
      // remove markets that existed prior to this run
      localMarketList = localMarketList.filter(market => !existingIds.has(`${market.id ?? market.code}`));
    }

    if (isEmpty(localMarketList)) {
      return throwError({ message: 'There were no valid markets to use' });
    }

    const newLocations: ImpGeofootprintLocation[] = [];
    this.logger.debug.log('marketCode: ', marketCode, ', centroidGeos: ', centroidGeos);
    this.liveBusyState$.next(`Creating ${localMarketList.length} locations`);
    // Query for geos that will become the locations homegeo

    let currGeos = 0;
    const observables: Observable<ImpGeofootprintTradeArea>[] = [];
    localMarketList.forEach((market, index) => {
      currGeos += market.geocodes.length;
      this.liveBusyState$.next(`Creating location ${market.code}`);

      if (!locationMap.has(market.code)) {
        this.logger.debug.log('marketId: ' + market.id + ', marketCode: ' + market.code + ' data store count: 0'
          + ', locations count: ' + newLocations.filter(loc => loc.locationNumber == market.code).length);

        // Create a new location
        this.liveBusyState$.next(`Creating location ${market.code} ${index}/${localMarketList.length} - ${currGeos}/${numGeos} geos`);
        const location: ImpGeofootprintLocation = new ImpGeofootprintLocation();
        location.baseStatus = DAOBaseStatus.INSERT;
        location.locationNumber = market.id == null ? market.code : market.id.toString();
        location.locationName = market.name;
        location.marketCode = market.code;
        location.marketName = market.name;
        location.impGeofootprintLocAttribs = [];
        location.clientLocationTypeCode = ImpClientLocationTypeCodes.Site;
        // Mandatory fields for saving
        location.clientIdentifierId = 123;
        location.recordStatusCode = 'PROVIDED';
        location.isActive = true;
        location.impProject = currentProject;
        observables.push(this.createTradeArea(market, location, currentProject));
        newLocations.push(location);
      } else {
        const dupeLocMsg = 'A location for market: ' + market.code + ' - ' + market.name + ' already exists';
        this.logger.warn.log(dupeLocMsg);
        this.store$.dispatch(WarningNotification({ message: dupeLocMsg, notificationTitle: 'Duplicate Location' }));
      }
    });

    if (isEmpty(newLocations)) {
      return throwError({ message: 'There were no new locations to add' });
    }

    if (!isEmpty(observables)) {
      let currCount = 0;
      return merge(...observables, 4).pipe(
        tap(ta => this.liveBusyState$.next(`Processing ${currCount++} / ${observables.length} - ${ta.impGeofootprintLocation.locationName}`)),
        reduce((a, c) => accumulateArrays(a, [c]), [] as ImpGeofootprintTradeArea[]),
        tap(tradeAreas => {
          this.logger.info.log('Creating', tradeAreas.length, 'locations / trade areas');

          const allGeos: ImpGeofootprintGeo[] = [];
          this.liveBusyState$.next(`Assigning Location Home Geocodes`);
          tradeAreas.forEach(ta => {
            // Assign a homegeo to the location
            if (ta.impGeofootprintLocation.xcoord == null || ta.impGeofootprintLocation.ycoord == null)
            {
              // Find the first one that has been geocoded successfully
              for (let i = 0; i < ta.impGeofootprintGeos.length; i++)
                if (ta.impGeofootprintGeos[i].xcoord != null && ta.impGeofootprintGeos[i].ycoord != null)
                {
                  ta.impGeofootprintLocation.homeGeocode = ta.impGeofootprintGeos[i].geocode;
                  ta.impGeofootprintLocation.xcoord = ta.impGeofootprintGeos[i].xcoord;
                  ta.impGeofootprintLocation.ycoord = ta.impGeofootprintGeos[i].ycoord;
                  break;
                }
            }
            allGeos.push(...ta.impGeofootprintGeos);
          });
          this.logger.info.log('Created', allGeos.length, 'geos');
          this.liveBusyState$.next(`Finalizing Locations`);
          currentProject.impGeofootprintMasters[0].impGeofootprintLocations.push(...newLocations);
          this.locationService.persistLocationsAndAttributes(newLocations);
          this.impGeofootprintGeoService.add(allGeos);
          this.impGeofootprintTradeAreaService.add(tradeAreas);
          this.store$.dispatch(new StopLiveIndicator({ key: this.busyStateKey }));
          this.logger.info.log('Market locations completed successfully');
        })
      );
    } else {
      return EMPTY;
    }
  }

  private createTradeArea(market: ContainerValue, loc: ImpGeofootprintLocation, project: ImpProject) : Observable<ImpGeofootprintTradeArea> {
    const layerId = this.esriService.getLayerUrl(project.methAnalysis, LayerTypes.Point);
    const newTA = this.factoryService.createTradeArea(loc, TradeAreaTypeCodes.Custom);
    // We need to query for the latitude and longitude of the new geos so all downstream things will still work, like printing
    return this.esriQueryService.queryAttributeIn(layerId, 'geocode', market.geocodes, false, ['geocode', 'latitude', 'longitude']).pipe(
      reduce((tradeArea, graphics) => {
        graphics.forEach(g => this.factoryService.createGeo(tradeArea, g.getAttribute('geocode'), g.getAttribute('longitude'), g.getAttribute('latitude'), 0));
        return tradeArea;
      }, newTA)
    );
  }
}
