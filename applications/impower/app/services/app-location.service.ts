import { Injectable } from '@angular/core';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ValGeocodingRequest } from '../models/val-geocoding-request.model';
import { ImpGeofootprintLocAttrib } from '../val-modules/targeting/models/ImpGeofootprintLocAttrib';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocAttribService } from '../val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import { AppGeocodingService } from './app-geocoding.service';
import { combineLatest, merge, Observable, EMPTY, of } from 'rxjs';
import { filter, map, pairwise, startWith } from 'rxjs/operators';
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
import { toUniversalCoordinates, mapByExtended, isNumber } from '@val/common';
import { EsriApi, EsriGeoprocessorService, EsriLayerService, EsriMapService } from '@val/esri';
import { calculateStatistics, filterArray, groupByExtended, mapBy, simpleFlatten } from '@val/common';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { mergeMap } from 'rxjs/internal/operators/mergeMap';

const getHomeGeoKey = (analysisLevel: string) => `Home ${analysisLevel}`;
const homeGeoColumnsSet = new Set(['Home ATZ', 'Home Zip Code', 'Home Carrier Route', 'Home Digital ATZ', 'Home County', 'Home DMA']);

const newHomeGeoToAnalysisLevelMap = {
  homeAtz: getHomeGeoKey('ATZ'),
  homeCounty: getHomeGeoKey('County'),
  homeDigitalAtz: getHomeGeoKey('Digital ATZ'),
  homeDma: getHomeGeoKey('DMA'),
  homePcr: getHomeGeoKey('Carrier Route'),
  homeZip: getHomeGeoKey('Zip Code')
};

function isReadyforHomegeocoding(loc: ImpGeofootprintLocation) : boolean {
  // filterArray(loca => !loc.clientLocationTypeCode.startsWith('Failed ')),
  // filterArray(loca => loc['homeGeoFound'] == null),
  // filterArray(loca => loc.ycoord != null && loc.xcoord != null && loc.ycoord !== 0 && loc.xcoord !== 0);
  //const homeGeoColumns = ['Home ATZ', 'Home ZIP', 'Home PCR', 'Home Digital ATZ', 'Home County', 'Home DMA'];
 
  const attrMap = {};
  loc.impGeofootprintLocAttribs.forEach(attr => {
    if (homeGeoColumnsSet.has(attr.attributeCode)){
      attrMap[attr.attributeCode] = attr.attributeValue;
    }
    // if (homeGeoColumns.includes(attr.attributeCode)){
    //   attrMap[attr.attributeCode] = attr.attributeValue;
    // }
  });
      
  if (Object.keys(attrMap).length < 6 || attrMap['Home ATZ'] === '' || attrMap['Home Zip Code'] === '' || attrMap['Home Carrier Route'] === '' || attrMap['Home DMA'] === '' 
     || attrMap['Home Digital ATZ'] === '' || attrMap['Home County'] === '') {
       
     return true;
     }

  return false;
}

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
      filterArray(loc => isReadyforHomegeocoding(loc)),
    );
           
    const locationsWithHomeGeos$ = locationsWithType$.pipe(
      filterArray(loc => loc.impGeofootprintLocAttribs.some(attr => homeGeoColumnsSet.has(attr.attributeCode) && attr.attributeValue != null && attr.attributeValue.length > 0)),
      filterArray(loc => isNumber(loc.radius1) || isNumber(loc.radius2) || isNumber(loc.radius3) )
    );

    const locationsWithoutRadius$ = locationsWithType$.pipe(
      filterArray(loc => loc.impGeofootprintLocAttribs.some(attr => homeGeoColumnsSet.has(attr.attributeCode) && attr.attributeValue != null && attr.attributeValue.length > 0)),
      filterArray(loc => !(isNumber(loc.radius1) || isNumber(loc.radius2) || isNumber(loc.radius3)) )
    );

    this.totalCount$ = allLocations$.pipe(
      map(locations => locations.length)
    );

    this.totalCount$.pipe(
      pairwise(),
      filter(([prev, curr]) => prev > 0 && curr === 0)
    ).subscribe(() => this.esriLayerService.clearClientLayers());

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

   combineLatest(locationsWithHomeGeos$, this.appStateService.applicationIsReady$).pipe(
      filter(([locations, isReady]) => locations.length > 0 && isReady)
    ).subscribe(() => this.confirmationBox());

    combineLatest(locationsWithoutRadius$, this.appStateService.applicationIsReady$).pipe(
      filter(([locations, isReady]) => locations.length > 0 && isReady)
    ).subscribe(([locations]) => this.appTradeAreaService.onLocationsWithoutRadius(locations));

    combineLatest(this.appStateService.analysisLevel$, this.appStateService.applicationIsReady$).pipe(
      filter(([level, isReady]) => level != null && level.length > 0 && isReady)
    ).subscribe(([]) => this.appTradeAreaService.onAnalysisLevelChange());
    
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


        if (attributes.length > 0) this.impLocAttributeService.remove(attributes);
        this.appTradeAreaService.deleteTradeAreas(tradeAreas);
        // remove from the data stores in top-down order to avoid home geos and default trade areas from getting applied
        this.impLocationService.remove(nonNullSites);
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
    const duplicatedLocDict = {};
    const duplicatedAtzLocDict = {};
    const dtzAttributes = [];
    locations.forEach(loc => {
      if ( Object.keys(locDicttemp).includes(loc.locZip.substring(0, 5) + loc.carrierRoute)){
        duplicatedLocDict[loc.locZip.substring(0, 5) + loc.carrierRoute] = loc;
      } 
      else{
        locDicttemp[loc.locZip.substring(0, 5) + loc.carrierRoute] = loc;
      }
      if ( Object.keys(zipLocDictemp).includes(loc.locZip.substring(0, 5))){
        duplicatedAtzLocDict[loc.locZip.substring(0, 5)] = loc;
      }
      else{
        zipLocDictemp[loc.locZip.substring(0, 5)] = loc;
      }
      //['Home ATZ', 'Home ZIP', 'Home PCR', 'Home Digital ATZ', 'Home County', 'Home DMA']
      const attrMap = {};
      loc.impGeofootprintLocAttribs.forEach(attr => {
        if (homeGeoColumnsSet.has(attr.attributeCode) && attr.attributeValue != null){
          attrMap[attr.attributeCode] = attr.attributeValue;
        }
      });
      
      if (attrMap['Home ATZ'] !== '' && attrMap['Home Zip Code'] !== '' && attrMap['Home Carrier Route'] !== '' && attrMap['Home DMA'] !== '' 
       && attrMap['Home County'] !== '' && attrMap['Home Digital ATZ'] === ''){
          dtzAttributes.push({
            'homeZip'     :  attrMap['Home Zip Code'],
            'homeCounty'  :  attrMap['Home County'],
            'homeDma'     :  attrMap['Home DMA'],
            'homePcr'     :  attrMap['Home Carrier Route'],
            'homeAtz'     :  attrMap['Home ATZ'],
            'siteNumber'  :  loc.locationNumber
           // 'abZip'       :  loc.locZip.substring(0, 5) 
          });

          pointPolyNotRequiredLocations.splice(pointPolyNotRequiredLocations.indexOf(loc), 1);  
          pointPolyLocations.splice(pointPolyLocations.indexOf(loc), 1);         
       }
    });
    const pcrGeocodeList = [];
    const pcrResponseGeocodeList = [];
    const key = 'HomeGeoCalcKey';
    this.store$.dispatch(new StartBusyIndicator({ key, message: 'Calculating Home Geos'}));
    pointPolyNotRequiredLocations.forEach(loc => pcrGeocodeList.push(loc.locZip.substring(0, 5) + loc.carrierRoute));
    const locMap = groupByExtended(pointPolyNotRequiredLocations, loc => loc.locZip.substring(0, 5) + loc.carrierRoute);
    const atzLocMap = groupByExtended(pointPolyNotRequiredLocations, loc => loc.locZip.substring(0, 5));
    
    if (dtzAttributes.length > 0){
      this.determineDtzHomegeos(dtzAttributes, locations).
      subscribe(null, 
        err => this.store$.dispatch(new StopBusyIndicator({ key })), 
        () => {
          this.processHomeGeoAttributes(dtzAttributes, locations);
          this.flagHomeGeos(locations, analysisLevel);
          this.store$.dispatch(new SuccessNotification({ notificationTitle: 'Home Geo', message: 'Home Geo calculation is complete.' }));
          this.store$.dispatch(new StopBusyIndicator({ key }));
          // this.confirmationBox();
        });
    }
    if (pointPolyNotRequiredLocations.length > 0 || pointPolyLocations.length > 0){

      this.determineHomeGeos(pcrGeocodeList, analysisLevel, 'CL_PCRTAB14', 'geocode,ZIP , ATZ, DMA, COUNTY').pipe(
        map(res => {
          const atzLocationsNotFound = [];
          const pcrTab14Response = res;
          res.payload.forEach(row => {
            if (locDicttemp[row['geocode']] !== null && row['score'] == null) {
              atzLocationsNotFound.push(locDicttemp[row['geocode']]);
            }
            pcrResponseGeocodeList.push(row['geocode']);
            let homePcr = null;
            let homeDma = null;
            let homeZip = null;
            let homeAtz_provided = null;
            let homeCounty = null;
            
            if (pcrTab14Response != null && pcrTab14Response.payload.length > 0){
               const filteredLoc = locDicttemp[row['geocode']];
               const homeAtz = row['score'] != null ? row['ZIP'] + row['score'] : null;
               if (duplicatedLocDict[row['geocode']] != null){
                  const locs = locMap.get(row['geocode']);
                  locs.forEach(loc => {
                    homePcr = loc.impGeofootprintLocAttribs.filter(attr => attr.attributeCode === 'Home Carrier Route')[0];
                    homeDma = loc.impGeofootprintLocAttribs.filter(attr => attr.attributeCode === 'Home DMA')[0];
                    homeZip = loc.impGeofootprintLocAttribs.filter(attr => attr.attributeCode === 'Home Zip Code')[0];
                    homeAtz_provided = loc.impGeofootprintLocAttribs.filter(attr => attr.attributeCode === 'Home ATZ')[0];
                    homeCounty = loc.impGeofootprintLocAttribs.filter(attr => attr.attributeCode === 'Home County')[0];
                    //delete duplicatedLocDict[row['geocode']];
                    attributeList.push({
                      'homeZip'     :  homeZip    && homeZip.attributeValue !== '' ? homeZip.attributeValue : `${row['ZIP']}`,
                      'homeCounty'  :  homeCounty && homeCounty.attributeValue !== '' ? homeCounty.attributeValue : `${row['homeCounty']}`,
                      'homeDma'     :  homeDma    && homeDma.attributeValue !== '' ? homeDma.attributeValue :  `${row['homeDma']}`,
                      'homePcr'     :  homePcr    && homePcr.attributeValue !== '' ? homePcr.attributeValue :  `${row['geocode']}`,
                      'homeAtz'     :  homeAtz_provided && homeAtz_provided.attributeValue !== '' ? homeAtz_provided.attributeValue : homeAtz,
                      'siteNumber'  :  loc.locationNumber,
                      'abZip'       :  loc.locZip.substring(0, 5) 
                    });
                  });
               }
               else{
                homePcr = locDicttemp[row['geocode']].impGeofootprintLocAttribs.filter(attr => attr.attributeCode === 'Home Carrier Route')[0];
                homeDma = locDicttemp[row['geocode']].impGeofootprintLocAttribs.filter(attr => attr.attributeCode === 'Home DMA')[0];
                homeZip = locDicttemp[row['geocode']].impGeofootprintLocAttribs.filter(attr => attr.attributeCode === 'Home Zip Code')[0];
                homeAtz_provided = locDicttemp[row['geocode']].impGeofootprintLocAttribs.filter(attr => attr.attributeCode === 'Home ATZ')[0];
                homeCounty = locDicttemp[row['geocode']].impGeofootprintLocAttribs.filter(attr => attr.attributeCode === 'Home County')[0];
                attributeList.push({
                  'homeZip'     :  homeZip     && homeZip.attributeValue !== '' ? homeZip.attributeValue : `${row['ZIP']}`,
                  'homeCounty'  :  homeCounty  && homeCounty.attributeValue !== '' ? homeCounty.attributeValue : `${row['homeCounty']}`,
                  'homeDma'     :  homeDma     && homeDma.attributeValue !== '' ? homeDma.attributeValue :  `${row['homeDma']}`,
                  'homePcr'     :  homePcr     && homePcr.attributeValue !== '' ? homePcr.attributeValue :  `${row['geocode']}`,
                  'homeAtz'     :  homeAtz_provided  && homeAtz_provided.attributeValue !== '' ? homeAtz_provided.attributeValue : homeAtz,
                  'siteNumber'  :  filteredLoc.locationNumber,
                  'abZip'       :  filteredLoc.locZip.substring(0, 5) 
                });
               }
                 responseGeocodes.push(row['geocode'].substring(0, 5));
            }
          });
          console.log('atzLocationsNotFound:::', atzLocationsNotFound);
          return atzLocationsNotFound;
        }),
        mergeMap(locs => {
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
              if (filterAtribute['homeAtz'] == null && filterAtribute['abZip'] in atzTab14ResponseDict) {
                const attr = atzTab14ResponseDict[filterAtribute['abZip']];
                if (duplicatedAtzLocDict[filterAtribute['abZip']] == null){
                  delete atzTab14ResponseDict[filterAtribute['abZip']];
                }
                filterAtribute['homeAtz'] = attr['ZIP'];
              }
            });
            if (Object.keys(atzTab14ResponseDict).length > 0){
                //Object.keys(atzTab14ResponseDict).forEach(geo => {})
                Object.entries(atzTab14ResponseDict).forEach(([geo, value]) => {
                  const filteredLoc = zipLocDictemp[value['geocode']];
                  const homeAtz = filteredLoc.impGeofootprintLocAttribs.filter(attr => attr.attributeCode === 'Home ATZ')[0];
                  pipAttributeList.push({
                   'homeAtz'     :  homeAtz && homeAtz.attributeValue !== '' ? homeAtz.attributeValue : `${value['ZIP']}`,
                   'siteNumber'  :  filteredLoc.locationNumber 
                  });
                });
            }
          }
        }),
        mergeMap(() => {
          const missingZipFuseResponseLoc = pcrGeocodeList.filter(x => !pcrResponseGeocodeList.includes(x));
          if (missingZipFuseResponseLoc.length > 0){
            missingZipFuseResponseLoc.forEach(geo => {
            //  console.log('geo not foount in PCR duplicates:::', geo, 'and location', locDicttemp[geo]);
              pointPolyLocations.push(locDicttemp[geo]);
            });
          }
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
          const pipAtzAttributes: Map<any, any> = mapBy(pipAttributeList, 'siteNumber');
          if (Object.keys(zipTab14ResponseDict).length > 0){
            Object.entries(zipTab14ResponseDict).forEach(([geo, value]) => {
              const filteredLoc = zipLocDictemp[value['geocode']];
              if (pipAtzAttributes.get(filteredLoc.locationNumber) != null){
                pipAttributeList.push({
                  'homeZip'     : `${value['ZIP']}`,
                  'homeDma'     : `${value['homeDma']}`,
                  'homeCounty'  : `${value['homeCounty']}`
                 // 'siteNumber'  :  filteredLoc.locationNumber 
                 });
              }
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
              // this.confirmationBox();
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
            // this.confirmationBox();
          });
        }
      });
    }
  }

  private confirmationBox() : void {
    if (this.cachedTradeAreas != null && this.cachedTradeAreas.length !== 0){
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
   // const data = locations.filter(loc => loc.impGeofootprintLocAttribs.length > 0 && loc.impGeofootprintLocAttribs.filter(attr => attr.attributeCode === 'Home Digital ATZ' && attr.attributeValue !== ''));
    const locTempDict: Map<any, any> = mapByExtended(locations.filter(loc => loc.impGeofootprintLocAttribs.length > 0 && loc.impGeofootprintLocAttribs.filter
      (attr => attr.attributeCode === 'Home Digital ATZ' && attr.attributeValue !== '')), item => item.locationNumber);
    return this.determineHomeGeos(zipGeocodeList, null, 'VAL_DIGTAB14', 'geocode, ZIP, ZIP_ATZ').pipe(
      map(zipResponse => {
        const zipResponseDict = [];
        if (zipResponse.payload.length > 0){
          zipResponse.payload.forEach(row => {
            zipResponseDict[row['geocode']] = row;
          });
        }
        attributes.forEach(attribute => {
          const homeDtz = locTempDict.get(attribute['siteNumber']) != null ? locTempDict.get(attribute['siteNumber']).impGeofootprintLocAttribs.filter(attr => attr.attributeCode === 'Home Digital ATZ')[0] : null;
          if (locTempDict.get(attribute['siteNumber']) != null && homeDtz && homeDtz.attributeValue != ''){
            attribute['homeDigitalAtz'] = homeDtz && homeDtz.attributeValue != '' ? homeDtz.attributeValue : '';
          }
          else if (attribute['homeZip'] in zipResponseDict){
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
      mergeMap(remainingAttr => {
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
          if (attribute['homeAtz'] in atzResponseDict || attribute['homeDigitalAtz'] !== ''){
            /*const attr = atzResponseDict[attribute['homeAtz']];
            attribute['homeDigitalAtz'] = attr['geocode'];*/
            attribute['homeDigitalAtz'] = attribute['homeDigitalAtz'] !== '' ? attribute['homeDigitalAtz'] : atzResponseDict[attribute['homeAtz']]['geocode']; 
          }
          else {
            attribute['homeDigitalAtz'] = '';
            remainingAttributes.push(attribute);
          }
        });
        return remainingAttributes;
      }),
      mergeMap(remainingAttr => {
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
            attribute['homeDigitalAtz'] = attribute['homeDigitalAtz'] !== '' ? attribute['homeDigitalAtz'] : pctResponseDict[attribute['homePcr']]['geocode'];
            /*const attr = pctResponseDict[attribute['homePcr']];
            attribute['homeDigitalAtz'] = attr['geocode'];*/
          }
        });
      })
    );
  }

  private validateHomeGeoAttributes(attributes: any[], locations: ImpGeofootprintLocation[], pipAttributes: any[]) : Observable<any>{
   // const attributesBySiteNumber: Map<any, any> = mapBy(attributes, 'siteNumber');
    let geocodeList = [];
    const locDicttemp = {};
    //const locDictZiptemp = {};
    locations.forEach(loc => {
      locDicttemp[loc.locationNumber] = loc;
      //locDictZiptemp[loc.locZip.substring(0, 5)] = loc;
    });
    attributes.forEach(attr => {
        if (attr['homePcr'] != null && attr['homePcr'] !== '' && attr['homePcr'].split(',').length > 1){
          attr['homePcr'].split(',').forEach(pcr => geocodeList.push(pcr));
        }
        else{
          geocodeList.push(attr['homePcr']);
        }
    });
    const attributesByHomePcr: Map<any, any> = mapByExtended(attributes.filter(attr => attr['homePcr'] !== ''), item => item['homePcr']);
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
            let homePcr = null;
            if (locDicttemp[attribute['siteNumber']] != null && locDicttemp[attribute['siteNumber']].impGeofootprintLocAttribs.length > 0){
              homePcr = locDicttemp[attribute['siteNumber']].impGeofootprintLocAttribs.filter(attri => attri.attributeCode === 'Home Carrier Route')[0];
            }
            attribute['homePcr'] = homePcr && homePcr.attributeValue !== '' ? homePcr.attributeValue : attr['geocode'];
          }
          else if (attribute['homePcr'] != null && attribute['homePcr'] !== '' && attribute['homePcr'].split(',').length > 1 && attribute['homePcr'].includes(attribute['geocoderZip'])){
            attribute['homePcr'].split(',').forEach(pcr => {
              if (pcr in pcrTab14ResponseDict && attribute['homePcr'].includes(attribute['geocoderZip']) && pcr.substring(0, 5) === attribute['geocoderZip']){
                const attr = pcrTab14ResponseDict[pcr];
                let homePcr = null;
                if (locDicttemp[attribute['siteNumber']] != null && locDicttemp[attribute['siteNumber']].impGeofootprintLocAttribs.length > 0){
                  homePcr = locDicttemp[attribute['siteNumber']].impGeofootprintLocAttribs.filter(attri => attri.attributeCode === 'Home Carrier Route')[0];
                }
                attribute['homePcr'] = homePcr && homePcr.attributeValue !== '' ? homePcr.attributeValue : attr['geocode'];
              }
            });
          }
         /* else {
            attribute['homePcr'] = '';
          } */
        });
        return attributes;
      }),
      mergeMap(attributesList => {
        geocodeList = [];
        //pcrLocationsValidate.forEach(loc => geocodeList.push(loc.locZip.substring(0, 5)));
        attributes.forEach(attr => {
          if (attr['homeZip'] != null && attr['homeZip'] !== '' && attr['homeZip'].split(',').length > 1){
            attr['homeZip'].split(',').forEach(zip => geocodeList.push(zip));
          }
          else{
            geocodeList.push(attr['homeZip']);
          }
        });
        return this.determineHomeGeos(geocodeList, null, 'CL_ZIPTAB14', 'geocode, ZIP, DMA, COUNTY');
      }),
      map(zipResponse => {
        const zipTab14ResponseDict = {};
        if (zipResponse.payload.length > 0){
          zipResponse.payload.forEach(row => {
            zipTab14ResponseDict[row['geocode']] = row;
          });
        }
        const pipZipAttributes: Map<any, any> = mapBy(pipAttributes, 'siteNumber');
        attributes.forEach(attribute => {
          const pipAttr = pipZipAttributes.get(attribute['siteNumber']);
          let homeZip = null;
          let homeDma = null;
          let homeCounty = null;
          if (pipAttr != null) {
            if (locDicttemp[pipAttr['siteNumber']] != null ){
              homeZip = locDicttemp[pipAttr['siteNumber']].impGeofootprintLocAttribs.filter(attr => attr.attributeCode === 'Home Zip Code')[0];
              homeDma = locDicttemp[pipAttr['siteNumber']].impGeofootprintLocAttribs.filter(attr => attr.attributeCode === 'Home DMA')[0];
              homeCounty = locDicttemp[pipAttr['siteNumber']].impGeofootprintLocAttribs.filter(attr => attr.attributeCode === 'Home County')[0];
            }
            
            attribute['homeZip'] = homeZip && homeZip.attributeValue !== '' ? homeZip.attributeValue : pipAttr['homeZip'];
            attribute['homeDma'] = homeDma && homeDma.attributeValue !== '' ? homeDma.attributeValue : pipAttr['homeDma'];
            attribute['homeCounty'] = homeCounty && homeCounty.attributeValue !== '' ? homeCounty.attributeValue : pipAttr['homeCounty'];
          }
          //&& attribute['homeZip'] == null || attribute['homeZip'] == '' need to look back
          else if (attribute['homeZip'] in zipTab14ResponseDict ) {
            const attr = zipTab14ResponseDict[attribute['homeZip']];
            if (locDicttemp[attribute['siteNumber']] != null){
              homeZip = locDicttemp[attribute['siteNumber']].impGeofootprintLocAttribs.filter(attri => attri.attributeCode === 'Home Zip Code')[0];
              homeDma = locDicttemp[attribute['siteNumber']].impGeofootprintLocAttribs.filter(attri => attri.attributeCode === 'Home DMA')[0];
              homeCounty = locDicttemp[attribute['siteNumber']].impGeofootprintLocAttribs.filter(attri => attri.attributeCode === 'Home County')[0];
            }
           
            attribute['homeZip'] = homeZip && homeZip.attributeValue !== '' ? homeZip.attributeValue : attr['ZIP'];
            attribute['homeDma'] = homeDma && homeDma.attributeValue !== '' ? homeDma.attributeValue : attr['homeDma'];
            attribute['homeCounty'] = homeCounty && homeCounty.attributeValue !== '' ? homeCounty.attributeValue : attr['homeCounty'];
          }
          else if (attribute['homeZip'] != null && attribute['homeZip'] !== '' &&  attribute['homeZip'].split(',').length > 1 
                  && attribute['homeZip'].includes(attribute['geocoderZip']) && attribute['geocoderZip'] in zipTab14ResponseDict){
            //if (attribute['homeZip'].includes(attribute['geocoderZip'])){
              const attr = zipTab14ResponseDict[attribute['geocoderZip']];
              if (locDicttemp[attribute['siteNumber']] != null){
                homeZip = locDicttemp[attribute['siteNumber']].impGeofootprintLocAttribs.filter(attri => attri.attributeCode === 'Home Zip Code')[0];
                homeDma = locDicttemp[attribute['siteNumber']].impGeofootprintLocAttribs.filter(attri => attri.attributeCode === 'Home DMA')[0];
                homeCounty = locDicttemp[attribute['siteNumber']].impGeofootprintLocAttribs.filter(attri => attri.attributeCode === 'Home County')[0];
              }
             
              attribute['homeZip'] = homeZip && homeZip.attributeValue !== '' ? homeZip.attributeValue : attr['ZIP'];
              attribute['homeDma'] = homeDma && homeDma.attributeValue !== '' ? homeDma.attributeValue : attr['homeDma'];
              attribute['homeCounty'] = homeCounty && homeCounty.attributeValue !== '' ? homeCounty.attributeValue : attr['homeCounty'];
           // }
          }
         /* else {
            attribute['homeZip']    = '';
            attribute['homeDma']    = '';
            attribute['homeCounty'] = '';
          }*/
        });
        return attributes;
      }),
      mergeMap(attributeList => {
        geocodeList = [];
        attributes.forEach(attr => {
          if (attr['homeAtz'] != null && attr['homeAtz'] !== '' && attr['homeAtz'].split(',').length > 1){
            attr['homeAtz'].split(',').forEach(atz => geocodeList.push(atz));
          }else{
            geocodeList.push(attr['homeAtz']);
          }
        });
        return this.determineHomeGeos(geocodeList, null, 'CL_ATZTAB14', 'geocode,ZIP'); 
      }),
      map(atzResponse => {
        const atzTab14ResponseDict = {};
        if (atzResponse.payload.length > 0){
            atzResponse.payload.forEach(row => {
              atzTab14ResponseDict[row['geocode']] = row;
          });
        }
        const pipAtzAttributes: Map<any, any> = mapBy(pipAttributes, 'siteNumber');
        attributes.forEach(attribute => {
          const pipAttr = pipAtzAttributes.get(attribute['siteNumber']);
          
          if (pipAttr != null && pipAttr['siteNumber'] != null && pipAttr['homeAtz'] != null){
            const homeAtz = locDicttemp[pipAttr['siteNumber']] != null ? locDicttemp[pipAttr['siteNumber']].impGeofootprintLocAttribs.filter(attr => attr.attributeCode === 'Home ATZ')[0] : null;
            attribute['homeAtz'] = homeAtz && homeAtz.attributeValue !== '' ? homeAtz.attributeValue : pipAttr['homeAtz'];
          }
          //&& attribute['homeAtz'] == null || attribute['homeAtz'] == ''
          else if (attribute['homeAtz'] in atzTab14ResponseDict ){
            const attr = atzTab14ResponseDict[attribute['homeAtz']];
            const homeAtz = locDicttemp[attribute['siteNumber']] != null ? locDicttemp[attribute['siteNumber']].impGeofootprintLocAttribs.filter(attri => attri.attributeCode === 'Home ATZ')[0] : null;
            attribute['homeAtz'] = homeAtz && homeAtz.attributeValue !== '' ? homeAtz.attributeValue : attr['geocode'];
          }
          else if (attribute['homeAtz'] != null && attribute['homeAtz'] !== '' &&  attribute['homeAtz'].split(',').length > 1 && attribute['homeAtz'].includes(attribute['geocoderZip'])){
            attribute['homeAtz'].split(',').forEach(atz => {
              if (atz in atzTab14ResponseDict && attribute['homeAtz'].includes(attribute['geocoderZip']) && atz.substring(0, 5) === attribute['geocoderZip']){
                const attr = atzTab14ResponseDict[atz];
                const homeAtz = locDicttemp[attribute['siteNumber']] != null ? locDicttemp[attribute['siteNumber']].impGeofootprintLocAttribs.filter(attri => attri.attributeCode === 'Home ATZ')[0] : null;
                attribute['homeAtz'] = homeAtz && homeAtz.attributeValue !== '' ? homeAtz.attributeValue : attr['geocode'];
              }
            });
          }
         /* else {
            attribute['homeAtz'] = '';
          }*/
        });
      })
    ); 
  }

  private processHomeGeoAttributes(attributes: any[], locations: ImpGeofootprintLocation[]) : void {
    const attributesBySiteNumber: Map<any, any> = mapBy(attributes, 'siteNumber');
    const impAttributesToAdd: ImpGeofootprintLocAttrib[] = [];
    let homeGeocodeIssue = 'N';
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

            if (loc.origPostalCode != null && loc.origPostalCode.length > 0 && (loc.locZip.substr(0, 5) !== loc.origPostalCode.substr(0, 5))) {
                  homeGeocodeIssue = 'Y';   
                  warningNotificationFlag = 'Y';
            }
            if (newHomeGeoToAnalysisLevelMap[key] !== 'Home DMA' && newHomeGeoToAnalysisLevelMap[key] !== 'Home County' 
              && (firstHomeGeoValue.length === 0 || (firstHomeGeoValue.length > 0 && loc.locZip.length > 0 && firstHomeGeoValue.substr(0, 5) !== loc.locZip.substr(0, 5)))){
                  homeGeocodeIssue = 'Y';   
                   warningNotificationFlag = 'Y';
            }
            if (currentAttributes['homePcr'] === currentAttributes['homeZip'] || (currentAttributes[key] == null
                || loc.geocoderMatchCode != null && loc.geocoderMatchCode.startsWith('Z') || loc.geocoderLocationCode != null && loc.geocoderLocationCode.startsWith('Z'))){
                homeGeocodeIssue = 'Y'; 
                warningNotificationFlag = 'Y';  
            }
            if (currentAttributes[key] != null && currentAttributes[key] != '')   {
              const newAttribute = this.domainFactory.createLocationAttribute(loc, newHomeGeoToAnalysisLevelMap[key], firstHomeGeoValue);
              if (newAttribute != null)
                impAttributesToAdd.push(newAttribute);
            } 
          } 
        });
      }
     const newAttribute1 = this.domainFactory.createLocationAttribute(loc, 'Home Geocode Issue', homeGeocodeIssue);
     if (newAttribute1 != null)
        impAttributesToAdd.push(newAttribute1);
     homeGeocodeIssue = 'N';
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
    //const requestPayload = {'tableName': tableName, 'fieldNames': fieldNames, 'geocodeList': [] };
    const orginalPayload = [];
    //requestPayload['geocodeList'] = geocodeList;
    const chunked_arr = [];
    let index = 0;
    while (index < geocodeList.length) {
      chunked_arr.push(geocodeList.slice(index, 999 + index));
      index += 999;
    }
    //console.log('chunked_arr size::::', chunked_arr);
   
    const obs = chunked_arr.map(geoList => {
      const reqPayload = {'tableName': tableName, 'fieldNames': fieldNames, 'geocodeList': [] };
      reqPayload['geocodeList'] = geoList;
      //console.log('request payload::::', reqPayload);
      return this.getHomegeocodeData(reqPayload, 'v1/targeting/base/homegeo/homegeocode');
    });
    //merge(...obs, 4).subscribe(result => console.log(' test response chunk size', result));
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
    return merge(...obs, 4);
    //this.getHomegeocodeData(requestPayload, 'v1/targeting/base/homegeo/homegeocode');
  }

  private getHomegeocodeData(requestPayload: any, url: string)  {
    return this.restService.post('v1/targeting/base/homegeo/homegeocode', requestPayload);
  }
}
