import { Injectable } from '@angular/core';
import { ClearLocations, RenderLocations } from '../state/rendering/rendering.actions';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ValGeocodingRequest } from '../models/val-geocoding-request.model';
import { ImpGeofootprintLocAttrib } from '../val-modules/targeting/models/ImpGeofootprintLocAttrib';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocAttribService } from '../val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import { AppGeocodingService } from './app-geocoding.service';
import { combineLatest, merge, Observable, EMPTY, of, forkJoin } from 'rxjs';
import { filter, map, pairwise, startWith, tap, withLatestFrom, take } from 'rxjs/operators';
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
import { FullAppState, LocalAppState } from '../state/app.interfaces';
import { ErrorNotification, StartBusyIndicator, StopBusyIndicator, SuccessNotification, WarningNotification } from '@val/messaging';
import { LocationQuadTree } from '../models/location-quad-tree';
import { toUniversalCoordinates, mapByExtended, isNumber } from '@val/common';
import { EsriApi, EsriGeoprocessorService, EsriLayerService, EsriMapService, selectors, EsriQueryService } from '@val/esri';
import { calculateStatistics, filterArray, groupByExtended, mapBy, simpleFlatten } from '@val/common';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { mergeMap } from 'rxjs/internal/operators/mergeMap';
import { reduce } from 'rxjs/internal/operators/reduce';
import { concat } from 'rxjs/internal/observable/concat';
import { switchMap } from 'rxjs/internal/operators/switchMap';
import { empty } from 'rxjs/internal/observable/empty';
import { select } from '@ngrx/store';
import { EnvironmentData } from 'environments/environment.qa';

const getHomeGeoKey = (analysisLevel: string) => `Home ${analysisLevel}`;
const homeGeoColumnsSet = new Set(['Home ATZ', 'Home Zip Code', 'Home Carrier Route', 'Home County', 'Home DMA', 'Home DMA Name', 'Home Digital ATZ']);
//'Home Digital ATZ'

const newHomeGeoToAnalysisLevelMap = {
  homeAtz: getHomeGeoKey('ATZ'),
  homeCounty: getHomeGeoKey('County'),
  homeDigitalAtz: getHomeGeoKey('Digital ATZ'),
  homeDma: getHomeGeoKey('DMA'),
  homeDmaName: getHomeGeoKey('DMA Name'),
  homePcr: getHomeGeoKey('Carrier Route'),
  homeZip: getHomeGeoKey('Zip Code')
};

const tagToFieldName = {
  'zip': 'homeZip',
  'atz': 'homeAtz',
  'pcr': 'homePcr',
  'dtz': 'homeDtz'
};

function isReadyforHomegeocoding(loc: ImpGeofootprintLocation) : boolean {
  const attrMap = {};
  loc.impGeofootprintLocAttribs.forEach(attr => {
    if (homeGeoColumnsSet.has(attr.attributeCode)){
      attrMap[attr.attributeCode] = attr.attributeValue;
    }
  });
  const pipLocationsnullHomeGeos = [];
  if (!loc.clientLocationTypeCode.startsWith('Failed ') &&
      loc['homeGeoFound'] == null &&
      (loc.ycoord != null && loc.xcoord != null && loc.ycoord !== 0 && loc.xcoord !== 0) &&
      (Object.keys(attrMap).length < 6 || attrMap['Home ATZ'] === '' || attrMap['Home Zip Code'] === '' || attrMap['Home Carrier Route'] === '' || attrMap['Home DMA'] === ''
     || attrMap['Home DMA Name'] === '' || attrMap['Home Digital ATZ'] === '' || attrMap['Home County'] === '')) {

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
              private queryService: EsriQueryService,
              private esriGeoprocessingService: EsriGeoprocessorService,
              private logger: AppLoggingService,
              private domainFactory: ImpDomainFactoryService,
              private confirmationService: ConfirmationService,
              private restService: RestDataService,
              private store$: Store<FullAppState>) {

    this.allClientLocations$ = this.appStateService.allClientLocations$;
    this.allCompetitorLocations$ = this.appStateService.allCompetitorLocations$;
    this.activeClientLocations$ = this.appStateService.activeClientLocations$;
    this.activeCompetitorLocations$ = this.appStateService.activeCompetitorLocations$;

    this.store$.pipe(
      select(selectors.getMapReady),
      filter(ready => ready),
      take(1)
    ).subscribe(() => this.initializeSubscriptions());
  }

  private initializeSubscriptions() {
    const allLocations$ = this.impLocationService.storeObservable.pipe(
      filter(locations => locations != null)
    );
    const locationsWithType$ = allLocations$.pipe(
      filterArray(l => l.clientLocationTypeCode != null && l.clientLocationTypeCode.length > 0),
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

    const successfulLocations$ = locationsWithType$.pipe(
      filterArray(loc => loc.clientLocationTypeCode === 'Site' || loc.clientLocationTypeCode === 'Competitor')
    );
    const siteCount$ = successfulLocations$.pipe(
      filterArray(loc => loc.clientLocationTypeCode === 'Site'),
      map(locs => locs.length)
    );
    const competitorCount$ = successfulLocations$.pipe(
      filterArray(loc => loc.clientLocationTypeCode === 'Competitor'),
      map(locs => locs.length)
    );

    successfulLocations$.subscribe(locations => this.store$.dispatch(new RenderLocations({ locations })));
    siteCount$.pipe(
      pairwise(),
      filter(([prev, curr]) => prev > 0 && curr === 0)
    ).subscribe(() => this.store$.dispatch(new ClearLocations({ type: ImpClientLocationTypeCodes.Site })));
    competitorCount$.pipe(
      pairwise(),
      filter(([prev, curr]) => prev > 0 && curr === 0)
    ).subscribe(() => this.store$.dispatch(new ClearLocations({ type: ImpClientLocationTypeCodes.Competitor })));

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

    this.activeClientLocations$.pipe(map(sites => sites.length)).subscribe(l => this.setCounts(l, 'Site'));
    this.activeCompetitorLocations$.pipe(map(sites => sites.length)).subscribe(l => this.setCounts(l, 'Competitor'));
    this.appStateService.analysisLevel$
      .pipe(
        withLatestFrom(this.appStateService.applicationIsReady$),
        filter(([level, isReady]) => level != null && level.length > 0 && isReady)
      ).subscribe(([analysisLevel]) => {
      this.setPrimaryHomeGeocode(analysisLevel);
      this.appTradeAreaService.onAnalysisLevelChange();
    });

    combineLatest(locationsWithHomeGeos$, this.appStateService.applicationIsReady$).pipe(
      filter(([locations, isReady]) => locations.length > 0 && isReady)
    ).subscribe(() => this.confirmationBox());

    combineLatest(locationsWithoutRadius$, this.appStateService.applicationIsReady$).pipe(
      filter(([locations, isReady]) => locations.length > 0 && isReady)
    ).subscribe(([locations]) => this.appTradeAreaService.onLocationsWithoutRadius(locations));
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

  clearAll() : void {
    this.cachedTradeAreas = [];
    this.impLocationService.clearAll();
    this.impLocAttributeService.clearAll();
  }

  public geocode(data: ValGeocodingRequest[], siteType: string) : Observable<ImpGeofootprintLocation[]> {
    const currentProject = this.appStateService.currentProject$.getValue();
    const currentAnalysisLevel = this.appStateService.analysisLevel$.getValue();
    return this.geocodingService.getGeocodingResponse(data, siteType).pipe(
      map(responses => responses.map(r => this.domainFactory.createLocation(currentProject, r, siteType, currentAnalysisLevel, data)))
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
    this.logger.debug.log('QuadTree partitions', quadTree);
    return result.filter(chunk => chunk && chunk.length > 0);
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
  public determineDtzHomegeos(attributes: any[], locations: ImpGeofootprintLocation[]) : Observable<any>{
    const attributesByHomeZip: Map<any, any> = mapBy(attributes, 'homeZip');
    console.log('attributesByHomeZip:::', attributesByHomeZip);
    let remainingAttributes = [];
    const zipGeocodeList = Array.from(attributesByHomeZip.keys());
   // const data = locations.filter(loc => loc.impGeofootprintLocAttribs.length > 0 && loc.impGeofootprintLocAttribs.filter(attr => attr.attributeCode === 'Home Digital ATZ' && attr.attributeValue !== ''));
    const locTempDict: Map<any, any> = mapByExtended(locations.filter(loc => loc.impGeofootprintLocAttribs.length > 0 && loc.impGeofootprintLocAttribs.filter
      (attr => attr.attributeCode === 'Home Digital ATZ' && attr.attributeValue !== '')), item => item.locationNumber);
    return this.determineHomeGeos(zipGeocodeList, null, 'VAL_DIGTAB14', 'geocode, ZIP, ZIP_ATZ').pipe(
      map(response => {
        return  response.payload;
      }),
      reduce((acc, result) => [...acc, ...result], []),
      map(zipResponse => {
        const zipResponseDict = [];
        if (zipResponse.length > 0){
          zipResponse.forEach(row => {
            zipResponseDict[row['geocode']] = row;
          });
        }
        attributes.forEach(attribute => {
          const homeDtz = locTempDict.get(attribute['siteNumber']) != null ? locTempDict.get(attribute['siteNumber']).impGeofootprintLocAttribs.filter(attr => attr.attributeCode === 'Home Digital ATZ')[0] : null;
          if (locTempDict.get(attribute['siteNumber']) != null && homeDtz && homeDtz.attributeValue !== ''){
            attribute['homeDigitalAtz'] = homeDtz && homeDtz.attributeValue !== '' ? homeDtz.attributeValue : '';
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
          return this.determineHomeGeos(atzGeocodeList, null, 'VAL_DIGTAB14', 'geocode, ZIP, ZIP_ATZ, DMA_Name').pipe(
            map(response => {
              return  response.payload;
            }),
            reduce((acc, result) => [...acc, ...result], []),
          );
        } else{
          return of(null);
        }
      }),
      map(atzResponse => {
        const atzResponseDict = [];
        remainingAttributes = [];
        if (atzResponse != null && atzResponse.length > 0){
          atzResponse.forEach(row => {
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
          return this.determineHomeGeos(pcrGeocodeList, null, 'VAL_DIGTAB14', 'geocode, ZIP, ZIP_ATZ').pipe(
            map(response => {
              return  response.payload;
            }),
            reduce((acc, result) => [...acc, ...result], []),
          );
        } else{
          return of(null);
        }
      }),
      map(pcrResponse => {
        const pctResponseDict = [];
        if (pcrResponse != null && pcrResponse.length > 0){
          pcrResponse.forEach(row => {
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
        return attributes;
      })
    );
  }

  public validateHomeGeoAttributesOnEdit(attributes: any[], editedTags ?: any[]) : Observable<any> { 
    if (editedTags.length > 0){
      const requestToCall: Array<Observable<any>> = [];
      let call: Observable<__esri.Graphic[]>;
      const tagToEnvironmentData = {  
        'zip': EnvironmentData.layerIds.zip.boundary,
        'atz': EnvironmentData.layerIds.atz.boundary,
        'pcr': EnvironmentData.layerIds.pcr.boundary,
        'dtz': EnvironmentData.layerIds.dtz.boundary
      };
      editedTags.forEach((tag) => {
          call = this.queryService.queryAttributeIn(tagToEnvironmentData[tag], 'geocode', [attributes[0][tagToFieldName[tag]]], false, ['geocode']);
          console.log('call:::::', call);
          requestToCall.push(call);
      });
      return forkJoin(requestToCall);
    }
  }

  public editLocationOnValidationSuccess(oldData: any, editedTags: string[], attributeList: any) : void {
    const editedLocation: ImpGeofootprintLocation = oldData; 
    const tagToField = {
      'zip': 'Home Zip Code',
      'atz': 'Home ATZ',
      'pcr': 'Home Carrier Route',
      'dtz': 'Home Digital ATZ'
    };
    editedTags.forEach(tag => {
      editedLocation.impGeofootprintLocAttribs.filter(la => la.attributeCode === tagToField[tag])[0].attributeValue = attributeList[0][tagToFieldName[tag]];
    });
    this.impLocationService.update(oldData, editedLocation);
  }

  private validateHomeGeoAttributes(attributes: any[], locations: ImpGeofootprintLocation[]) : Observable<any>{
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
    return this.determineHomeGeos(geocodeList, null, 'CL_PCRTAB14', 'geocode,ZIP , ZIP_ATZ, DMA, DMA_Name, COUNTY').pipe(
      map(response => {
        return  response.payload;
      }),
      reduce((acc, result) => [...acc, ...result], []),
      map(response => {
        const pcrTab14ResponseDict = {};
        if (response.length > 0){
          response.forEach(row => {
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
        return this.determineHomeGeos(geocodeList, null, 'CL_ZIPTAB14', 'geocode, ZIP, DMA, DMA_Name, COUNTY').pipe(
          map(response => {
            return  response.payload;
          }),
          reduce((acc, result) => [...acc, ...result], []),
        );
      }),
      map(zipResponse => {
        const zipTab14ResponseDict = {};
        if (zipResponse.length > 0){
          zipResponse.forEach(row => {
            zipTab14ResponseDict[row['geocode']] = row;
          });
        }
        attributes.forEach(attribute => {
          let homeZip = null;
          let homeDma = null;
          let homeCounty = null;
          if (attribute['homeZip'] in zipTab14ResponseDict ) {
            const attr = zipTab14ResponseDict[attribute['homeZip']];
            if (locDicttemp[attribute['siteNumber']] != null){
              homeZip = locDicttemp[attribute['siteNumber']].impGeofootprintLocAttribs.filter(attri => attri.attributeCode === 'Home Zip Code')[0];
              homeDma = locDicttemp[attribute['siteNumber']].impGeofootprintLocAttribs.filter(attri => attri.attributeCode === 'Home DMA')[0];
              homeCounty = locDicttemp[attribute['siteNumber']].impGeofootprintLocAttribs.filter(attri => attri.attributeCode === 'Home County')[0];
            }

            attribute['homeZip'] = homeZip && homeZip.attributeValue !== '' ? homeZip.attributeValue : attr['ZIP'];
            attribute['homeDma'] = homeDma && homeDma.attributeValue !== '' ? homeDma.attributeValue : attr['homeDma'];
            attribute['homeCounty'] = homeCounty && homeCounty.attributeValue !== '' ? homeCounty.attributeValue : attr['homeCounty'];
            attribute['homeDmaName'] = attr['DMA_Name'];
            
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
              attribute['homeDmaName'] = attr['DMA_Name'];
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
        return this.determineHomeGeos(geocodeList, null, 'CL_ATZTAB14', 'geocode,ZIP').pipe(
          map(response => {
            return  response.payload;
          }),
          reduce((acc, result) => [...acc, ...result], []),
        );
      }),
      map(atzResponse => {
        const atzTab14ResponseDict = {};
        if (atzResponse.length > 0){
            atzResponse.forEach(row => {
              atzTab14ResponseDict[row['geocode']] = row;
          });
        }
        attributes.forEach(attribute => {
          if (attribute['homeAtz'] in atzTab14ResponseDict ){
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
        return attributes;
      })
    );
  }

  public processHomeGeoAttributes(attributes: any[], locations: ImpGeofootprintLocation[]) : void {
    const attributesBySiteNumber: Map<any, any> = mapBy(attributes, 'siteNumber');
    const impAttributesToAdd: ImpGeofootprintLocAttrib[] = [];
    let homeGeocodeIssue = 'N';
    let warningNotificationFlag = 'N';  
    locations.forEach(loc => {
      const currentAttributes = attributesBySiteNumber.get(`${loc.locationNumber}`);

      if (currentAttributes != null){
        Object.keys(currentAttributes).filter(key => key.startsWith('home') && key != 'homeDmaName').forEach(key => {
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
            if (currentAttributes[key] != null && currentAttributes[key] !== '')   {
              const newAttribute = this.domainFactory.createLocationAttribute(loc, newHomeGeoToAnalysisLevelMap[key], firstHomeGeoValue);
              if (newAttribute != null)
                impAttributesToAdd.push(newAttribute);
            }
          }
        });
      }
      this.queryService.queryAttributeIn(EnvironmentData.layerIds.dma.boundary, 'dma_code', [currentAttributes['homeDma']], false, ['dma_name']).subscribe(
        graphics => {
          if (graphics != null && graphics != undefined && graphics.length != 0) {
            currentAttributes['homeDmaName'] = graphics[0].attributes.dma_name;
          }
        },
        err => console.error('There was an error querying the layer', err),
        () => {
          if (currentAttributes != null) { 
            Object.keys(currentAttributes).filter(key => key == 'homeDmaName').forEach(key => {
              if (newHomeGeoToAnalysisLevelMap[key] != null) {
                if (currentAttributes[key] != null && currentAttributes[key] !== '')   {
                  const firstHomeGeoValue = `${currentAttributes[key]}`.split(',')[0];
                  const newAttribute = this.domainFactory.createLocationAttribute(loc, newHomeGeoToAnalysisLevelMap[key], firstHomeGeoValue);
                  if (newAttribute != null)
                    impAttributesToAdd.push(newAttribute);
                }
              }
            });
          }
        });
      if (currentAttributes != null) { 
        Object.keys(currentAttributes).filter(key => key == 'homeDmaName').forEach(key => {
          if (newHomeGeoToAnalysisLevelMap[key] != null) {
            if (currentAttributes[key] != null && currentAttributes[key] !== '')   {
              const firstHomeGeoValue = `${currentAttributes[key]}`.split(',')[0];
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
    this.logger.info.log(`Setting primary home geo for ${analysisLevel}`);
    if (analysisLevel == null) {
      const currentLocations = this.impLocationService.get();
      currentLocations.forEach(l => l.homeGeocode = null);
    } else {
      let homeGeoKey = '';

      if (analysisLevel === 'ZIP'){
        homeGeoKey = getHomeGeoKey('Zip Code');
      } else if (analysisLevel === 'PCR'){
        homeGeoKey = getHomeGeoKey('Carrier Route');
      } else{
        homeGeoKey = getHomeGeoKey(analysisLevel);
      }
      const currentAttributes = this.impLocAttributeService.get().filter(a => a.attributeCode === homeGeoKey && a.impGeofootprintLocation != null);
      const siteMap = mapByExtended(currentAttributes, a => a.impGeofootprintLocation.locationNumber);
      const currentLocations = this.impLocationService.get();
      for (const loc of currentLocations) {
        if (siteMap.has(loc.locationNumber)) {
          loc.homeGeocode = siteMap.get(loc.locationNumber).attributeValue;
        } else {
          loc.homeGeocode = null;
        }
      }
    }
    //this.impLocationService.makeDirty();
  }

  private setCounts(count: number, siteType: string) {
    this.metricsService.add('LOCATIONS', `# of ${siteType}s`, count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
  }

  public flagHomeGeos(locations: ImpGeofootprintLocation[], currentAnalysisLevel: string) : void {
    if (currentAnalysisLevel === null){
      currentAnalysisLevel = this.appStateService.analysisLevel$.getValue();
    }
    this.logger.debug.log('Setting custom flag to indicate locations have had home geo processing performed.');
    let homeKey = '';
    if (currentAnalysisLevel === 'ZIP'){
       homeKey = getHomeGeoKey('Zip Code');
    } else if (currentAnalysisLevel === 'PCR'){
       homeKey = getHomeGeoKey('Carrier Route');
    } else{
     homeKey = getHomeGeoKey(currentAnalysisLevel);
    }
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

  public calculateHomeGeos(locations: ImpGeofootprintLocation[]){
    const chunked_arr = [];
    let index = 0;
    while (index < locations.length) {
      chunked_arr.push(locations.slice(index, 999 + index));
      index += 999;
    }
  }

  private determineHomeGeos(geocodeList: any[], analysisLevel: string, tableName: string, fieldNames: string) : Observable<any> {
    //const requestPayload = {'tableName': tableName, 'fieldNames': fieldNames, 'geocodeList': [] };
    const chunked_arr = [];
    let index = 0;
    while (index < geocodeList.length) {
      chunked_arr.push(geocodeList.slice(index, 999 + index));
      index += 999;
    }
    const obs = chunked_arr.map(geoList => {
      const reqPayload = {'tableName': tableName, 'fieldNames': fieldNames, 'geocodeList': [] };
      reqPayload['geocodeList'] = geoList;
      return this.getHomegeocodeData(reqPayload, 'v1/targeting/base/homegeo/homegeocode');
    });

    return merge(...obs, 4);
  }

  private getHomegeocodeData(requestPayload: any, url: string)  {
    return this.restService.post(url, requestPayload);
  }

  public validateLocactionsforpip(locations: ImpGeofootprintLocation[]) : Map<string, ImpGeofootprintLocation[]>{
    const initialAttributeList: any[] = [];
    const needtoPipLocations: ImpGeofootprintLocation[] = [];
    const dmaAncCountyLoc: ImpGeofootprintLocation[] = [];
    const locMap: Map<string, ImpGeofootprintLocation[]> = new Map<string, ImpGeofootprintLocation[]>();
    locations.forEach(loc => {
      const attrMap = {};
      loc.impGeofootprintLocAttribs.forEach(attr => {
        if (homeGeoColumnsSet.has(attr.attributeCode)){
          attrMap[attr.attributeCode] = attr.attributeValue;
        }
        //

      });

      if (loc['homeGeoFound'] == null &&
          (loc.ycoord != null && loc.xcoord != null && loc.ycoord !== 0 && loc.xcoord !== 0)){
          if ( attrMap['Home ATZ'] == null || attrMap['Home ATZ'] === '' ||  attrMap['Home Zip Code'] == null || attrMap['Home Zip Code'] === '' || attrMap['Home Carrier Route'] == null || attrMap['Home Carrier Route'] === ''){
              needtoPipLocations.push(loc);
            }
          else if (attrMap['Home DMA'] == null || attrMap['Home DMA'] === '' || attrMap['Home County'] == null || attrMap['Home County'] === ''){
              dmaAncCountyLoc.push(loc);
          }
          else{
            initialAttributeList.push({
              'homeZip'     :  attrMap['Home Zip Code'],
              'homeCounty'  :  attrMap['Home County'],
              'homeDma'     :  attrMap['Home DMA'],
              'homePcr'     :  attrMap['Home Carrier Route'],
              'homeAtz'     :  attrMap['Home ATZ'],
              'homeDtz'     :  attrMap['Home Digital ATZ'],
              'siteNumber'  :  loc.locationNumber,
              'abZip'       :  loc.locZip.substring(0, 5)
              });
          }
      }
    });
    locMap.set('needtoPipLocations', needtoPipLocations);
    locMap.set('dmaAndCountyLoc', dmaAncCountyLoc);
    locMap.set('initialAttributeList', initialAttributeList);
    return locMap;
  }

  public queryAllHomeGeos(locationsMap: Map<string, ImpGeofootprintLocation[]>) : Observable<any> {
      console.log(locationsMap);
      let pipObservble: Observable<any> = EMPTY;
      let dmaAndCountyObservble: Observable<any> = EMPTY;
      let initialAttributesObs: Observable<any> = EMPTY;
      if (locationsMap.get('needtoPipLocations').length > 0){
        let objId = 0;
          const partitionedLocations = this.partitionLocations(locationsMap.get('needtoPipLocations'));
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
          this.logger.info.log('Home Geo service call initiated.');

          const observables = payloads.map(payload => this.esriGeoprocessingService.processJob<__esri.FeatureSet>(this.config.serviceUrls.homeGeocode, payload));
          pipObservble  = merge(...observables, 4).pipe(
            map(result => result.value.features.map(feature => feature.attributes)),
            reduce((acc, result) => [...acc, ...result], []),
            switchMap(attrList => {
              return this.validateHomeGeoAttributes(attrList, locationsMap.get('needtoPipLocations'));
            })
          );
      }
      if (locationsMap.get('initialAttributeList').length > 0){
        initialAttributesObs = of(locationsMap.get('initialAttributeList'));
      }
      if (locationsMap.get('dmaAndCountyLoc').length > 0){
        const attributesList = [];
       // let resp: any = null;
       dmaAndCountyObservble = this.getDmaAndCounty(locationsMap.get('dmaAndCountyLoc')).pipe(
         switchMap(res => {
          return res;
         })
       );
      }
      return merge(dmaAndCountyObservble, pipObservble, initialAttributesObs).pipe(
        filter(value => value != null),
        reduce((acc, value) => [...acc, ...value], [])
      );
  }

  public  getDmaAndCounty(locations: ImpGeofootprintLocation[]) : Observable<any>{
    const zipLocDictemp = {};
    const attributesList: any[] = [];
    locations.forEach(loc => {
      zipLocDictemp[loc.locZip.substring(0, 5)] = loc;
    });

    return this.determineHomeGeos(Object.keys(zipLocDictemp), null, 'CL_ZIPTAB14', 'geocode, ZIP, DMA, DMA_Name, COUNTY').pipe(
        map(response => {
          return  response.payload;
        }),
        reduce((acc, result) => [...acc, ...result], []),
        map(result => {
          const dmaCounResponseMap = {};
          result.forEach(res => {
            dmaCounResponseMap[res['geocode']] = res;
          });
          locations.forEach(loc => {
            const zip = loc.locZip.substring(0, 5);
            const row = dmaCounResponseMap[zip];
            if (zip in dmaCounResponseMap){
              const attrMap = {};
              loc.impGeofootprintLocAttribs.forEach(attr => {
                if (homeGeoColumnsSet.has(attr.attributeCode) && attr.attributeValue != null){
                  attrMap[attr.attributeCode] = attr.attributeValue;
                }
              });
                const county = attrMap['Home County'] !== '' && attrMap['Home County'] != null ? attrMap['Home County'] : row['homeCounty'];
                const dma = attrMap['Home DMA'] !== '' && attrMap['Home DMA'] != null ? attrMap['Home DMA'] : row['homeDma'];
                attributesList.push({
                  'homeZip'     :  attrMap['Home Zip Code'],
                  'homePcr'     :  attrMap['Home Carrier Route'],
                  'homeAtz'     :  attrMap['Home ATZ'],
                  'homeCounty'  :  county,
                  'homeDma'     :  dma,
                  'homeDtz'     :  attrMap['Home Digital ATZ'],
                  'siteNumber'  :  loc.locationNumber,
                  'abZip'       :  loc.locZip.substring(0, 5)
                });
            }
          });
          return attributesList;
        })
    );
  }
}
