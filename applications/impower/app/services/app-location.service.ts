import { Injectable } from '@angular/core';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ValGeocodingRequest } from '../models/val-geocoding-request.model';
import { ImpGeofootprintLocAttrib } from '../val-modules/targeting/models/ImpGeofootprintLocAttrib';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocAttribService } from '../val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import { AppGeocodingService } from './app-geocoding.service';
import { combineLatest, merge, Observable, EMPTY, of } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
import { MetricService } from '../val-modules/common/services/metric.service';
import { AppConfig } from '../app.config';
import { AppStateService } from './app-state.service';
import { ImpGeofootprintMaster } from '../val-modules/targeting/models/ImpGeofootprintMaster';
import { AppTradeAreaService } from './app-trade-area.service';
import { ImpDomainFactoryService } from '../val-modules/targeting/services/imp-domain-factory.service';
import { AppLoggingService } from './app-logging.service';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpClientLocationTypeCodes } from '../val-modules/targeting/targeting.enums';
import { ConfirmationService } from 'primeng/components/common/confirmationservice';
import { Store } from '@ngrx/store';
import { LocalAppState } from '../state/app.interfaces';
import { ErrorNotification, StartBusyIndicator, StopBusyIndicator, SuccessNotification, WarningNotification } from '@val/messaging';
import { LocationQuadTree } from '../models/location-quad-tree';
import { toUniversalCoordinates } from '../models/coordinates';
import { EsriApi, EsriGeoprocessorService, EsriLayerService, EsriMapService } from '@val/esri';
import { calculateStatistics, filterArray, groupByExtended, mapBy, simpleFlatten } from '@val/common';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { switchMap } from 'rxjs/internal/operators/switchMap';

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
              private metricsService: MetricService,
              private config: AppConfig,
              private esriMapService: EsriMapService,
              private esriLayerService: EsriLayerService,
              private esriGeoprocessingService: EsriGeoprocessorService,
              private logger: AppLoggingService,
              private domainFactory: ImpDomainFactoryService,
              private confirmationService: ConfirmationService,
              private restService: RestDataService,
              private store$: Store<LocalAppState>) {
    const allLocations$ = this.impLocationService.storeObservable.pipe(
      filter(locations => locations != null)
    );
    const locationsWithType$ = allLocations$.pipe(
      filterArray(l => l.clientLocationTypeCode != null && l.clientLocationTypeCode.length > 0),
    );
    const locationsNeedingHomeGeos$ = locationsWithType$.pipe(
      filterArray(loc => !loc.clientLocationTypeCode.startsWith('Failed ')),
      filterArray(loc => loc['homeGeoFound'] == null),
      filterArray(loc => loc.ycoord != null && loc.xcoord != null && loc.ycoord !== 0 && loc.xcoord !== 0),
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

  public persistLocationsAndAttributes(data: ImpGeofootprintLocation[], isEdit?: boolean, isResubmit?: boolean, oldData?: ImpGeofootprintLocation) : void {
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
      this.store$.dispatch(new ErrorNotification({ notificationTitle: 'Location Upload Error', message: 'Please select an Analysis Level prior to uploading locations with defined radii values.'}));
      this.geocodingService.clearDuplicates();
    } else {
      this.cachedTradeAreas = newTradeAreas;
      data
        .filter(loc => loc.locationName == null || loc.locationName.length === 0)
        .forEach(loc => loc.locationName = loc.locationNumber);
      if (isEdit) {
        if (!isResubmit) {
          this.impLocationService.update(oldData, data[0]);
        } else {
          this.impLocationService.add(data);
          this.impLocAttributeService.add(simpleFlatten(data.map(l => l.impGeofootprintLocAttribs)));
        }
      } else {
        this.impLocationService.add(data);
        this.impLocAttributeService.add(simpleFlatten(data.map(l => l.impGeofootprintLocAttribs)));
      } 
    }
  }

  public zoomToLocations(locations: ImpGeofootprintLocation[]) {
    const xStats = calculateStatistics(locations.map(d => d.xcoord));
    const yStats = calculateStatistics(locations.map(d => d.ycoord));
    this.esriMapService.zoomOnMap(xStats, yStats, locations.length);
  }

  private partitionLocations(locations: ImpGeofootprintLocation[]) : ImpGeofootprintLocation[][] {
    const quadTree = new LocationQuadTree(locations);
    const result = quadTree.partition(1000);
    this.logger.debug('QuadTree partitions', quadTree);
    return result.filter(chunk => chunk && chunk.length > 0);
  }

  public queryAllHomeGeos(locations: ImpGeofootprintLocation[], analysisLevel: string) {
    const attributeList = [];
    const responseGeocodes = [];
    //pipAttributeList for zip and dma
    const pipAttributeList = [];
    const pointPolyLocations = locations.filter(loc => loc.carrierRoute == null || loc.carrierRoute === '');
    const pointPolyNotRequiredLocations = locations.filter(loc => loc.carrierRoute != null && loc.carrierRoute != '');
    const locDicttemp = {};
    const zipLocDictemp = {};
    locations.forEach(loc => {
      locDicttemp[loc.locZip.substring(0, 5) + loc.carrierRoute] = loc;
      zipLocDictemp[loc.locZip.substring(0, 5)] = loc;
    });
    const pcrGeocodeList = [];
    const key = 'HomeGeoCalcKey';
    this.store$.dispatch(new StartBusyIndicator({ key, message: 'Calculating Home Geos'}));
    pointPolyNotRequiredLocations.forEach(loc => pcrGeocodeList.push(loc.locZip.substring(0, 5) + loc.carrierRoute));
    this.determineHomeGeos(pcrGeocodeList, analysisLevel, 'CL_PCRTAB14', 'geocode,ZIP , ATZ, DMA, COUNTY').pipe(
      map(res => {
        const atzLocationsNotFound = [];
        const pcrTab14Response = res;
        res.payload.forEach(row => {
          //atzLocationsNotFound.push(pointPolyNotRequiredLocations.filter(loc => loc.locZip.substring(0, 5) + loc.carrierRoute === row['geocode'] && row['score'] == null));
          if (locDicttemp[row['geocode']] !== null && row['score'] == null) {
            atzLocationsNotFound.push(locDicttemp[row['geocode']]);
          }
          if (pcrTab14Response != null && pcrTab14Response.payload.length > 0){
           // pcrTab14Response.payload.forEach(row => {
              // filteredLoc = pointPolyNotRequiredLocations.filter(loc => loc.locZip.substring(0, 5) + loc.carrierRoute === row['geocode']);
             const filteredLoc = locDicttemp[row['geocode']];
               const homeAtz = row['score'] != null ? row['ZIP'] + row['score'] : null;
               attributeList.push({
                 'homeZip'     : `${row['ZIP']}`,
                 'homeCounty'  : `${row['homeCounty']}`,
                 'homeDma'     : `${row['homeDma']}`,
                 'homePcr'     : `${row['geocode']}`,
                 'homeAtz'     :  homeAtz,
                 'siteNumber'  :  filteredLoc.locationNumber 
               });
               responseGeocodes.push(row['geocode'].substring(0, 5));
           //  });
          }
        });
        console.log('atzLocationsNotFound:::', atzLocationsNotFound);
        return atzLocationsNotFound;
      }),
      switchMap(locs => {
        locs.push(...pointPolyLocations);
        if (locs.length > 0) {
          const atzGeocodeList = [];
          locs.forEach(loc => atzGeocodeList.push(loc.locZip.substring(0, 5)));
          return this.determineHomeGeos(atzGeocodeList, analysisLevel, 'CL_ATZTAB14', 'geocode,ZIP'); 
        } else {
          return of(null);
        }
      }),
      map(atzTab14Response => {
        const locNotFound = pointPolyNotRequiredLocations.filter(loc => responseGeocodes.indexOf(loc.locZip.substring(0, 5)) < 0);
        pointPolyLocations.push(...locNotFound);
        const atzTab14ResponseDict = {};
        
        if (atzTab14Response != null && atzTab14Response.payload.length > 0){
          atzTab14Response.payload.forEach(row => {
            atzTab14ResponseDict[row['geocode']] = row;
          });
          attributeList.forEach(filterAtribute => {
            if (filterAtribute['homeAtz'] == null && filterAtribute['homeZip'] in atzTab14ResponseDict) {
              const attr = atzTab14ResponseDict[filterAtribute['homeZip']];
              delete atzTab14ResponseDict[filterAtribute['homeZip']];
              filterAtribute['homeAtz'] = attr['ZIP'];
            }
          });
          if (Object.keys(atzTab14ResponseDict).length > 0){
              //Object.keys(atzTab14ResponseDict).forEach(geo => {})
              Object.entries(atzTab14ResponseDict).forEach(([geo, value]) => {
                const filteredLoc = zipLocDictemp[value['geocode']];
                pipAttributeList.push({
                 'homeAtz'     :  `${value['ZIP']}`,
                 'siteNumber'  :  filteredLoc.locationNumber 
                });
              });
          }
        }
        //return attributeList;
      }),
      switchMap(() => {
        if (pointPolyLocations != null && pointPolyLocations.length > 0){
          const zipGeocodeList = [];
          pointPolyLocations.forEach(loc => zipGeocodeList.push(loc.locZip.substring(0, 5)));
          return this.determineHomeGeos(zipGeocodeList, analysisLevel, 'CL_ZIPTAB14', 'geocode, ZIP, DMA, COUNTY'); 
        }else{
          return of(null);
        }
      }),
      map(zipTab14Response => {
        const zipTab14ResponseDict = {};
        if (zipTab14Response != null && zipTab14Response.payload.length > 0){
          zipTab14Response.payload.forEach(row => {
            zipTab14ResponseDict[row['geocode']] = row;
          });
        }
        if (Object.keys(zipTab14ResponseDict).length > 0){
          Object.entries(zipTab14ResponseDict).forEach(([geo, value]) => {
            const filteredLoc = zipLocDictemp[value['geocode']];
            pipAttributeList.push({
              'homeZip'     : `${value['ZIP']}`,
              'homeDma'     : `${value['homeDma']}`,
              'homeCounty'  : `${value['homeCounty']}`,
              'siteNumber'  :  filteredLoc.locationNumber 
             });
          });
        }
        console.log('pipAttributeList::::', pipAttributeList);
      })
    ).subscribe(null, 
      err => this.store$.dispatch(new StopBusyIndicator({ key })), 
      () => {
      let objId = 0;
      if (pointPolyLocations != null && pointPolyLocations.length > 0){
        const partitionedLocations = this.partitionLocations(pointPolyLocations);
        const partitionedJobData = partitionedLocations.map(partition => {
          return partition.map(loc => {
            const coordinates = toUniversalCoordinates(loc);
            return new EsriApi.Graphic({
              geometry: new EsriApi.Point(coordinates),
              attributes: {
                ...coordinates,
                parentId: objId++,
                siteNumber: `${loc.locationNumber}`,
                geocoderCarrierRoute: `${loc.carrierRoute}`,
                geocoderZip: `${loc.locZip.substring(0, 5)}`,
              }
            });
          });
        });
        const payloads = partitionedJobData.map(jobData => ({
          in_features: this.esriLayerService.createDataSet(jobData, 'parentId')
        })).filter(p => p.in_features != null);
        
        const resultAttributes: any[] = [];
        //const key = 'HomeGeoCalcKey';
        //this.store$.dispatch(new StartBusyIndicator({ key, message: 'Calculating Home Geos'}));
        this.logger.info('Home Geo service call initiated.');
        const observables = payloads.map(payload => this.esriGeoprocessingService.processJob<__esri.FeatureSet>(this.config.serviceUrls.homeGeocode, payload));
        merge(...observables, 4).subscribe(
          result => {
            const attributes = result.value.features.map(feature => feature.attributes);
            resultAttributes.push(...attributes);
          },
          err => {
            this.logger.errorWithNotification('Home Geo', 'There was an error during Home Geo calculation.', err);
            this.store$.dispatch(new StopBusyIndicator({ key }));
          },
          () => {
            if (resultAttributes.length > 0) {
              this.logger.info('Validate Home Geos');
              this.validateHomeGeoAttributes(resultAttributes, pointPolyLocations, pipAttributeList).subscribe(resp => {
              }, null, () => {
              resultAttributes.push(...attributeList);
              this.logger.info('====process DigitalAtz attributes=====');
              this.determineDtzHomegeos(resultAttributes, locations).
              subscribe(null, null, () => {
                this.logger.info('Home Geo service call complete');
                this.logger.debug('Home Geo service complete results', resultAttributes);
                this.processHomeGeoAttributes(resultAttributes, locations);
                this.flagHomeGeos(locations, analysisLevel);
              });
              this.store$.dispatch(new SuccessNotification({ notificationTitle: 'Home Geo', message: 'Home Geo calculation is complete.' }));
              });
            }
            this.store$.dispatch(new StopBusyIndicator({ key }));
            this.confirmationBox();
          }
        );
      }
      else{
        this.logger.info('====process DigitalAtz attributes=====');
        this.determineDtzHomegeos(attributeList, pointPolyNotRequiredLocations).
        subscribe(null, 
        err => this.store$.dispatch(new StopBusyIndicator({ key })), 
        () => {
          this.processHomeGeoAttributes(attributeList, pointPolyNotRequiredLocations);
          this.flagHomeGeos(pointPolyNotRequiredLocations, analysisLevel);
          this.store$.dispatch(new SuccessNotification({ notificationTitle: 'Home Geo', message: 'Home Geo calculation is complete.' }));
          this.store$.dispatch(new StopBusyIndicator({ key }));
          this.confirmationBox();
        });
      }
    });
  }

  private confirmationBox() : void {
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
          this.appTradeAreaService.tradeareaType = 'distance';
        },
        reject: () => {
          const currentLocations = this.cachedTradeAreas.map(ta => ta.impGeofootprintLocation);
          this.appTradeAreaService.tradeareaType = '';
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
  private determineDtzHomegeos(attributes: any[], locations: ImpGeofootprintLocation[]){
    const attributesByHomeZip: Map<any, any> = mapBy(attributes, 'homeZip');
    console.log('attributesByHomeZip:::', attributesByHomeZip);
    let remainingAttributes = [];
    const zipGeocodeList = Array.from(attributesByHomeZip.keys());
    return this.determineHomeGeos(zipGeocodeList, null, 'VAL_DIGTAB14', 'geocode, ZIP, ZIP_ATZ').pipe(
      map(zipResponse => {
        const zipResponseDict = [];
        if (zipResponse.payload.length > 0){
          zipResponse.payload.forEach(row => {
            zipResponseDict[row['geocode']] = row;
          });
        }
        attributes.forEach(attribute => {
          if (attribute['homeZip'] in zipResponseDict){
            const attr = zipResponseDict[attribute['homeZip']];
            attribute['homeDigitalAtz'] = attr['geocode'];
          }
          else {
            attribute['homeDigitalAtz'] = ''; 
            remainingAttributes.push(attribute);
          }
        });
        return remainingAttributes;
      }),
      switchMap(remainingAttr => {
        if (remainingAttr.length > 0){
          const attributesByHomeAtz: Map<any, any> = mapBy(remainingAttr, 'homeAtz');
          const atzGeocodeList = Array.from(attributesByHomeAtz.keys());
          return this.determineHomeGeos(atzGeocodeList, null, 'VAL_DIGTAB14', 'geocode, ZIP, ZIP_ATZ');
        } else{
          return of(null);
        }
      }),
      map(atzResponse => {
        const atzResponseDict = [];
        remainingAttributes = [];
        if (atzResponse != null && atzResponse.payload.length > 0){
          atzResponse.payload.forEach(row => {
            atzResponseDict[row['geocode']] = row;
          });
        }
        attributes.forEach(attribute => {
          if (attribute['homeAtz'] in atzResponseDict){
            const attr = atzResponseDict[attribute['homeAtz']];
            attribute['homeDigitalAtz'] = attr['geocode'];
          }
          else if (attribute['homeDigitalAtz'] == null || attribute['homeDigitalAtz'] == ''){
            attribute['homeDigitalAtz'] = ''; 
            remainingAttributes.push(attribute);
          }
        });
        return remainingAttributes;
      }),
      switchMap(remainingAttr => {
        if (remainingAttr.length > 0){
          const attributesByHomePcr: Map<any, any> = mapBy(remainingAttr, 'homePcr');
          const pcrGeocodeList = Array.from(attributesByHomePcr.keys());
          return this.determineHomeGeos(pcrGeocodeList, null, 'VAL_DIGTAB14', 'geocode, ZIP, ZIP_ATZ');
        } else{
          return of(null);
        }
      }),
      map(pcrResponse => {
        const pctResponseDict = [];
        if (pcrResponse != null && pcrResponse.payload.length > 0){
          pcrResponse.payload.forEach(row => {
            pctResponseDict[row['geocode']] = row;
          });
        }
        attributes.forEach(attribute => {
          if (attribute['homePcr'] in pctResponseDict){
            const attr = pctResponseDict[attribute['homePcr']];
            attribute['homeDigitalAtz'] = attr['geocode'];
          }
        });
      })
    );
  }

  private validateHomeGeoAttributes(attributes: any[], locations: ImpGeofootprintLocation[], pipAttributes: any[]) : Observable<any>{
    const attributesBySiteNumber: Map<any, any> = mapBy(attributes, 'siteNumber');
    //const returnAttibutes = [];
    //validate PCR TAB14
    const pcrLocationsValidate = locations.filter(loc => attributesBySiteNumber.has(loc.locationNumber));
    let geocodeList = [];
    pcrLocationsValidate.forEach(loc => geocodeList.push(loc.locZip.substring(0, 5) + loc.carrierRoute));
    return this.determineHomeGeos(geocodeList, null, 'CL_PCRTAB14', 'geocode,ZIP , ATZ, DMA, COUNTY').pipe(
      map(response => {
        const pcrTab14ResponseDict = {};
        if (response.payload.length > 0){
          response.payload.forEach(row => {
            pcrTab14ResponseDict[row['geocode']] = row;
          });
        }
        attributes.forEach(attribute => {
          if (attribute['homePcr'] in pcrTab14ResponseDict){
            const attr = pcrTab14ResponseDict[attribute['homePcr']];
            attribute['homePcr'] = attr['geocode'];
          }
          else {
            attribute['homePcr'] = '';
          } 
        });
        return attributes;
      }),
      switchMap(attributesList => {
        geocodeList = [];
        pcrLocationsValidate.forEach(loc => geocodeList.push(loc.locZip.substring(0, 5)));
        return this.determineHomeGeos(geocodeList, null, 'CL_ZIPTAB14', 'geocode, ZIP, DMA, COUNTY');
      }),
      map(zipResponse => {
        const zipTab14ResponseDict = {};
        if (zipResponse.payload.length > 0){
          zipResponse.payload.forEach(row => {
            zipTab14ResponseDict[row['geocode']] = row;
          });
        }
        const pipZipAttributes: Map<any, any> = mapBy(pipAttributes, 'homeZip');
        attributes.forEach(attribute => {
          const pipAttr = pipZipAttributes.get(attribute['homeZip']);
          if (pipAttr != null) {
            attribute['homeZip'] = pipAttr['homeZip'];
            attribute['homeDma'] = pipAttr['homeDma'];
            attribute['homeCounty'] = pipAttr['homeCounty'];
          }
          else if (attribute['homeZip'] in zipTab14ResponseDict && attribute['homeZip'] == null || attribute['homeZip'] == '') {
            const attr = zipTab14ResponseDict[attribute['homeZip']];
            attribute['homeZip'] = attr['ZIP'];
            attribute['homeDma'] = attr['DMA'];
            attribute['homeCounty'] = attr['COUNTY'];
          }
          else {
            attribute['homeZip']    = '';
            attribute['homeDma']    = '';
            attribute['homeCounty'] = '';
          }
        });
        return attributes;
      }),
      switchMap(attributeList => {
        return this.determineHomeGeos(geocodeList, null, 'CL_ATZTAB14', 'geocode,ZIP'); 
      }),
      map(atzResponse => {
        const atzTab14ResponseDict = {};
        if (atzResponse.payload.length > 0){
            atzResponse.payload.forEach(row => {
              atzTab14ResponseDict[row['geocode']] = row;
          });
        }
        const pipAtzAttributes: Map<any, any> = mapBy(pipAttributes, 'homeAtz');
        attributes.forEach(attribute => {
          const pipAttr = pipAtzAttributes.get(attribute['homeAtz']);
          if (pipAttr != null){
            attribute['homeAtz'] = pipAttr['homeAtz'];
          }
          else if (attribute['homeAtz'] in atzTab14ResponseDict && attribute['homeAtz'] == null || attribute['homeAtz'] == ''){
            const attr = atzTab14ResponseDict[attribute['homeAtz']];
            attribute['homeAtz'] = attr['ZIP'];
          }else {
            attribute['homeAtz'] = '';
          }
        });
      })
    ); 
  }

  private processHomeGeoAttributes(attributes: any[], locations: ImpGeofootprintLocation[]) : void {
    const attributesBySiteNumber: Map<any, any> = mapBy(attributes, 'siteNumber');
    const impAttributesToAdd: ImpGeofootprintLocAttrib[] = [];
    let homeGeocodeIssue = 'Y';
    let warningNotificationFlag = 'N';
    locations.forEach(loc => {
      const currentAttributes = attributesBySiteNumber.get(`${loc.locationNumber}`);
      if (currentAttributes != null){
        Object.keys(currentAttributes).filter(key => key.startsWith('home')).forEach(key => {
          if (newHomeGeoToAnalysisLevelMap[key] != null) {
            // the service might return multiple values for a home geo (in case of overlapping geos)
            // as csv. For now, we're only taking the first result.
            const firstHomeGeoValue = `${currentAttributes[key]}`.split(',')[0];
            // validate homegeo rules
  
            if ((newHomeGeoToAnalysisLevelMap[key] !== 'Home DMA' && newHomeGeoToAnalysisLevelMap[key] !== 'Home County' ) && loc.origPostalCode != null && loc.origPostalCode !== ''
                 && (!loc.locZip.includes(loc.origPostalCode) || !firstHomeGeoValue.includes(loc.origPostalCode))) {
                      homeGeocodeIssue = 'Y';   
                      warningNotificationFlag = 'Y';
            }
  
            if ((newHomeGeoToAnalysisLevelMap[key] === 'Home PCR' && firstHomeGeoValue.length === 5) || (currentAttributes[key] == null
                || loc.clientLocationTypeCode === 'Failed Site' || loc.clientLocationTypeCode === 'Failed Competitor')){
                homeGeocodeIssue = 'Y'; 
                warningNotificationFlag = 'Y';  
            }
            
            if (currentAttributes[key] != null)   {
                homeGeocodeIssue = 'N'; 
                //warningNotificationFlag = 'N';  
              const newAttribute = this.domainFactory.createLocationAttribute(loc, newHomeGeoToAnalysisLevelMap[key], firstHomeGeoValue);
              impAttributesToAdd.push(newAttribute);
            } 
          }
        });
      }
     const newAttribute1 = this.domainFactory.createLocationAttribute(loc, 'Home Geocode Issue', homeGeocodeIssue);
     impAttributesToAdd.push(newAttribute1);
     homeGeocodeIssue = 'Y';
    });
    if (warningNotificationFlag === 'Y'){
      this.store$.dispatch(new WarningNotification({ notificationTitle: 'Home Geocode Warning', message: 'Issues found while calculating Home Geocodes, please check the Locations Grid.' }));
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
      if (loc.ycoord != null && loc.xcoord != null && loc.ycoord !== 0 && loc.xcoord !== 0 &&
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

  private determineHomeGeos(geocodeList: any[], analysisLevel: string, tableName: string, fieldNames: string) : Observable<any> {
    const requestPayload = {'tableName': tableName, 'fieldNames': fieldNames, 'geocodeList': [] };
    const orginalPayload = [];
    requestPayload['geocodeList'] = geocodeList;
    /*locations.forEach(loc => {
      if (tableName === 'CL_ATZTAB14'){
        requestPayload['geocodeList'].push(loc.locZip.substring(0, 5));
        orginalPayload.push({'geocoderCarrierRoute' : loc.carrierRoute, 'zip' : loc.locZip.substring(0, 5), 'siteNumber' : loc.locationNumber,
                          'X' : loc.xcoord, 'Y' : loc.ycoord});
      }
      else{
        requestPayload['geocodeList'].push(loc.locZip.substring(0, 5) + loc.carrierRoute);
        orginalPayload.push({'geocoderCarrierRoute' : loc.carrierRoute, 'zip' : loc.locZip.substring(0, 5), 'siteNumber' : loc.locationNumber,
                          'X' : loc.xcoord, 'Y' : loc.ycoord});  
      }
      
    });*/
    //this.logger.info('request payload:::::', requestPayload);
    return this.getHomegeocodeData(requestPayload, 'v1/targeting/base/homegeo/homegeocode');
  }

  private getHomegeocodeData(requestPayload: any, url: string)  {
    return this.restService.post('v1/targeting/base/homegeo/homegeocode', requestPayload);
  }
}
