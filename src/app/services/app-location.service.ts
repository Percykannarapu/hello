import { Injectable } from '@angular/core';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ValGeocodingRequest } from '../models/val-geocoding-request.model';
import { ImpGeofootprintLocAttrib } from '../val-modules/targeting/models/ImpGeofootprintLocAttrib';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocAttribService } from '../val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import { AppGeocodingService } from './app-geocoding.service';
import { Observable, combineLatest } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
import { MetricService } from '../val-modules/common/services/metric.service';
import { AppConfig } from '../app.config';
import { EsriApi } from '../esri/core/esri-api.service';
import { EsriMapService } from '../esri/services/esri-map.service';
import { AppMessagingService } from './app-messaging.service';
import { calculateStatistics, toUniversalCoordinates } from '../app.utils';
import { AppStateService } from './app-state.service';
import { groupByExtended, mapBy, simpleFlatten } from '../val-modules/common/common.utils';
import { ImpGeofootprintMaster } from '../val-modules/targeting/models/ImpGeofootprintMaster';
import { AppTradeAreaService } from './app-trade-area.service';
import { ImpDomainFactoryService } from '../val-modules/targeting/services/imp-domain-factory.service';
import { filterArray } from '../val-modules/common/common.rxjs';
import { AppLoggingService } from './app-logging.service';
import { EsriLayerService } from '../esri/services/esri-layer.service';
import { EsriGeoprocessorService } from '../esri/services/esri-geoprocessor.service';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpClientLocationTypeCodes } from '../val-modules/targeting/targeting.enums';
import { ConfirmationService } from 'primeng/components/common/confirmationservice';

const getHomeGeoKey = (analysisLevel: string) => `Home ${analysisLevel}`;

const newHomeGeoToAnalysisLevelMap = {
  homeAtz: getHomeGeoKey('ATZ'),
  homeCounty: getHomeGeoKey('County'),
  homeDigitalAtz: getHomeGeoKey('Digital ATZ'),
  homeDma: getHomeGeoKey('DMA'),
  homePcr: getHomeGeoKey('PCR'),
  homeZip: getHomeGeoKey('ZIP')
};

@Injectable({
  providedIn: 'root'
})
export class AppLocationService {
  public allClientLocations$: Observable<ImpGeofootprintLocation[]>;
  public activeClientLocations$: Observable<ImpGeofootprintLocation[]>;
  public allCompetitorLocations$: Observable<ImpGeofootprintLocation[]>;
  public activeCompetitorLocations$: Observable<ImpGeofootprintLocation[]>;

  public failedClientLocations$: Observable<ImpGeofootprintLocation[]>;
  public failedCompetitorLocations$: Observable<ImpGeofootprintLocation[]>;
  public failureCount$: Observable<number>;
  public totalCount$: Observable<number>;
  public hasFailures$: Observable<boolean>;
  public cachedTradeAreas: ImpGeofootprintTradeArea[];

  constructor(private impLocationService: ImpGeofootprintLocationService,
              private impLocAttributeService: ImpGeofootprintLocAttribService,
              private appStateService: AppStateService,
              private appTradeAreaService: AppTradeAreaService,
              private geocodingService: AppGeocodingService,
              private messageService: AppMessagingService,
              private metricsService: MetricService,
              private config: AppConfig,
              private esriMapService: EsriMapService,
              private esriLayerService: EsriLayerService,
              private esriGeoprocessingService: EsriGeoprocessorService,
              private logger: AppLoggingService,
              private domainFactory: ImpDomainFactoryService,
              private confirmationService: ConfirmationService) {
    const allLocations$ = this.impLocationService.storeObservable.pipe(
      filter(locations => locations != null)
    );
    const locationsWithType$ = allLocations$.pipe(
      map(locations => locations.filter(l => l.clientLocationTypeCode != null && l.clientLocationTypeCode.length > 0))
    );
    const locationsNeedingHomeGeos$ = allLocations$.pipe(
      filterArray(loc => loc['homeGeoFound'] == null),
      filterArray(loc => loc.ycoord != null && loc.xcoord != null && loc.ycoord != 0 && loc.xcoord != 0),
      filterArray(loc => !loc.impGeofootprintLocAttribs.some(attr => attr.attributeCode.startsWith('Home '))),
    );
    this.totalCount$ = allLocations$.pipe(
      map(locations => locations.length)
    );
    this.failedClientLocations$ = locationsWithType$.pipe(
      map(locations => locations.filter(l => l.clientLocationTypeCode === 'Failed Site'))
    );
    this.failedCompetitorLocations$ = locationsWithType$.pipe(
      map(locations => locations.filter(l => l.clientLocationTypeCode === 'Failed Competitor'))
    );
    this.failureCount$ = combineLatest(this.failedClientLocations$, this.failedCompetitorLocations$).pipe(
      startWith([[], []]),
      map(([site, competitor]) => site.length + competitor.length)
    );
    this.hasFailures$ = this.failureCount$.pipe(map(count => count > 0));

    this.allClientLocations$ = this.appStateService.allClientLocations$;
    this.allCompetitorLocations$ = this.appStateService.allCompetitorLocations$;
    this.activeClientLocations$ = this.appStateService.activeClientLocations$;
    this.activeCompetitorLocations$ = this.appStateService.activeCompetitorLocations$;

    this.activeClientLocations$.pipe(map(sites => sites.length)).subscribe(l => this.setCounts(l, 'Site'));
    this.activeCompetitorLocations$.pipe(map(sites => sites.length)).subscribe(l => this.setCounts(l, 'Competitor'));
    this.appStateService.analysisLevel$
      .pipe(filter(al => al != null && al.length > 0))
      .subscribe(analysisLevel => this.setPrimaryHomeGeocode(analysisLevel));

    combineLatest(locationsNeedingHomeGeos$, this.appStateService.analysisLevel$, this.appStateService.applicationIsReady$).pipe(
      filter(([locations, level, isReady]) => locations.length > 0 && level != null && level.length > 0 && isReady)
    ).subscribe(
      ([locations, analysisLevel]) => this.queryAllHomeGeos(locations, analysisLevel)
    );
  }

  public static createMetricTextForLocation(site: ImpGeofootprintLocation) : string {
    const items: string[] = [
      `Number=${site.locationNumber}`,
      `Name=${site.locationName}`,
      `Street=${site.locAddress}`,
      `City=${site.locCity}`,
      `State=${site.locState}`,
      `ZIP=${site.locZip}`,
      `X=${site.xcoord}`,
      `Y=${site.ycoord}`,
      `Status=${site.recordStatusCode}`,
      `MatchCode=${site.geocoderMatchCode}`,
      `LocationCode=${site.geocoderLocationCode}`
    ];
    return items.join('~');
  }

   public deleteLocations(sites: ImpGeofootprintLocation[]) : void {
      console.log('Deleting Sites');
      if (sites == null || sites.length === 0) return;
      const nonNullSites = sites.filter(l => l != null);
      if (nonNullSites.length === 0) return;

      const masters = new Set<ImpGeofootprintMaster>(nonNullSites.map(l => l.impGeofootprintMaster).filter(m => m != null));
      const siteSet = new Set<ImpGeofootprintLocation>(nonNullSites);

      try
      {
         // remove the sites from the hierarchy
         masters.forEach(m => m.impGeofootprintLocations = (m.impGeofootprintLocations || []).filter(l => !siteSet.has(l)));
         nonNullSites.forEach(l => l.impGeofootprintMaster = null);
         const tradeAreas = simpleFlatten(nonNullSites.map(l => l.impGeofootprintTradeAreas || []));
         const attributes = simpleFlatten(nonNullSites.map(l => l.impGeofootprintLocAttribs || []));

         // remove from the data stores in top-down order to avoid home geos and default trade areas from getting applied
         this.impLocationService.remove(nonNullSites);
        if (attributes.length > 0) this.impLocAttributeService.remove(attributes);
        this.appTradeAreaService.deleteTradeAreas(tradeAreas);
        const convertSiteTypesToEnum = (loc) => ImpClientLocationTypeCodes.markSuccessful(ImpClientLocationTypeCodes.parse(loc.clientLocationTypeCode));
        const locationGroups = groupByExtended(nonNullSites, convertSiteTypesToEnum, loc => loc.locationNumber);
        Array.from(locationGroups.entries()).forEach(([siteType, siteNumbers]) => {
          this.geocodingService.removeFromDuplicateCheck(siteType, siteNumbers);
        });
      }
      catch (error)
      {
         console.log('deleteLocations - EXCEPTION', error);
      }
   }

  public notifySiteChanges() : void {
    this.impLocationService.makeDirty();
  }

  public geocode(data: ValGeocodingRequest[], siteType: string) : Observable<ImpGeofootprintLocation[]> {
    const currentProject = this.appStateService.currentProject$.getValue();
    const currentAnalysisLevel = this.appStateService.analysisLevel$.getValue();
    return this.geocodingService.getGeocodingResponse(data, siteType).pipe(
      map(responses => responses.map(r => this.domainFactory.createLocation(currentProject, r, siteType, currentAnalysisLevel)))
    );
  }

  public persistLocationsAndAttributes(data: ImpGeofootprintLocation[]) : void {
    const newTradeAreas: ImpGeofootprintTradeArea[] = [];

    data.forEach(l => {
      const tradeAreas: any[] = [];
      if (l.locationNumber == null || l.locationNumber.length === 0 ){
        l.locationNumber = this.impLocationService.getNextLocationNumber().toString();
      }
      if (l.radius1 != null && Number(l.radius1) !== 0) {
        const tradeArea1 = {radius: Number(l.radius1), selected: true };
        tradeAreas.push(tradeArea1);
      }
      if (l.radius2 != null && Number(l.radius2) !== 0) {
        const tradeArea2 = {radius: Number(l.radius2), selected: true };
        tradeAreas.push(tradeArea2);
      }
      if (l.radius3 != null && Number(l.radius3) !== 0) {
        const tradeArea3 = {radius: Number(l.radius3), selected: true };
        tradeAreas.push(tradeArea3);
      }
      newTradeAreas.push(...this.appTradeAreaService.createRadiusTradeAreasForLocations(tradeAreas, [l], false));
    });

    if (this.appStateService.analysisLevel$.getValue() == null && newTradeAreas.length !== 0 ) {
      this.messageService.showErrorNotification('Location Upload Error', `Please select an Analysis Level prior to uploading locations with defined radii values.`);
      this.geocodingService.clearDuplicates();
    } else {
      this.cachedTradeAreas = newTradeAreas;
      data
        .filter(loc => loc.locationName == null || loc.locationName.length === 0)
        .forEach(loc => loc.locationName = loc.locationNumber);
      this.impLocationService.add(data);
      this.impLocAttributeService.add(simpleFlatten(data.map(l => l.impGeofootprintLocAttribs)));
    }
  }

  public zoomToLocations(locations: ImpGeofootprintLocation[]) {
    const xStats = calculateStatistics(locations.map(d => d.xcoord));
    const yStats = calculateStatistics(locations.map(d => d.ycoord));
    this.esriMapService.zoomOnMap(xStats, yStats, locations.length);
  }

  private queryAllHomeGeos(locations: ImpGeofootprintLocation[], analysisLevel: string) {
    let objId = 0;
    const jobData = locations.map(loc => {
      const coordinates = toUniversalCoordinates(loc);
      return new EsriApi.Graphic({
        geometry: new EsriApi.Point(coordinates),
        attributes: {
          ...coordinates,
          parentId: objId++,
          siteNumber: `${loc.locationNumber}`,
        }
      });
    });
    const dataSet = this.esriLayerService.createDataSet(jobData, 'parentId');
    if (dataSet != null) {
      const payload = {
        in_features: dataSet
      };
      const resultAttributes: any[] = [];
      this.messageService.startSpinnerDialog('HomeGeoCalcKey', 'Calculating Home Geos');
      this.logger.info('Home Geo service call initiated.');
      this.esriGeoprocessingService.processJob<__esri.FeatureSet>(this.config.serviceUrls.homeGeocode, payload).subscribe(
        result => {
          const attributes = result.value.features.map(feature => feature.attributes);
          this.logger.debug('Home Geo service call returned result', result);
          resultAttributes.push(...attributes);
        },
        err => {
          this.logger.errorWithNotification('Home Geo', 'There was an error during Home Geo calculation.', err);
          this.messageService.stopSpinnerDialog('HomeGeoCalcKey');
        },
        () => {
          if (resultAttributes.length > 0) {
            this.logger.info('Home Geo service call complete');
            this.logger.debug('Home Geo service complete results', resultAttributes);
            this.processHomeGeoAttributes(resultAttributes, locations);
            this.flagHomeGeos(locations, analysisLevel);
            this.messageService.showSuccessNotification('Home Geo', 'Home Geo calculation is complete.');
          }
          this.messageService.stopSpinnerDialog('HomeGeoCalcKey');
          if (this.cachedTradeAreas.length !== 0){
      
              this.confirmationService.confirm({
                message: 'Your site list includes radii values.  Do you want to define your trade area with those values?',
                header: 'Define Trade Areas',
                icon: 'ui-icon-project',
                accept: () => {
                  this.cachedTradeAreas.forEach(ta => ta.impGeofootprintLocation.impGeofootprintTradeAreas.push(ta));
                  this.appTradeAreaService.insertTradeAreas(this.cachedTradeAreas);
                  this.appTradeAreaService.zoomToTradeArea();
                  this.cachedTradeAreas = [];
                },
                reject: () => {
                  const currentLocations = this.cachedTradeAreas.map(ta => ta.impGeofootprintLocation);
                  currentLocations.forEach(loc => {
                    loc.radius1 = null;
                    loc.radius2 = null;
                    loc.radius3 = null;
                  });
                  this.impLocationService.makeDirty();
                  this.cachedTradeAreas = [];
                }
              });
            }
        }
      );
    }
  }

  private processHomeGeoAttributes(attributes: any[], locations: ImpGeofootprintLocation[]) : void {
    const attributesBySiteNumber: Map<any, any> = mapBy(attributes, 'siteNumber');
    const impAttributesToAdd: ImpGeofootprintLocAttrib[] = [];
    let homeGeocodeIssue = 'N';

    locations.forEach(loc => {
      const currentAttributes = attributesBySiteNumber.get(`${loc.locationNumber}`);
      Object.keys(currentAttributes).filter(key => key.startsWith('home')).forEach(key => {
        if (newHomeGeoToAnalysisLevelMap[key] != null) {
          // the service might return multiple values for a home geo (in case of overlapping geos)
          // as csv. For now, we're only taking the first result.
          const firstHomeGeoValue = `${currentAttributes[key]}`.split(',')[0];
          // validate homegeo rules
          if (currentAttributes[key] === null)
              homeGeocodeIssue = 'Y';
          if (loc.origPostalCode != null && loc.origPostalCode != '' && !loc.locZip.includes(loc.origPostalCode) 
                            && !firstHomeGeoValue.includes(loc.origPostalCode)) {
              homeGeocodeIssue = 'Y';   
          }
          if (newHomeGeoToAnalysisLevelMap[key] === 'Home PCR' && firstHomeGeoValue.length == 5){
              homeGeocodeIssue = 'Y';   
          }
          if (currentAttributes[key] != null)   {
            const newAttribute = this.domainFactory.createLocationAttribute(loc, newHomeGeoToAnalysisLevelMap[key], firstHomeGeoValue);
            impAttributesToAdd.push(newAttribute);
          } 
        }
      });
     const newAttribute1 = this.domainFactory.createLocationAttribute(loc, 'homeGeocodeIssue', homeGeocodeIssue);
     impAttributesToAdd.push(newAttribute1);
    });
    if (homeGeocodeIssue === 'Y'){
      this.messageService.showWarningNotification('Home Geocode Warning', 'Issues found while calculating Home Geocodes, please check the Locations Grid.');
    }
    this.impLocAttributeService.add(impAttributesToAdd);
  }

  private setPrimaryHomeGeocode(analysisLevel: string) {
    this.logger.info(`Setting primary home geo for ${analysisLevel}`);
    if (analysisLevel == null) {
      const currentLocations = this.impLocationService.get();
      currentLocations.forEach(l => l.homeGeocode = null);
    } else {
      const homeGeoKey = getHomeGeoKey(analysisLevel);
      const currentAttributes = this.impLocAttributeService.get().filter(a => a.attributeCode === homeGeoKey);
      for (const attribute of currentAttributes) {
        if (attribute.impGeofootprintLocation != null) {
          attribute.impGeofootprintLocation.homeGeocode = attribute.attributeValue;
        }
      }
    }
    this.impLocationService.makeDirty();
  }

  private setCounts(count: number, siteType: string) {
    this.metricsService.add('LOCATIONS', `# of ${siteType}s`, count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
  }

  private flagHomeGeos(locations: ImpGeofootprintLocation[], currentAnalysisLevel: string) : void {
    this.logger.debug('Setting custom flag to indicate locations have had home geo processing performed.');
    const homeKey = getHomeGeoKey(currentAnalysisLevel);
    locations.forEach(loc => {
      if (loc.ycoord != null && loc.xcoord != null && loc.ycoord != 0 && loc.xcoord != 0 &&
        !loc.impGeofootprintLocAttribs.some(attr => attr.attributeCode.startsWith('Home '))) {
        loc['homeGeoFound'] = false;
      } else {
        loc['homeGeoFound'] = true;
        const currentHomeGeo = loc.impGeofootprintLocAttribs.filter(attr => attr.attributeCode === homeKey)[0];
        loc.homeGeocode = currentHomeGeo != null ? currentHomeGeo.attributeValue : null;
      }
    });
    this.impLocationService.makeDirty();
  }
}
