import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { accumulateArrays, formatMilli } from '@val/common';
import { EsriQueryService } from '@val/esri';
import { ErrorNotification, StartLiveIndicator, StopLiveIndicator, WarningNotification } from '@val/messaging';
import { AppConfig } from 'app/app.config';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes, TradeAreaTypeCodes } from 'app/impower-datastore/state/models/impower-model.enums';
import { ValGeocodingRequest } from 'app/models/val-geocoding-request.model';
import { AppGeocodingService } from 'app/services/app-geocoding.service';
import { AppLocationService } from 'app/services/app-location.service';
import { AppLoggingService } from 'app/services/app-logging.service';
import { AppProjectService } from 'app/services/app-project.service';
import { AppRendererService } from 'app/services/app-renderer.service';
import { AppStateService } from 'app/services/app-state.service';
import { FullAppState } from 'app/state/app.interfaces';
import { Geocode } from 'app/state/homeGeocode/homeGeo.actions';
import { ImpGeofootprintLocation } from 'app/val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintLocAttrib } from 'app/val-modules/targeting/models/ImpGeofootprintLocAttrib';
import { ImpGeofootprintTradeArea } from 'app/val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpProject } from 'app/val-modules/targeting/models/ImpProject';
import { ImpDomainFactoryService } from 'app/val-modules/targeting/services/imp-domain-factory.service';
import { ImpGeofootprintGeoService } from 'app/val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintLocationService } from 'app/val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintTradeAreaService } from 'app/val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { BehaviorSubject, merge, Observable } from 'rxjs';
import { reduce, tap } from 'rxjs/operators';
import { DAOBaseStatus } from '../../../val-modules/api/models/BaseModel';
import { ImpGeofootprintGeo } from '../../../val-modules/targeting/models/ImpGeofootprintGeo';

class ContainerValue {
  id:       number;
  code:     string;
  name:     string;
  state:    string;
  isActive: boolean;
  geocodes: string[];

  constructor(data: Partial<ContainerValue>) {
    Object.assign(this, data);
    this.isActive = false;
  }

  public toString = () => JSON.stringify(this, null, '   ');
}

@Component({
  selector: 'val-market-locations',
  templateUrl: './market-locations.component.html'
})
export class MarketLocationsComponent implements OnInit {
  public  locationType: ImpClientLocationTypeCodes;

  private readonly busyKey = 'MarketLocationsAdd';

  private project: ImpProject;
  private analysisLevel: string;
  private spinnerBS$ = new BehaviorSubject<string>('Creating Locations From Markets');
  private createLocationsStart: number;

  constructor(
    private esriQueryService: EsriQueryService,
    private factoryService: ImpDomainFactoryService,
    private locationService: AppLocationService,
    private projectService: AppProjectService,
    private appStateService: AppStateService,
    private store$: Store<FullAppState>,
    private geocoderService: AppGeocodingService,
    private impGeofootprintLocationService: ImpGeofootprintLocationService,
    private impGeofootprintTradeAreaService: ImpGeofootprintTradeAreaService,
    private impGeofootprintGeoService: ImpGeofootprintGeoService,
    private appRendererService: AppRendererService,
    private appConfig: AppConfig,
    private logger: AppLoggingService) { }

  ngOnInit() {
    this.locationType = ImpClientLocationTypeCodes.Site;
    this.projectService.currentProject$.subscribe(p => {
      this.project = p;
      this.analysisLevel = this.appStateService.analysisLevel$.getValue();
    });
  }

  // Event that fires when geos are starting to be retrieved
  public onGetGeos(event: any)
  {
    this.createLocationsStart = performance.now();
    this.spinnerBS$.next(`Determining geos for ${event.markets.length} ${event.containerName} markets`);
    this.store$.dispatch(new StartLiveIndicator({ key: this.busyKey, messageSource: this.spinnerBS$}));
  }

  // Event that fires once geos have been retrieved
  public onGeosRetrieved(event: any)
  {
    this.spinnerBS$.next('Finished retrieving geos, starting to create locations');
    this.createLocations(event.market, event.values);
  }

  public onGetGeosError(event: any)
  {
    this.logger.error.log('onGetGeoErrors errored', event);
//  this.store$.dispatch(new StopLiveIndicator({ key: this.busyKey }));
  }

  private getQueryField(marketCode: string) : string
  {
    let queryField: string = null;

    switch (marketCode) {
      case 'DMA':
            queryField = 'dma_code';
            break;
      case 'PRICING':
            queryField = 'pricing_mkt';
            break;
      case 'WRAP':
            queryField = 'wrap';
            break;
      case 'WRAP2':
            queryField = 'wrap_secondary';
            break;
      case 'SDM':
            queryField = 'sdm';
            break;
      case 'CBSA':
            queryField = 'cbsa';
            break;
      case 'INFOSCAN':
            queryField = 'infoscan_code';
            break;
      case 'SCANTRACK':
            queryField = 'scantrack_code';
            break;
      case 'COUNTY':
            queryField = 'county';
            break;
      case 'STATE':
            queryField = 'state_abbr';
            break;
      case 'CITY':
            queryField = 'city_name';
            break;
    }

    return queryField;
  }

  private createLocations(marketCode: string, marketList: ContainerValue[]) {
    try
    {
    this.logger.info.log('createLocations fired: marketCode: ' + marketCode);
    //this.locationService.clearAll();  // Enable to only allow one market type per project
    const ids: string[] = [];
    const centroidGeos: string[] = [];
    let numGeos = 0;

    const syncWait = ms => {
      const end = Date.now() + ms;
      while (Date.now() < end) continue;
    };

    // Build an array of markets to process and count total number of geos
    let existingMkts: string = '';
    const existingIds: string[] = [];
    this.logger.info.groupCollapsed('Market Geo Counts (', formatMilli(performance.now() - this.createLocationsStart), ')');
    marketList.forEach(d => {
      if (this.impGeofootprintLocationService.get().filter(loc => loc.locationNumber === (d.id == null ? d.code : d.id.toString())).length > 0) {
        existingMkts += d.code + ' - ' + d.name + '\n';
        existingIds.push(d.id == null ? d.code : d.id.toString());
      }
      else {
        ids.push(marketCode === 'STATE' ? d.state : d.code);
        numGeos += d.geocodes.length;
        centroidGeos.push(d.geocodes[0]);
        this.logger.info.log('Market: ' + (d.name != null ? d.name : d.code) + ' has ' + d.geocodes.length + ' geos');
      }
    });
    this.logger.info.groupEnd();

    if (existingMkts !== '') {
      this.store$.dispatch(new WarningNotification({ message: existingMkts, notificationTitle: 'These locations already exist' }));
      marketList = marketList.filter(market => !existingIds.includes(market.id == null ? market.code : market.id.toString()));
    }

    if (marketList == null || marketList.length === 0) {
      this.reportError('Could not create market sites', 'There were no valid markets to use', { marketCode: marketCode, invalidMarkets: existingMkts }, this.createLocationsStart);
      return;
    }

    if (centroidGeos.length == 0) {
      this.reportError('Could not create market sites', 'There were no geos returned for those markets', { marketCode: marketCode, markets: marketList }, this.createLocationsStart);
    }

    const layerId = this.appConfig.getLayerIdForAnalysisLevel(this.project.methAnalysis);
    const queryField: string = this.getQueryField(marketCode);
    const locations: ImpGeofootprintLocation[] = [];

    this.logger.debug.log('marketCode: ', marketCode, ', analysisLevel: ', this.analysisLevel, 'queryField: ', queryField, ', centroidGeos: ', centroidGeos);
    this.spinnerBS$.next(`Creating ${marketList.length} locations`);

    // Query for geos that will become the locations homegeo
    try
    {
      let currGeos = 0;
      let index = 0;

      this.store$.dispatch(new StartLiveIndicator({ key: this.busyKey, messageSource: this.spinnerBS$}));

      const observables: Observable<ImpGeofootprintTradeArea>[] = [];
      marketList.forEach(market => {
        index++;
        currGeos += market.geocodes.length;
        // Determine what to look up the market information with
        const marketIdx = marketCode === 'STATE' ? market.state : market.code;

        this.spinnerBS$.next(`Creating location ${market.code}`);

        if (this.impGeofootprintLocationService.get().filter(loc => loc.locationNumber === market.code).length === 0)
        {
          this.logger.debug.log('marketId: ' + market.id + ', marketCode: ' + market.code + ' data store count: '
                            + this.impGeofootprintLocationService.get().filter(loc => loc.locationNumber == market.code).length
                            + ', locations count: ' + locations.filter(loc => loc.locationNumber == market.code).length);

          // Create a new location
          this.spinnerBS$.next(`Creating location ${market.code} ${index}/${marketList.length} - ${currGeos}/${numGeos} geos`);
          const location: ImpGeofootprintLocation = new ImpGeofootprintLocation();
          location.baseStatus = DAOBaseStatus.INSERT;
          location.locationNumber = market.id == null ? market.code : market.id.toString();
          location.locationName = market.name;
          location.marketCode = market.code;
          location.marketName = market.name;
          location.impGeofootprintLocAttribs = new Array<ImpGeofootprintLocAttrib>();
          location.clientLocationTypeCode = this.locationType;
          // Mandatory fields for saving
          location.clientIdentifierId = 123;
          location.recordStatusCode = 'PROVIDED';
          location.isActive = true;
          location.impProject = this.project;
          switch (this.project.methAnalysis) {
            case 'ZIP':
              location.homeZip = location.homeGeocode;
              break;
            case 'ATZ':
              location.homeAtz = location.homeGeocode;
              break;
            case 'PCR':
              location.homePcr = location.homeGeocode;
              break;
          }
          observables.push(this.createTradeArea(market, location));
          locations.push(location);
        }
        else {
          const dupeLocMsg = 'A location for market: ' + market.code + ' - ' + market.name + ' already exists';
          this.logger.warn.log(dupeLocMsg);
          this.store$.dispatch(new WarningNotification({ message: dupeLocMsg, notificationTitle: 'Duplicate Location' }));
        }
      }
      );

      if (locations.length <= 0) {
        this.reportError('Process Could Not Continue', 'There were no new locations to add', null, this.createLocationsStart);
        return;
      }

      const newTAs: ImpGeofootprintTradeArea[] = [];
      const newGeos: ImpGeofootprintGeo[] = [];

      let currCount = 0;
      merge(...observables, 4).pipe(
        tap(ta => this.spinnerBS$.next(`Processing ${currCount++} / ${observables.length} - ${ta.impGeofootprintLocation.locationName}`)),
        reduce((a, c) => accumulateArrays(a, [c]), [] as ImpGeofootprintTradeArea[])
      ).subscribe(tradeAreas => {
          this.logger.info.log('Creating', tradeAreas.length, 'locations / trade areas');

          const allGeos: ImpGeofootprintGeo[] = [];
          this.spinnerBS$.next(`Assigning Location Home Geocodes`);
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
          this.spinnerBS$.next(`Finalizing Locations`);
          this.project.impGeofootprintMasters[0].impGeofootprintLocations.push(...locations);
          this.locationService.persistLocationsAndAttributes(locations);
          this.impGeofootprintGeoService.add(allGeos);
          this.impGeofootprintTradeAreaService.add(tradeAreas);
          this.store$.dispatch(new StopLiveIndicator({ key: this.busyKey }));
          this.logger.info.log('Market locations completed successfully (', formatMilli(performance.now() - this.createLocationsStart), ')');
        },
        err => {
          this.reportError('Error creating market sites\n', 'ERROR:\n' + err, err, this.createLocationsStart);
        });
      }
      catch (exception)
      {
        this.reportError('Could not create market sites', '\t\t¯\\_(ツ)_/¯\nUNEXPECTED ERROR:\n' + exception, exception, this.createLocationsStart);
      }
    }
    catch (exception)
    {
      this.reportError('Could not create market sites', '\t\t¯\\_(ツ)_/¯\nUNEXPECTED ERROR:\n' + exception, exception, this.createLocationsStart);
    }
  }

  public onListTypeChange(data: 'Site' | 'Competitor') {
    this.logger.info.log('onListTypeChange fired - ' + data);
  }

  manuallyGeocode(site: ValGeocodingRequest, siteType: SuccessfulLocationTypeCodes, isEdit?: boolean) {
    //validate Manually added geocodes
    const locations = this.impGeofootprintLocationService.get();
/* PB       if (locations.filter(loc => loc.locationNumber === site.number).length > 0 && siteType !== ImpClientLocationTypeCodes.Competitor){
      this.store$.dispatch(new ErrorNotification({ message: 'Site Number already exist on the project.', notificationTitle: 'Geocoding Error' }));
      this.geocoderService.duplicateKeyMap.get(siteType).add(site.number);
    }
    else*/ {
      // const mktValue = site.Market != null ? `~Market=${site.Market}` : '';
      // const metricsText = `Number=${site.number}~Name=${site.name}~Street=${site.street}~City=${site.city}~State=${site.state}~ZIP=${site.zip}${mktValue}`;
      // this.store$.dispatch(new CreateLocationUsageMetric('single-site', 'add', metricsText));
      this.processSiteRequests(site,  siteType, isEdit);
      if (siteType !== ImpClientLocationTypeCodes.Competitor)
        this.geocoderService.duplicateKeyMap.get(siteType).add(site.number);
    }
  }

  processSiteRequests(siteOrSites: ValGeocodingRequest | ValGeocodingRequest[], siteType: SuccessfulLocationTypeCodes, isEdit?: boolean) {
    const sites = Array.isArray(siteOrSites) ? siteOrSites : [siteOrSites];
    const reCalculateHomeGeos = false;
    const isLocationEdit: boolean =  (isEdit !== null && isEdit !== undefined) ? isEdit : false;
    this.store$.dispatch(new Geocode({sites, siteType, reCalculateHomeGeos, isLocationEdit}));
  }

  private createTradeArea(market: ContainerValue, loc: ImpGeofootprintLocation) : Observable<ImpGeofootprintTradeArea>
  {
    const layerId = this.appConfig.getLayerIdForAnalysisLevel(this.project.methAnalysis);
    const newTA = this.factoryService.createTradeArea(loc, TradeAreaTypeCodes.Custom);
    // We need to query for the latitude and longitude of the new geos so all downstream things will still work, like printing
    return this.esriQueryService.queryAttributeIn(layerId, 'geocode', market.geocodes, false, ['geocode', 'latitude', 'longitude']).pipe(
      reduce((tradeArea, graphics) => {
        graphics.forEach(g => this.factoryService.createGeo(tradeArea, g.getAttribute('geocode'), g.getAttribute('longitude'), g.getAttribute('latitude'), 0));
        return tradeArea;
      }, newTA)
    );
  }

  private reportError(errorHeader: string, errorMessage: string, errorObject: any, startTime: number) {
    this.logger.error.log(errorHeader + ' (', formatMilli(performance.now() - startTime), ')', errorObject);
    this.store$.dispatch(new StopLiveIndicator({ key: this.busyKey }));
    this.store$.dispatch(new ErrorNotification({ message: errorMessage, notificationTitle: errorHeader, additionalErrorInfo: errorObject }));
  }

}
