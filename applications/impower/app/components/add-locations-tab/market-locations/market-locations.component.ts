import { BehaviorSubject } from 'rxjs';
import { ImpGeofootprintGeoService } from 'app/val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintTradeAreaService } from 'app/val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpGeofootprintLocationService } from 'app/val-modules/targeting/services/ImpGeofootprintLocation.service';
import { Component, OnInit } from '@angular/core';
import { EsriQueryService } from '../../../../../../modules/esri/src/services/esri-query.service';
import { ImpDomainFactoryService } from 'app/val-modules/targeting/services/imp-domain-factory.service';
import { AppLocationService } from 'app/services/app-location.service';
import { AppProjectService } from 'app/services/app-project.service';
import { AppRendererService } from 'app/services/app-renderer.service';
import { AppConfig } from 'app/app.config';
import { ImpGeofootprintLocation } from 'app/val-modules/targeting/models/ImpGeofootprintLocation';
import { ShadingDefinition, ConfigurationTypes } from '../../../../../../modules/esri/src/models/shading-configuration';
import { getUuid } from '../../../../../../modules/common/src/utils';
import { ImpGeofootprintLocAttrib } from 'app/val-modules/targeting/models/ImpGeofootprintLocAttrib';
import { ImpClientLocationTypeCodes, TradeAreaTypeCodes, SuccessfulLocationTypeCodes } from 'app/impower-datastore/state/models/impower-model.enums';
import { ImpProject } from 'app/val-modules/targeting/models/ImpProject';
import { AppStateService } from 'app/services/app-state.service';
import { ValGeocodingRequest } from 'app/models/val-geocoding-request.model';
import { ErrorNotification, WarningNotification } from '../../../../../../modules/messaging/state/messaging.actions';
import { AppGeocodingService } from 'app/services/app-geocoding.service';
import { Store } from '@ngrx/store';
import { FullAppState } from 'app/state/app.interfaces';
import { Geocode } from 'app/state/homeGeocode/homeGeo.actions';
import { AppLoggingService } from 'app/services/app-logging.service';
import { StartLiveIndicator, StopLiveIndicator } from '../../../../../../modules/messaging/state/busyIndicator/busy.state';

class ContainerValue {  //TODO: put in common location
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
  templateUrl: './market-locations.component.html',
  styleUrls:  ['./market-locations.component.scss']
})
export class MarketLocationsComponent implements OnInit {
  public  locationType: ImpClientLocationTypeCodes;

  private readonly busyKey = 'MarketLocationsAdd';

  private project: ImpProject;
  private analysisLevel: string;
  private spinnerBS$ = new BehaviorSubject<string>('Creating Locations From Markets');

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
    this.logger.debug.log('onGetGeoErrors fired', event);
    this.store$.dispatch(new StopLiveIndicator({ key: this.busyKey }));
  }

  private createLocations(marketCode: string, marketList: ContainerValue[]) {
    try
    {
    this.logger.info.log('createLocations fired: marketCode: ' + marketCode);
    //this.locationService.clearAll();
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

    if (existingMkts !== '') {
      this.store$.dispatch(new WarningNotification({ message: existingMkts, notificationTitle: 'These locations already exist' }));
      marketList = marketList.filter(market => !existingIds.includes(market.id == null ? market.code : market.id.toString()));
    }

    if (marketList == null || marketList.length === 0) {
      this.reportError('Could not create market sites', 'There were no valid markets to use', { marketCode: marketCode, invalidMarkets: existingMkts });
      return;
    }

    if (centroidGeos.length == 0) {
      this.reportError('Could not create market sites', 'There were no geos returned for those markets', { marketCode: marketCode, markets: marketList });
    }

    const layerId = this.appConfig.getLayerIdForAnalysisLevel(this.project.methAnalysis);
    const requests: ValGeocodingRequest[] = [];

    this.logger.debug.log('marketCode: ', marketCode, ', analysisLevel: ', this.analysisLevel);

    let queryField: string;
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

    this.logger.debug.log('queryField: ' + queryField + ', centroidGeos: ' + centroidGeos);
    const geoSub = this.esriQueryService.queryAttributeIn(layerId, 'geocode', centroidGeos , true, ['geocode', queryField])
      .subscribe(graphics => {
        this.logger.debug.log('geoSub fired - graphics.length: ' + graphics.length);
        for (const graphic of graphics) {
          const currentCode: string = graphic.getAttribute(queryField);
          this.logger.debug.log('geoSub - currentCode: ' + currentCode + ', geocode: ' + graphic.getAttribute('geocode') + ', x: ' + graphic.geometry['centroid'].x + ', y: ' + graphic.geometry['centroid'].y);
        }
      },
      err => {
        this.logger.error.log('geoSub - There was an error querying the layer', err);
        geoSub.unsubscribe();
      },
      () => {
        this.logger.debug.log('geoSub - Market locations completed successfully');
        geoSub.unsubscribe();
      });

    //this.store$.dispatch(new StartBusyIndicator({ key: this.busyKey, message: `Creating locations for ${marketList.length} markets with ${numGeos} geos`}));
    this.logger.debug.log('Starting location creation, queryField: ' + queryField);

    const locations: ImpGeofootprintLocation[] = [];
    this.spinnerBS$.next(`Creating ${marketList.length} locations`);

    // Query for geos that will become the locations homegeo
    const marketInfo: { [key: string] : any; } = {};
    const querySub = this.esriQueryService.queryAttributeIn(layerId, 'geocode', centroidGeos , false, ['geocode', 'longitude', 'latitude', queryField])
      .subscribe(graphics => {
          for (const graphic of graphics) {
            const currentCode: string = graphic.getAttribute(queryField).toString();
            if (currentCode != null)
              marketInfo[currentCode] = { homegeo: graphic.getAttribute('geocode'),
                                          xcoord:  graphic.getAttribute('longitude'),
                                          ycoord:  graphic.getAttribute('latitude')
                                        };
          }
        },
        err => {
          this.logger.error.log('There was an error querying the layer', err);
          this.store$.dispatch(new StopLiveIndicator({ key: this.busyKey }));
        },
        () => {
          try
          {
          let currGeos = 0;
          let index = 0;

          querySub.unsubscribe();
          marketList.forEach(market => {
            index++;
            currGeos += market.geocodes.length;
            // Determine what to look up the market information with
//          const marketIdx = ['WRAP', 'WRAP2'].includes(marketCode) ? market.id.toString() : market.code;
            const marketIdx = marketCode === 'STATE' ? market.state : market.code;

            //this.logger.info.log('TEST results - xcoord: ' + marketInfo[marketIdx].xcoord + ', ycoord: ' + marketInfo[marketIdx].ycoord);
            this.spinnerBS$.next(`Creating location ${market.code} - xcoord: ${marketInfo[marketIdx].xcoord}, ycoord: ${marketInfo[marketIdx].ycoord}`);

            if (this.impGeofootprintLocationService.get().filter(loc => loc.locationNumber === market.code).length === 0)
            {
              this.logger.debug.log('marketId: ' + market.id + ', marketCode: ' + market.code + ' data store count: '
                                + this.impGeofootprintLocationService.get().filter(loc => loc.locationNumber == market.code).length
                                + ', locations count: ' + locations.filter(loc => loc.locationNumber == market.code).length);

              // Create a new location
              this.spinnerBS$.next(`Creating location ${market.code} ${index}/${marketList.length} - ${currGeos}/${numGeos} geos`);
              this.logger.info.log(`Creating location ${market.code} ${index}/${marketList.length} - ${currGeos}/${numGeos} geos`);
              const location: ImpGeofootprintLocation = new ImpGeofootprintLocation();
              location.xcoord = marketInfo[marketIdx].xcoord;
              location.ycoord = marketInfo[marketIdx].ycoord;
              location.locationNumber = market.id == null ? market.code : market.id.toString();
              location.locationName = market.name;
              location.marketCode = market.code;
              location.marketName = market.name;
              location.impGeofootprintLocAttribs = new Array<ImpGeofootprintLocAttrib>();
              location.clientLocationTypeCode = this.locationType;
              location.isActive = true;
              location.impProject = this.project;
              location.homeGeocode = marketInfo[marketIdx].homegeo;
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
              this.createTradeArea(market, location);

              locations.push(location);
              //this.locationService.persistLocationsAndAttributes([location]);
            }
            else {
              const dupeLocMsg = 'A location for market: ' + market.code + ' - ' + market.name + ' already exists';
              this.logger.warn.log(dupeLocMsg);
              this.store$.dispatch(new WarningNotification({ message: dupeLocMsg, notificationTitle: 'Duplicate Location' }));
            }
          });
          if (locations.length > 0)
            this.locationService.persistLocationsAndAttributes(locations);
          this.logger.info.log('Market locations completed successfully');
          }
          catch (exception)
          {
            this.reportError('Could not create market sites', '\t\t¯\\_(ツ)_/¯\nUNEXPECTED ERROR:\n' + exception, exception);
          }
          this.store$.dispatch(new StopLiveIndicator({ key: this.busyKey }));
        });

/*
    //const querySub = this.esriQueryService.queryAttributeIn(layerId, queryField, ids , true, ['geocode', queryField])
    const querySub = this.esriQueryService.queryAttributeIn(layerId, 'geocode', centroidGeos , true, ['geocode', queryField])
      .subscribe(graphics => {
        this.logger.info.log('querySub fired - graphics.length: ' + graphics.length);
        let index = 0;
        let currGeos = 0;
        locations = [];
        //const spinnerBS$ = new BehaviorSubject<string>(`Creating locations for ${marketList.length} markets with ${numGeos} geos!`);
        //this.store$.dispatch(new StartLiveIndicator({ key: this.busyKey, messageSource: spinnerBS$}));

        marketList.forEach(market => {
          if (this.impGeofootprintLocationService.get().filter(loc => loc.locationNumber === market.code).length === 0)
          {
          this.logger.info.log('index: ' + index + ', graphics.count: ' + graphics.length);
          for (const graphic of graphics) {
            //console.log('graphic:  geocode: ' + graphic.getAttribute('geocode') + ', ' + queryField + ': ' + graphic.getAttribute(queryField));
            const currentCode: string = graphic.getAttribute(queryField).toString();
this.logger.info.log('currentCode: ' + currentCode + ', marketCode: ' + market.code + ', marketId: ' + market.id);
            this.logger.info.log('market: ' + market.code + ' data store count: ' + this.impGeofootprintLocationService.get().filter(loc => loc.locationNumber == market.code).length
                              + ', locations count: ' + locations.filter(loc => loc.locationNumber == market.code).length);
//          if (currentCode != null && currentCode.toLowerCase().includes(market.code.toLowerCase())) {
            if (currentCode != null && ['WRAP', 'WRAP2'].includes(marketCode) ? currentCode.toLowerCase().includes(market.id.toString())
                                                                              : currentCode.toLowerCase().includes(market.code.toLowerCase()) ) {
              this.logger.info.log('Found market: ' + market.code + ' data store count: ' + this.impGeofootprintLocationService.get().filter(loc => loc.locationNumber == market.code).length);
              // if (this.impGeofootprintLocationService.get().filter(loc => loc.locationNumber == market.code).length > 0)
              // {
              //   this.logger.warn.log('Location: ' + market.code + ' already exists');
              //   break;
              // }
              const location: ImpGeofootprintLocation = new ImpGeofootprintLocation();
              currGeos += market.geocodes.length;
              index++;
//              this.store$.dispatch(new StartBusyIndicator({ key: this.busyKey, message: `Creating location ${market.code} ${index}/${marketList.length} - ${currGeos}/${numGeos} geos`}));
              this.spinnerBS$.next(`Creating location ${market.code} ${index}/${marketList.length} - ${currGeos}/${numGeos} geos`);
              this.logger.info.log(`Creating location ${market.code} ${index}/${marketList.length} - ${currGeos}/${numGeos} geos`);
              location.xcoord = graphic.geometry['centroid'].x;
              location.ycoord = graphic.geometry['centroid'].y;
              location.locationNumber = market.id == null ? market.code : market.id.toString();
              location.locationName = (market.id != null ? market.code + '-' : '') + market.name;
              location.marketCode = market.code;
              location.marketName = market.name;
              location.impGeofootprintLocAttribs = new Array<ImpGeofootprintLocAttrib>();
              location.clientLocationTypeCode = ImpClientLocationTypeCodes.Site;  // TODO: sites or competitors
              location.isActive = true;
              location.impProject = this.project;
              location.homeGeocode = graphic.getAttribute('geocode');
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
            //  this.impGeofootprintLocationService.add([location]);
              //const request: ValGeocodingRequest = new ValGeocodingRequest(location);
              //requests.push(request);
              //this.manuallyGeocode(request, ImpClientLocationTypeCodes.Site, false); // TODO: sites or competitors
              //console.log('homegeocode: ' + location.homeGeocode);
              this.createTradeArea(market, location);
              //console.log('new location: ' + location.toString());
              syncWait(5000);

              locations.push(location);
              //console.log('location: ' + location);
              this.locationService.persistLocationsAndAttributes([location]);

              // Found a match, so break out of the search loop
              break;
            }
          }
          // this.locationService.geocode(requests, ImpClientLocationTypeCodes.Site, false)
          //   .subscribe(geocodedLocations => {
          //     console.log('geocodedLocations: ' + geocodedLocations.length);
          //     console.log(geocodedLocations);
          //     geocodedLocations.forEach(loc => this.createTradeArea(market, loc));
          //     this.impGeofootprintLocationService.add(geocodedLocations);
          //   });
 // PB Maybe       this.locationService.persistLocationsAndAttributes(locations);
        }
        else
          this.logger.info.log('A location for market: ' + market.code + ' already exists - count: ' + this.impGeofootprintLocationService.get().filter(loc => loc.locationNumber === market.code).length);
        });
        //this.createTradeAreas(dmaList);
        //this.renderTradeAreas();
      },
      err => {
        this.logger.error.log('There was an error querying the layer', err);
        this.store$.dispatch(new StopLiveIndicator({ key: this.busyKey }));
      },
      () => {
        //this.locationService.persistLocationsAndAttributes(locations);
        this.logger.info.log('Market locations completed successfully');
        this.store$.dispatch(new StopLiveIndicator({ key: this.busyKey }));
        querySub.unsubscribe();
      }); */
    }
    catch (exception)
    {
      this.reportError('Could not create market sites', '\t\t¯\\_(ツ)_/¯\nUNEXPECTED ERROR:\n' + exception, exception);
    }
    /*  this.esriQueryService.queryAttributeIn(EnvironmentData.layerIds.dma.boundary, 'dma_code', Array.from(homeDMAs), false, ['dma_code', 'dma_name']).pipe(
      filter(g => g != null)
    ).subscribe(
      graphics => {
        graphics.forEach(g => {
          dmaLookup[g.attributes.dma_code] = g.attributes.dma_name;
        });
      },
      err => this.logger.error.log('There was an error querying the layer', err),
      () => {
        const dmaAttrsToAdd = [];
        locations.forEach(l => {
          const currentAttributes = attributesBySiteNumber.get(l.locationNumber);
          if (currentAttributes != null) {
            const dmaName = dmaLookup[currentAttributes['homeDma']];
            if (dmaName != null) {
              const newAttribute = this.domainFactory.createLocationAttribute(l, 'Home DMA Name', dmaName);
              if (newAttribute != null) dmaAttrsToAdd.push(newAttribute);
            }
          }
        });
        this.impLocAttributeService.add(dmaAttrsToAdd);
        this.impLocationService.makeDirty();
      }); */
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

  private createTradeArea(market: ContainerValue, loc: ImpGeofootprintLocation)
  {
    const newTA = this.factoryService.createTradeArea(loc, TradeAreaTypeCodes.Custom);

    market.geocodes.forEach(geocode => {
      const newGeo = this.factoryService.createGeo(newTA, geocode, null, null, 0);
    //  newTA.impGeofootprintGeos.push(newGeo);
    });
    this.impGeofootprintGeoService.add(newTA.impGeofootprintGeos);
   // this.tradeAreaService.insertTradeAreas([newTA]);
    loc.impGeofootprintTradeAreas.push(newTA);
    this.impGeofootprintTradeAreaService.add([newTA]);
  }

  private renderTradeAreas(isAlsoShaded: boolean = false) {
    const result: ShadingDefinition = {
      id: getUuid(),
      dataKey: 'selection-shading',
      sortOrder: 1,
      sourcePortalId: null,
      layerName: null,
      opacity: isAlsoShaded ? 1 : 0.25,
      visible: true,
      minScale: null,
      defaultSymbolDefinition: {
        fillColor: isAlsoShaded ? [0, 0, 0, 1] : [0, 255, 0, 1],
        fillType: isAlsoShaded ? 'backward-diagonal' : 'solid',
      },
      filterByFeaturesOfInterest: true,
      filterField: 'geocode',
      shadingType: ConfigurationTypes.Simple
    };
    //this.esriShadingService.addShader(result);
  }

  private reportError(errorHeader: string, errorMessage: string, errorObject: any) {
//    this.logger.error.log(errorHeader, errorObject);
    this.store$.dispatch(new StopLiveIndicator({ key: this.busyKey }));
    this.store$.dispatch(new ErrorNotification({ message: errorMessage, notificationTitle: errorHeader, additionalErrorInfo: errorObject }));
  }

}