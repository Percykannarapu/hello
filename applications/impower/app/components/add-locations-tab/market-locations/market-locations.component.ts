import { ImpGeofootprintGeoService } from 'app/val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintTradeAreaService } from 'app/val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpGeofootprintLocationService } from 'app/val-modules/targeting/services/ImpGeofootprintLocation.service';
import { Component, OnInit } from '@angular/core';
import { EsriQueryService } from '../../../../../../modules/esri/src/services/esri-query.service';
import { ImpDomainFactoryService } from 'app/val-modules/targeting/services/imp-domain-factory.service';
import { AppLocationService } from 'app/services/app-location.service';
import { AppTradeAreaService, TradeAreaDefinition } from 'app/services/app-trade-area.service';
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
import { EnvironmentData } from 'environments/environment';
import { ValGeocodingRequest } from 'app/models/val-geocoding-request.model';
import { ErrorNotification } from '../../../../../../modules/messaging/state/messaging.actions';
import { AppGeocodingService } from 'app/services/app-geocoding.service';
import { Store } from '@ngrx/store';
import { FullAppState } from 'app/state/app.interfaces';
import { Geocode } from 'app/state/homeGeocode/homeGeo.actions';
import { AppLoggingService } from 'app/services/app-logging.service';
import { StartBusyIndicator, StopBusyIndicator } from '../../../../../../modules/messaging/state/busyIndicator/busy.state';

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
  private readonly busyKey = 'MarketLocationsAdd';

  private project: ImpProject;
  private analysisLevel: string;

  constructor(
    private esriQueryService: EsriQueryService,
    private factoryService: ImpDomainFactoryService,
    private locationService: AppLocationService,
    private tradeAreaService: AppTradeAreaService,
    private projectService: AppProjectService,
    private appStateService: AppStateService,
    private store$: Store<FullAppState>,
    private geocoderService: AppGeocodingService,
    private impGeofootprintLocationService: ImpGeofootprintLocationService,
    private impGeofootprintTradeAreaService: ImpGeofootprintTradeAreaService,
    private impGeofootprintGeoService: ImpGeofootprintGeoService,
    //private esriShadingService: EsriShadingLayersService,
    private appRendererService: AppRendererService,
    private appConfig: AppConfig,
    private logger: AppLoggingService) { }

  ngOnInit() {
    this.projectService.currentProject$.subscribe(p => {
      this.project = p;
      this.analysisLevel = this.appStateService.analysisLevel$.getValue();
    });
  }

  // Event that fires when geos are starting to be retrieved
  public onGetGeos(event: any)
  {
    this.store$.dispatch(new StartBusyIndicator({ key: this.busyKey, message: `Determining geos for ${event.markets.length} ${event.container} markets`}));
  }

  // Event that fires once geos have been retrieved
  public onGeosRetrieved(event: any)
  {
    this.createLocations(event.market, event.values);
  }

  private createLocations(marketCode: string, marketList: ContainerValue[]) {
    this.logger.info.log('-'.repeat(80));
    this.logger.info.log('createLocations fired: marketCode: ' + marketCode); // + ', marketList: ' + marketList);
    this.logger.info.log('-'.repeat(80));
    //this.locationService.clearAll();
    const ids: string[] = [];
    const centroidGeos: string[] = [];
    let numGeos = 0;

    // Build an array of markets to process and count total number of geos
    marketList.forEach(d => {
      ids.push(d.code);
      numGeos += d.geocodes.length;
      centroidGeos.push(d.geocodes[0]);
    });

    const layerId = this.appConfig.getLayerIdForAnalysisLevel(this.project.methAnalysis); // (this.appStateService.analysisLevel$.getValue() != null) ? this.appStateService.analysisLevel$.getValue() : 'ATZ');
//  const layerId = EnvironmentData.layerIds.dma.boundary;
    const requests: ValGeocodingRequest[] = [];

    console.log('marketCode: ' + marketCode);
    //console.log('marketList: ' + marketList);
    console.log('analysisLevel: ' + this.analysisLevel);
    console.log('project lvl: ' + this.project.methAnalysis);

    let queryField: string;
    switch (marketCode) {
      case 'DMA':
            queryField = 'dma_code';
            break;
      case 'PRICING':
            queryField = 'pricing_mkt'; // pricing_mkt_id
            break;
      case 'WRAP':
            queryField = 'wrap_mkt_id'; // wrap
            break;
      case 'SDM':
            queryField = 'sdm'; // sdm_id
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
            queryField = 'state_abbr'; // state_fips
            break;
    }

    this.logger.info.log('centroidGeos: ' + centroidGeos);
    const geoSub = this.esriQueryService.queryAttributeIn(layerId, 'geocode', centroidGeos , true, ['geocode', queryField])
      .subscribe(graphics => {
        this.logger.info.log('geoSub fired - graphics.length: ' + graphics.length);
        for (const graphic of graphics) {
          const currentCode: string = graphic.getAttribute(queryField);
          this.logger.info.log('geoSub - currentCode: ' + currentCode + ', geocode: ' + graphic.getAttribute('geocode') + ', x: ' + graphic.geometry['centroid'].x + ', y: ' + graphic.geometry['centroid'].y);
        }
      },
      err => {
        this.logger.error.log('geoSub - There was an error querying the layer', err);
        geoSub.unsubscribe();
      },
      () => {
        this.logger.info.log('geoSub - Market locations completed successfully');
        geoSub.unsubscribe();
      });

    this.store$.dispatch(new StartBusyIndicator({ key: this.busyKey, message: `Creating locations for ${marketList.length} markets with ${numGeos} geos`}));
    this.logger.info.log('Starting location creation, queryField: ' + queryField);

    let locations: ImpGeofootprintLocation[] = [];
    //const querySub = this.esriQueryService.queryAttributeIn(layerId, queryField, ids , true, ['geocode', queryField])
    const querySub = this.esriQueryService.queryAttributeIn(layerId, 'geocode', centroidGeos , true, ['geocode', queryField])
      .subscribe(graphics => {
        this.logger.info.log('querySub fired - graphics.length: ' + graphics.length);
        let index = 0;
        let currGeos = 0;
        locations = [];
        marketList.forEach(market => {
          if (this.impGeofootprintLocationService.get().filter(loc => loc.locationNumber === market.code).length === 0)
          {
          this.logger.info.log('index: ' + index + ', graphics.count: ' + graphics.length);
          for (const graphic of graphics) {
            //console.log('graphic:  geocode: ' + graphic.getAttribute('geocode') + ', ' + queryField + ': ' + graphic.getAttribute(queryField));
            const currentCode: string = graphic.getAttribute(queryField);
            this.logger.info.log('market: ' + market.code + ' data store count: ' + this.impGeofootprintLocationService.get().filter(loc => loc.locationNumber == market.code).length
                              + ', locations count: ' + locations.filter(loc => loc.locationNumber == market.code).length);
            if (currentCode != null && currentCode.toLowerCase().includes(market.code.toLowerCase())) {
              this.logger.info.log('Found market: ' + market.code + ' data store count: ' + this.impGeofootprintLocationService.get().filter(loc => loc.locationNumber == market.code).length);
              // if (this.impGeofootprintLocationService.get().filter(loc => loc.locationNumber == market.code).length > 0)
              // {
              //   this.logger.warn.log('Location: ' + market.code + ' already exists');
              //   break;
              // }
              const location: ImpGeofootprintLocation = new ImpGeofootprintLocation();
              currGeos += market.geocodes.length;
              index++;
              this.store$.dispatch(new StartBusyIndicator({ key: this.busyKey, message: `Creating location ${market.code} ${index}/${marketList.length} - ${currGeos}/${numGeos} geos`}));
              this.logger.info.log(`Creating location ${market.code} ${index}/${marketList.length} - ${currGeos}/${numGeos} geos`);
              location.xcoord = graphic.geometry['centroid'].x;
              location.ycoord = graphic.geometry['centroid'].y;
              location.locationNumber = market.code;
              location.locationName = market.name;
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
        this.store$.dispatch(new StopBusyIndicator({ key: this.busyKey }));
      },
      () => {
        //this.locationService.persistLocationsAndAttributes(locations);
        this.logger.info.log('Market locations completed successfully');
        this.store$.dispatch(new StopBusyIndicator({ key: this.busyKey }));
        querySub.unsubscribe();
      });

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

}
