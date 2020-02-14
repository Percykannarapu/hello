import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { filterArray, groupByExtended, isNumber, mapBy, mapByExtended, simpleFlatten, toUniversalCoordinates, chunkArray, groupBy } from '@val/common';
import { EsriGeoprocessorService, EsriLayerService, EsriMapService, EsriQueryService, EsriUtils, EsriAppSettingsToken } from '@val/esri';
import { ErrorNotification, WarningNotification } from '@val/messaging';
import { ImpGeofootprintGeoService } from 'app/val-modules/targeting/services/ImpGeofootprintGeo.service';
import { Point, Geometry } from 'esri/geometry';
import Graphic from 'esri/Graphic';
import { SelectItem } from 'primeng/api';
import { ConfirmationService } from 'primeng/components/common/confirmationservice';
import { BehaviorSubject, combineLatest, EMPTY, forkJoin, merge, Observable, of } from 'rxjs';
import { filter, map, mergeMap, pairwise, reduce, startWith, switchMap, take, withLatestFrom, tap, concatMap } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { QuadTree } from '../models/quad-tree';
import { ValGeocodingRequest } from '../models/val-geocoding-request.model';
import { FullAppState } from '../state/app.interfaces';
import { ClearLocations, RenderLocations } from '../state/rendering/rendering.actions';
import { MetricService } from '../val-modules/common/services/metric.service';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintLocAttrib } from '../val-modules/targeting/models/ImpGeofootprintLocAttrib';
import { ImpGeofootprintMaster } from '../val-modules/targeting/models/ImpGeofootprintMaster';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpDomainFactoryService } from '../val-modules/targeting/services/imp-domain-factory.service';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocAttribService } from '../val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpClientLocationTypeCodes } from '../val-modules/targeting/targeting.enums';
import { AppGeocodingService } from './app-geocoding.service';
import { AppLoggingService } from './app-logging.service';
import { AppProjectPrefService } from './app-project-pref.service';
import { AppStateService } from './app-state.service';
import { AppTradeAreaService } from './app-trade-area.service';
import geometryEngine from 'esri/geometry/geometryEngine';

const getHomeGeoKey = (analysisLevel: string) => `Home ${analysisLevel}`;
const homeGeoColumnsSet = new Set(['Home ATZ', 'Home Zip Code', 'Home Carrier Route', 'Home County', 'Home DMA', 'Home DMA Name', 'Home Digital ATZ']);

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

  public siteLabelOptions$ = new BehaviorSubject<SelectItem[]>([]);
  public competitorLabelOptions$ = new BehaviorSubject<SelectItem[]>([]);

  constructor(private impLocationService: ImpGeofootprintLocationService,
              private impTradeAreaService: ImpGeofootprintTradeAreaService,
              private impGeoService: ImpGeofootprintGeoService,
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
              private appProjectPrefService: AppProjectPrefService,
              private store$: Store<FullAppState>) {

    this.allClientLocations$ = this.appStateService.allClientLocations$;
    this.allCompetitorLocations$ = this.appStateService.allCompetitorLocations$;
    this.activeClientLocations$ = this.appStateService.activeClientLocations$;
    this.activeCompetitorLocations$ = this.appStateService.activeCompetitorLocations$;

    this.appStateService.applicationIsReady$.pipe(
      filter(ready => ready),
      take(1)
    ).subscribe(() => this.initializeSubscriptions());
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

  private initializeSubscriptions() {
    const allLocations$ = this.impLocationService.storeObservable.pipe(
      filter(locations => locations != null)
    );

    const allActiveLocations$ = this.impLocationService.storeObservable.pipe(
      filter(locations => locations != null),
      filterArray(loc => loc.isActive)
    );

    const allLocationsWithType$ = allLocations$.pipe(
      filterArray(l => l.clientLocationTypeCode != null && l.clientLocationTypeCode.length > 0),
    );

    const activeLocationsWithType$ = allActiveLocations$.pipe(
      filterArray(l => l.clientLocationTypeCode != null && l.clientLocationTypeCode.length > 0),
    );

    const locationsWithHomeGeos$ = activeLocationsWithType$.pipe(
      filterArray(loc => loc.impGeofootprintLocAttribs.some(attr => homeGeoColumnsSet.has(attr.attributeCode) && attr.attributeValue != null && attr.attributeValue.length > 0)),
      filterArray(loc => isNumber(loc.radius1) || isNumber(loc.radius2) || isNumber(loc.radius3) )
    );

    const locationsWithoutRadius$ = activeLocationsWithType$.pipe(
      filterArray(loc => loc.impGeofootprintLocAttribs.some(attr => homeGeoColumnsSet.has(attr.attributeCode) && attr.attributeValue != null && attr.attributeValue.length > 0)),
      filterArray(loc => !(isNumber(loc.radius1) || isNumber(loc.radius2) || isNumber(loc.radius3)) )
    );

    this.totalCount$ = allActiveLocations$.pipe(
      map(locations => locations.length)
    );

    const successfulLocations$ = activeLocationsWithType$.pipe(
      filterArray(loc => loc.clientLocationTypeCode === ImpClientLocationTypeCodes.Site || loc.clientLocationTypeCode === ImpClientLocationTypeCodes.Competitor)
    );
    const siteCount$ = successfulLocations$.pipe(
      filterArray(loc => loc.clientLocationTypeCode === ImpClientLocationTypeCodes.Site),
      map(locs => locs.length)
    );
    const competitorCount$ = successfulLocations$.pipe(
      filterArray(loc => loc.clientLocationTypeCode === ImpClientLocationTypeCodes.Competitor),
      map(locs => locs.length)
    );

    successfulLocations$.subscribe(locations => this.store$.dispatch(new RenderLocations({ locations, impProjectPrefs: this.appProjectPrefService.getPrefsByGroup('label') })));
    siteCount$.pipe(
      pairwise(),
      filter(([prev, curr]) => prev > 0 && curr === 0)
    ).subscribe(() => this.store$.dispatch(new ClearLocations({ type: ImpClientLocationTypeCodes.Site })));
    competitorCount$.pipe(
      pairwise(),
      filter(([prev, curr]) => prev > 0 && curr === 0)
    ).subscribe(() => this.store$.dispatch(new ClearLocations({ type: ImpClientLocationTypeCodes.Competitor })));

    this.failedClientLocations$ = allLocationsWithType$.pipe(
      map(locations => locations.filter(l => l.clientLocationTypeCode === ImpClientLocationTypeCodes.FailedSite)),
      startWith([])
    );
    this.failedCompetitorLocations$ = allLocationsWithType$.pipe(
      map(locations => locations.filter(l => l.clientLocationTypeCode === ImpClientLocationTypeCodes.FailedCompetitor)),
      startWith([])
    );
    this.failureCount$ = combineLatest([this.failedClientLocations$, this.failedCompetitorLocations$]).pipe(
      map(([site, competitor]) => site.length + competitor.length),
      startWith(0),
    );
    this.hasFailures$ = this.failureCount$.pipe(map(count => count > 0));

    this.activeClientLocations$.pipe(map(sites => sites.length)).subscribe(l => this.setCounts(l, ImpClientLocationTypeCodes.Site));
    this.activeCompetitorLocations$.pipe(map(sites => sites.length)).subscribe(l => this.setCounts(l, ImpClientLocationTypeCodes.Competitor));
    this.appStateService.analysisLevel$
      .pipe(
        withLatestFrom(this.appStateService.applicationIsReady$),
        filter(([level, isReady]) => level != null && level.length > 0 && isReady)
      ).subscribe(([analysisLevel]) => {
      this.setPrimaryHomeGeocode(analysisLevel);
      this.appTradeAreaService.onAnalysisLevelChange();
    });

    combineLatest([locationsWithHomeGeos$, this.appStateService.applicationIsReady$]).pipe(
      filter(([locations, isReady]) => locations.length > 0 && isReady)
    ).subscribe(() => this.confirmationBox());

    combineLatest([locationsWithoutRadius$, this.appStateService.applicationIsReady$]).pipe(
      filter(([locations, isReady]) => locations.length > 0 && isReady)
    ).subscribe(([locations]) => this.appTradeAreaService.onLocationsWithoutRadius(locations));
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

   public setLocationsActive(sites: ImpGeofootprintLocation[], newIsActive: boolean) : void {
    //console.log('### setLocationsActive - Sites:', sites, ', newIsActive:', newIsActive);
    sites.forEach(site => {
      //console.log('### setLocationsActive - sites#:', site.locationNumber, ', isActive:', site.isActive);
      if (site != null) {
        site.isActive = newIsActive;
        site.impGeofootprintTradeAreas.forEach(ta => ta.isActive = newIsActive);
        site.getImpGeofootprintGeos().forEach(geo => geo.isActive = newIsActive);
      }

      // Update the project hierarchy
      const locations = this.appStateService.currentProject$.getValue().getImpGeofootprintLocations();
      locations.forEach(loc => {
        if (loc.locationNumber === site.locationNumber && loc.clientLocationTypeCode === site.clientLocationTypeCode) {
            loc.getImpGeofootprintGeos().forEach(geo => geo.isActive = loc.isActive);
            loc.impGeofootprintTradeAreas.forEach(ta => ta.isActive = loc.isActive);
        }
      });
    });
    this.impLocationService.makeDirty();
    this.impTradeAreaService.makeDirty();
    this.impGeoService.makeDirty();
  }

  public notifySiteChanges() : void {
    this.impLocationService.makeDirty();
  }

  clearAll() : void {
    this.cachedTradeAreas = [];
    this.impLocationService.clearAll();
    this.impLocAttributeService.clearAll();
  }

  public geocode(data: ValGeocodingRequest[], siteType: string, isLocationEdit: boolean) : Observable<ImpGeofootprintLocation[]> {
    const currentProject = this.appStateService.currentProject$.getValue();
    const currentAnalysisLevel = this.appStateService.analysisLevel$.getValue();
    return this.geocodingService.getGeocodingResponse(data, siteType).pipe(
      map(responses => responses.map(r => this.domainFactory.createLocation(currentProject, r, siteType, isLocationEdit, currentAnalysisLevel, data)))
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
    this.esriMapService.zoomToPoints(toUniversalCoordinates(locations)).subscribe();
  }

  private partitionLocations(locations: ImpGeofootprintLocation[]) : ImpGeofootprintLocation[][] {
    const quadTree = new QuadTree(locations);
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
    const locTempDict: Map<any, any> = mapByExtended(locations.filter(loc => loc.impGeofootprintLocAttribs.length > 0 && loc.impGeofootprintLocAttribs.filter
      (attr => attr.attributeCode === 'Home Digital ATZ' && attr.attributeValue !== '')), item => item.locationNumber);
    return this.determineHomeGeos(zipGeocodeList, 'VAL_DIGTAB14', 'geocode, ZIP, ZIP_ATZ').pipe(
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
          return this.determineHomeGeos(atzGeocodeList, 'VAL_DIGTAB14', 'geocode, ZIP, ZIP_ATZ, DMA_Name').pipe(
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
          return this.determineHomeGeos(pcrGeocodeList, 'VAL_DIGTAB14', 'geocode, ZIP, ZIP_ATZ').pipe(
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
        'zip': this.config.layers.zip.boundaries.id,
        'atz': this.config.layers.atz.boundaries.id,
        'pcr': this.config.layers.pcr.boundaries.id,
        'dtz': this.config.layers.digital_atz.boundaries.id
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
    const location = this.impLocationService.get().filter(l => l.locationNumber === oldData.locationNumber);
    this.processHomeGeoAttributes(attributeList, location);
  }

  private validateHomeGeoAttributes(attributes: any[], locations: ImpGeofootprintLocation[]) : Observable<any>{
    let geocodeList = [];
    const locDicttemp = {};
    locations.forEach(loc => {
      locDicttemp[loc.locationNumber] = loc;
    });
    attributes.forEach(attr => {
        if (attr['homePcr'] != null && attr['homePcr'] !== '' && attr['homePcr'].split(',').length > 1){
          attr['homePcr'].split(',').forEach(pcr => geocodeList.push(pcr));
        }
        else{
          geocodeList.push(attr['homePcr']);
        }
    });
    return this.determineHomeGeos(geocodeList, 'CL_PCRTAB14', 'geocode,ZIP , ZIP_ATZ, DMA, DMA_Name, COUNTY').pipe(
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
        });
        return attributes;
      }),
      mergeMap(() => {
        geocodeList = [];
        attributes.forEach(attr => {
          if (attr['homeZip'] != null && attr['homeZip'] !== '' && attr['homeZip'].split(',').length > 1){
            attr['homeZip'].split(',').forEach(zip => geocodeList.push(zip));
          }
          else{
            geocodeList.push(attr['homeZip']);
          }
        });
        return this.determineHomeGeos(geocodeList, 'CL_ZIPTAB14', 'geocode, ZIP, DMA, DMA_Name, COUNTY').pipe(
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
          }

        });
        return attributes;
      }),
      mergeMap(() => {
        geocodeList = [];
        attributes.forEach(attr => {
          if (attr['homeAtz'] != null && attr['homeAtz'] !== '' && attr['homeAtz'].split(',').length > 1){
            attr['homeAtz'].split(',').forEach(atz => geocodeList.push(atz));
          }else{
            geocodeList.push(attr['homeAtz']);
          }
        });
        return this.determineHomeGeos(geocodeList, 'CL_ATZTAB14', 'geocode,ZIP').pipe(
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
      if (newAttribute1 != null) impAttributesToAdd.push(newAttribute1);
      homeGeocodeIssue = 'N';
    });

    const homeDMAs = new Set(attributes.filter(a => a['homeDmaName'] == null || a['homeDmaName'] === '').map(a => a['homeDma']).filter(a => a != null && a !== ''));
    const dmaLookup = {};
    if (homeDMAs.size > 0) {
      this.queryService.queryAttributeIn(this.config.layers.dma.boundaries.id, 'dma_code', Array.from(homeDMAs), false, ['dma_code', 'dma_name']).pipe(
        filter(g => g != null)
      ).subscribe(
        graphics => {
          graphics.forEach(g => {
            dmaLookup[g.attributes.dma_code] = g.attributes.dma_name;
          });
        },
        err => console.error('There was an error querying the layer', err),
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
        });
    }
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

  private determineHomeGeos(geocodeList: any[], tableName: string, fieldNames: string, whereField: string = 'geocode' ) : Observable<any> {
    const chunked_arr = [];
    let index = 0;
    while (index < geocodeList.length) {
      chunked_arr.push(geocodeList.slice(index, 999 + index));
      index += 999;
    }
    const obs = chunked_arr.map(geoList => {
      const reqPayload = {'tableName': tableName, 'fieldNames': fieldNames, 'geocodeList': [], 'whereField': whereField };
      reqPayload['geocodeList'] = geoList;
      return this.getHomegeocodeData(reqPayload, 'v1/targeting/base/homegeo/homegeocode');
    });

    return merge(...obs, 4);
  }

  public getHomegeocodeData(requestPayload: any, url: string)  {
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
      let combinedObservble: Observable<any> = EMPTY;
      let dmaAndCountyObservble: Observable<any> = EMPTY;
      let initialAttributesObs: Observable<any> = EMPTY;
      let fuseObservble: Observable<any> = EMPTY;
      const layerId = this.config.getLayerIdForAnalysisLevel('pcr', true);
      
      if (locationsMap.get('needtoPipLocations').length > 0){
        const locationsHomeGeoFuse: ImpGeofootprintLocation[] = [];
        const locationsForPIP: ImpGeofootprintLocation[] = [];
        const queries: Observable<any>[] = [];
        locationsMap.get('needtoPipLocations').forEach(loc => {
              if (loc.carrierRoute != null && loc.carrierRoute !== ''){
                loc.homePcr = loc.locZip.substr(0, 5) + loc.carrierRoute;
                locationsHomeGeoFuse.push(loc);
              }else{
                locationsForPIP.push(loc);
              }
        });
        if (locationsForPIP.length > 0){
            const attributesList: any[] = [];
          // const testObs = this.pipLocations(locationsForPIP);
           pipObservble = this.pipLocations(locationsForPIP).pipe(switchMap(res => this.queryRemainingAttr(res, locationsForPIP, false).pipe(
             map(result => {
                      if (result.attributes.length > 0)
                        attributesList.push(... result.attributes);
                      if (result.rePipLocations.length > 0){
                          const row = {'ATZ': null, 'DTZ' : null, 'ZIP': null, 'DMA': null, 'COUNTY': null};
                          result.rePipLocations.forEach(loc => {
                            attributesList.push(this.createArreibut(row, loc));
                        });
                      }  
                return attributesList;
             })
           ))
           );
        }
        if (locationsHomeGeoFuse.length > 0){
          const attrList: Map<string, any> = new Map<string, any>();
          const attributesList: any[] = [];
          const rePipLocations: ImpGeofootprintLocation[] = [];
          locationsHomeGeoFuse.forEach(loc => attrList.set(loc.locZip.substr(0, 5) + loc.carrierRoute, null));
          fuseObservble = this.queryRemainingAttrFuse(attrList, locationsHomeGeoFuse, true).pipe(
            map(result => {
              if (result.attributes.length > 0)
                   attributesList.push(... result.attributes);
              return result;    
            }),
            mergeMap(result => {
              if ( result.rePipLocations.length > 0){
                return this.pipLocations(result.rePipLocations).pipe(
                  switchMap(res => this.queryRemainingAttr(res, result.rePipLocations, false)),
                  map(res1 => {
                    if (res1.attributes.length > 0)
                         attributesList.push(... res1.attributes);
                    if (res1.rePipLocations.length > 0){
                      const row = {'ATZ': null, 'DTZ' : null, 'ZIP': null, 'DMA': null, 'COUNTY': null};
                      res1.rePipLocations.forEach(loc => {
                          attributesList.push(this.createArreibut(row, loc));
                      });
                      //attributesList.push(res1.rePipLocations.forEach(loc => this.createArreibut(row, loc)));
                    }     
                    return attributesList;     
                    })
                );
              }
              else{
                return of(attributesList);
              }
            })
          );
        }
        combinedObservble = merge(fuseObservble, pipObservble);
      }
      if (locationsMap.get('initialAttributeList').length > 0){
        initialAttributesObs = of(locationsMap.get('initialAttributeList'));
      }
      if (locationsMap.get('dmaAndCountyLoc').length > 0){
       dmaAndCountyObservble = this.getDmaAndCounty(locationsMap.get('dmaAndCountyLoc')).pipe(
         switchMap(res => {
          return res;
         })
       );
      }
      return merge(dmaAndCountyObservble, combinedObservble, initialAttributesObs).pipe(
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

    return this.determineHomeGeos(Object.keys(zipLocDictemp), 'IMP_GEO_HIERARCHY_MV', 'ZIP, DMA,COUNTY', 'ZIP').pipe(
        map(response => {
          return  response.payload;
        }),
        reduce((acc, result) => [...acc, ...result], []),
        map(result => {
          const dmaCounResponseMap = {};
          result.forEach(res => {
            dmaCounResponseMap[res['ZIP']] = res;
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
  
  queryRemainingAttrFuse(attrList: Map<string, any>, impGeofootprintLocations: ImpGeofootprintLocation[], isFuseLocations: boolean){
    const homePcrList = Array.from(attrList.keys()); 
    return  this.determineHomeGeos(homePcrList, 'IMP_GEO_HIERARCHY_MV', 'PCR, ZIP, ATZ, DTZ, COUNTY, DMA', 'PCR').pipe(
      map(response => {
        return  response.payload;
      }),
      reduce((acc, result) => [...acc, ...result], []),
      map(result => {
        const locationsGroupBy = groupByExtended(impGeofootprintLocations, loc => !isFuseLocations ?  loc.locZip.substr(0, 5) : loc.locZip.substr(0, 5) + loc.carrierRoute);
        const responseMap: Map<string, any[]> = groupByExtended(result, row => !isFuseLocations ? row['PCR'].substr(0, 5) : row['PCR']); 
          return this.getAttributesforLayers(locationsGroupBy, 'PCR', result, responseMap, attrList, isFuseLocations);
      })
    );
  }
  
  /**
   * 
   * @param attrList 
   * @param impGeofootprintLocation 
   * query IMP_GEO_HIERARCHY_MV for remaining arrtibutes
   */
  queryRemainingAttr(attrList: Map<string, any>, impGeofootprintLocations: ImpGeofootprintLocation[], isFuseLocations: boolean){
    const homePcrList = Array.from(attrList.keys()); 
    //console.log('homePcrList====>', homePcrList);
    const attributesList: any[] = [];
    let rePipLocations: ImpGeofootprintLocation[] = [];
    
    return  this.determineHomeGeos(homePcrList, 'IMP_GEO_HIERARCHY_MV', 'PCR, ZIP, ATZ, DTZ, COUNTY, DMA', 'PCR').pipe(
      map(response => {
        return  response.payload;
      }),
      reduce((acc, result) => [...acc, ...result], []),
      map(result => {
        const locationsGroupBy = groupByExtended(impGeofootprintLocations, loc => !isFuseLocations ?  loc.locZip.substr(0, 5) : loc.locZip.substr(0, 5) + loc.carrierRoute);
        const responseMap: Map<string, any[]> = groupByExtended(result, row => !isFuseLocations ? row['PCR'].substr(0, 5) : row['PCR']); 
          const t =  this.getAttributesforLayers(locationsGroupBy, 'PCR', result, responseMap, attrList, isFuseLocations);
          if (t.attributes.length > 0) attributesList.push(...t.attributes);
          if (t.rePipLocations.length > 0) rePipLocations.push(...t.rePipLocations);    
          return t;
      }),
      mergeMap(t => {
          console.log('attribute List ATZ====>', t);
        if (t.rePipLocations.length > 0){
          return this.pipLocations(t.rePipLocations, 'atz').pipe(
            switchMap(atzGeos => {
              const homeAtzGeos = Array.from(atzGeos.keys());
              return this.determineHomeGeos(homeAtzGeos, 'IMP_GEO_HIERARCHY_MV', 'ZIP, ATZ, DTZ, COUNTY, DMA ', 'ATZ').pipe(
                map(response => {
                  return  response.payload;
                }),
                reduce((acc, result) => [...acc, ...result], []),
                map(result => {
                  const atzSet = new Set();
                  const atzResultMap = [];
                  result.forEach(record => {
                    if (!atzSet.has(record['ATZ'])){
                          atzSet.add(record['ATZ']);
                          const DTZ = record['DTZ'] === record['ATZ'] ? record['ATZ'] : null ;
                          atzResultMap.push({'ATZ': record['ATZ'], 'DTZ' : DTZ, 'ZIP': record['ZIP'], 'homeDma': record['homeDma'], 'homeCounty': record['homeCounty']});
                    }
                  });
                  const locationsGroupBy = groupByExtended(rePipLocations, loc =>   loc.locZip.substr(0, 5) );
                  const responseMap: Map<string, any[]> = groupByExtended(Array.from(atzResultMap), row =>  row['ATZ'].substr(0, 5)); 
                  return this.getAttributesforLayers(locationsGroupBy, 'ATZ', atzResultMap, responseMap, attrList, isFuseLocations);
                })
              );
            })
          );
        }
        else{
          //const result = {'attributes': attributesList, 'rePipLocations': rePipLocations};
         return of(t)  ;
        } 

           
      }),
      map(response => {
        //console.log('attribute List  ZIP', response);
        if (response.attributes.length > 0) attributesList.push(...response.attributes);
        //response.rePipLocations.push(...rePipLocations);
        if (response.attributes.length > 0){
              const responseAttributesBySiteNumber = mapBy(response.attributes, 'siteNumber');
              const temploc = rePipLocations.filter(loc => responseAttributesBySiteNumber.get(loc.locationNumber) == null );
              rePipLocations = temploc;
              response.rePipLocations = temploc;
        }
        return response;
      }),
      mergeMap(t => {
        console.log('attribute List ZIP====>', t);
        if (t.rePipLocations.length > 0){
          return this.pipLocations(t.rePipLocations, 'zip').pipe(
            switchMap(zipGeos => {
              const homeZipGeos = Array.from(zipGeos.keys());
              return this.determineHomeGeos(homeZipGeos, 'IMP_GEO_HIERARCHY_MV', 'ZIP, ATZ, DTZ, DMA, COUNTY', 'ZIP').pipe(
                map(response => {
                  return  response.payload;
                }),
                reduce((acc, result) => [...acc, ...result], []),
                map(result => {
                  const zipSet = new Set();
                  const zipResultMap = [];
                  result.forEach(record => {
                    if (!zipSet.has(record['ZIP'])){
                          zipSet.add(record['ZIP']);
                          const DTZ = record['DTZ'] === record['ZIP'] ? record['DTZ'] : null ;
                          zipResultMap.push({'ATZ': record['ATZ'], 'DTZ' : DTZ, 'ZIP': record['ZIP'], 'DMA': record['homeDma'], 'COUNTY': record['homeCounty']});
                    }
                  });
                  const locationsGroupBy = groupByExtended(impGeofootprintLocations, loc =>   loc.locZip.substr(0, 5) );
                  const responseMap: Map<string, any[]> = groupByExtended(Array.from(zipResultMap), row =>  row['ZIP'].substr(0, 5)); 
                  return this.getAttributesforLayers(locationsGroupBy, 'ZIP', zipResultMap, responseMap, attrList, isFuseLocations);
                })
              );
            })
          );
        }
        else return of(t);
      }),
      map(response => {
        if (response.attributes.length > 0){
          attributesList.push(...response.attributes);
          const responseAttributesBySiteNumber = mapBy(response.attributes, 'siteNumber');
          const temploc = rePipLocations.filter(loc => responseAttributesBySiteNumber.get(loc.locationNumber) == null );
          rePipLocations = temploc;
        }
          const t = {'attributes': attributesList, 'rePipLocations': rePipLocations};
        return t;
      })
     );
  }

  getAttributesforLayers(locationsGroupBy: Map<string, ImpGeofootprintLocation[]>, analysisLevel: string, result: any[], 
                            responseMap: Map<string, any[]>, attrList: Map<string, any>, isFuseLocations: boolean){
    const attributesList: any[] = [];
    const pipAgianLocations: ImpGeofootprintLocation[] = [];
    locationsGroupBy.forEach((value: ImpGeofootprintLocation[], key: string) => {
        //console.log('key===>', key, 'value===>', value);
        if (value.length == 1){
          const row = responseMap.get(key);
          if (row != null && row.length > 0){
            attributesList.push(this.createArreibut(row[0], value[0]));
            attrList.delete(row[0] [analysisLevel]);
          }
          else
            pipAgianLocations.push(value[0]);
        }
        else if (value.length > 1 && !isFuseLocations){
          //console.log('Test====>', value, 'isfuse===>', isFuseLocations);
          value.forEach(loc => {
             attrList.forEach((geometry: any, pcr: string) => {
               const insideGeometry = {x: loc.xcoord, y: loc.ycoord} as Geometry;
               const bool = geometryEngine.contains(geometry, insideGeometry);
               if  (bool){
                   const row = result.filter(record => record[analysisLevel] === pcr);
                   attributesList.push(this.createArreibut(row[0], loc));
               }
             });
          });
        }
        else if (value.length > 1 && isFuseLocations){
          //console.log('Test====>', value, 'isfuse===>', isFuseLocations);
          value.forEach(loc => {
            const row = responseMap.get(key);
            if (row != null && row.length > 0){
              attributesList.push(this.createArreibut(row[0], value[0]));
              attrList.delete(row[0] [analysisLevel]);
            }
            else
              pipAgianLocations.push(value[0]);
          });
        }
    });
     //console.log('attributesList return ===>', attributesList);
     const t = {'attributes': attributesList, 'rePipLocations': pipAgianLocations};
     return t;
  }

  pipLocations(locations: ImpGeofootprintLocation[], analysisLevel: string = 'pcr'){
    const queries: Observable<any>[] = [];
    const layerId = this.config.getLayerIdForAnalysisLevel(analysisLevel, true);
    const chunkArrays = this.partitionLocations(locations);
          for (const locArry of chunkArrays){
            if (locArry.length > 0){
              const points = toUniversalCoordinates(locArry);
              queries.push(this.queryService.queryPoint(layerId, points, true, ['geocode'] ));
            }
          }
        const responseMapby: Map<string, any> = new Map<string, any>();
         return merge(...queries, 4).pipe(
            reduce((acc, result) => [...acc, ...result], []),
            map(result => {
                result.forEach(res => responseMapby.set(res.attributes['geocode'], res.geometry));
                return responseMapby;
            })
          );

  }

  createArreibut(row: {}, loc: ImpGeofootprintLocation){
    return {
      'homeZip'       :  row ['ZIP'],
      'homePcr'       :  row ['PCR'],
      'homeAtz'       :  row ['ATZ'],
      'homeCounty'    :  row ['homeCounty'],
      'homeDma'       :  row ['homeDma'],
      'homeDigitalAtz':  row ['DTZ'],
      'homeDmaName'   :  null, 
      'siteNumber'    :  loc.locationNumber,
      'abZip'         :  loc.locZip.substring(0, 5)
    };

  }

}
