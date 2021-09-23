import { Injectable } from '@angular/core';
import { contains } from '@arcgis/core/geometry/geometryEngine';
import { Store } from '@ngrx/store';
import {
  CommonSort,
  filterArray,
  getUuid,
  groupByExtended,
  isConvertibleToNumber,
  isEmpty,
  isNotNil,
  mapBy,
  mapByExtended,
  reduceConcat,
  simpleFlatten,
  toNullOrNumber,
  toUniversalCoordinates
} from '@val/common';
import { EsriLayerService, EsriMapService, EsriQueryService } from '@val/esri';
import { ErrorNotification, MessageBoxService, WarningNotification } from '@val/messaging';
import { ImpGeofootprintGeoService } from 'app/val-modules/targeting/services/ImpGeofootprintGeo.service';
import { PrimeIcons, SelectItem } from 'primeng/api';
import { BehaviorSubject, combineLatest, EMPTY, merge, Observable, of } from 'rxjs';
import { distinctUntilChanged, filter, finalize, map, mergeMap, startWith, switchMap, take, tap, withLatestFrom } from 'rxjs/operators';
import { EnvironmentData } from '../../environments/environment';
import { ImpClientLocationTypeCodes } from '../../worker-shared/data-model/impower.data-model.enums';
import { AppConfig } from '../app.config';
import { quadPartitionLocations } from '../common/quad-tree';
import { ValGeocodingRequest } from '../models/val-geocoding-request.model';
import { FullAppState } from '../state/app.interfaces';
import { projectIsReady } from '../state/data-shim/data-shim.selectors';
import { RenderLocations } from '../state/rendering/rendering.actions';
import { LoggingService } from '../val-modules/common/services/logging.service';
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
import { AppGeocodingService } from './app-geocoding.service';
import { AppStateService } from './app-state.service';
import { AppTradeAreaService } from './app-trade-area.service';

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
  'dtz': 'homeDigitalAtz'
};

export interface HomeGeoQueryResult {
  homePcr: string;
  homeDigitalAtz: string;
  homeAtz: string;
  homeZip: string;
  homeCounty: string;
  homeDma: string;
  homeDmaName: string;
  siteNumber: string;
  abZip: string;
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
              private logger: LoggingService,
              private domainFactory: ImpDomainFactoryService,
              private restService: RestDataService,
              private messageService: MessageBoxService,
              private store$: Store<FullAppState>) {

    this.allClientLocations$ = this.appStateService.allClientLocations$;
    this.allCompetitorLocations$ = this.appStateService.allCompetitorLocations$;
    this.activeClientLocations$ = this.appStateService.activeClientLocations$;
    this.activeCompetitorLocations$ = this.appStateService.activeCompetitorLocations$;

    this.appStateService.applicationIsReady$.pipe(
      filter(ready => ready),
      take(1)
    ).subscribe(() => {
      this.initializeRenderingSub();
      this.initializeSubscriptions();
    });
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
    const projectReady$ = this.store$.select(projectIsReady).pipe(distinctUntilChanged());

    const allLocations$ = this.impLocationService.storeObservable.pipe(
      filter(locations => locations != null)
    );

    const allActiveLocations$ = allLocations$.pipe(
      filterArray(loc => loc.isActive)
    );

    const allLocationsWithType$ = allLocations$.pipe(
      filterArray(l => !isEmpty(l.clientLocationTypeCode)),
    );

    const activeLocationsWithType$ = allActiveLocations$.pipe(
      filterArray(l => !isEmpty(l.clientLocationTypeCode)),
    );

    const locationsWithRadius$ = activeLocationsWithType$.pipe(
      filterArray(loc => isConvertibleToNumber(loc.radius1) || isConvertibleToNumber(loc.radius2) || isConvertibleToNumber(loc.radius3) )
    );

    const locationsWithoutRadius$ = activeLocationsWithType$.pipe(
      filterArray(loc => !(isConvertibleToNumber(loc.radius1) || isConvertibleToNumber(loc.radius2) || isConvertibleToNumber(loc.radius3)) )
    );

    this.totalCount$ = allActiveLocations$.pipe(
      map(locations => locations.length)
    );

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
      distinctUntilChanged(),
      startWith(0),
    );
    this.hasFailures$ = this.failureCount$.pipe(map(count => count > 0));

    this.activeClientLocations$.pipe(map(sites => sites.length)).subscribe(l => this.setCounts(l, ImpClientLocationTypeCodes.Site));
    this.activeCompetitorLocations$.pipe(map(sites => sites.length)).subscribe(l => this.setCounts(l, ImpClientLocationTypeCodes.Competitor));
    this.appStateService.analysisLevel$.pipe(
        withLatestFrom(projectReady$),
        filter(([level, isReady]) => !isEmpty(level) && isReady)
      ).subscribe(([analysisLevel]) => {
      this.setPrimaryHomeGeocode(analysisLevel);
      this.appTradeAreaService.onAnalysisLevelChange();
    });

    combineLatest([locationsWithRadius$, projectReady$]).pipe(
      filter(([locations, isReady]) => locations.length > 0 && isReady)
    ).subscribe(() => this.confirmationBox());

    combineLatest([locationsWithoutRadius$, projectReady$]).pipe(
      filter(([locations, isReady]) => locations.length > 0 && isReady)
    ).subscribe(([locations]) => this.appTradeAreaService.onLocationsWithoutRadius(locations));
  }

  private initializeRenderingSub() {
    const allActiveLocations$ = this.impLocationService.storeObservable.pipe(
      filter(locations => locations != null),
      filterArray(loc => loc.isActive)
    );
    const activeLocationsWithType$ = allActiveLocations$.pipe(
      filterArray(l => l.clientLocationTypeCode != null && l.clientLocationTypeCode.length > 0),
    );
    const successfulLocations$ = activeLocationsWithType$.pipe(
      filterArray(loc => loc.clientLocationTypeCode === ImpClientLocationTypeCodes.Site || loc.clientLocationTypeCode === ImpClientLocationTypeCodes.Competitor)
    );

    combineLatest([successfulLocations$, this.store$.select(projectIsReady)]).pipe(
      filter(([locations, ready]) => locations != null && ready)
    ).subscribe(([locations]) => this.store$.dispatch(new RenderLocations({ locations })));
  }

   public deleteLocations(sites: ImpGeofootprintLocation[]) : void {
      this.logger.debug.log('Deleting Sites');
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
         this.logger.debug.log('deleteLocations - EXCEPTION', error);
      }
   }

   public setLocationsActive(sites: ImpGeofootprintLocation[], newIsActive: boolean) : void {
    //this.logger.debug.log('### setLocationsActive - Sites:', sites, ', newIsActive:', newIsActive);
    sites.forEach(site => {
      //this.logger.debug.log('### setLocationsActive - sites#:', site.locationNumber, ', isActive:', site.isActive);
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
    this.impLocationService.currStoreId = 0;
    this.cachedTradeAreas = [];
    this.impLocationService.clearAll();
    this.impLocAttributeService.clearAll();
  }

  public geocode(data: ValGeocodingRequest[], siteType: string, isLocationEdit: boolean) : Observable<ImpGeofootprintLocation[]> {
    const currentProject = this.appStateService.currentProject$.getValue();
    const currentAnalysisLevel = this.appStateService.analysisLevel$.getValue();
    return this.geocodingService.getGeocodingResponse(data, siteType).pipe(
      map(responses => responses.map(r => this.domainFactory.createLocation(currentProject, r, siteType, isLocationEdit, currentAnalysisLevel, data))),
    );
  }

  public persistLocationsAndAttributes(data: ImpGeofootprintLocation[], isEdit?: boolean, isResubmit?: boolean, oldData?: ImpGeofootprintLocation) : void {
    const newTradeAreas: ImpGeofootprintTradeArea[] = [];
    data.forEach(l => {
      const radiiDeduper = new Set<number>();
      const tradeAreas: { radius: number, selected: boolean, taNumber: number }[] = [];
      if (isEmpty(l.locationNumber)) {
        l.locationNumber = this.impLocationService.getNextLocationNumber().toString();
      }
      if (isEmpty(l.locationName)) {
        l.locationName = l.locationNumber;
      }
      l.radius1 = toNullOrNumber(l.radius1);
      l.radius2 = toNullOrNumber(l.radius2);
      l.radius3 = toNullOrNumber(l.radius3);
      if (l.radius1 > 0) radiiDeduper.add(l.radius1);
      if (l.radius2 > 0) radiiDeduper.add(l.radius2);
      if (l.radius3 > 0) radiiDeduper.add(l.radius3);
      if (radiiDeduper.size > 0) {
        const radii = Array.from(radiiDeduper);
        radii.sort(CommonSort.GenericNumber);
        for (let i = 0; i < 3; ++i) {
          const taNumber = i + 1;
          const currentRadius = radii[i];
          if (isNotNil(currentRadius)) {
            tradeAreas.push({ radius: currentRadius, selected: true, taNumber });
          }
          l[`radius${taNumber}`] = currentRadius ?? null; // converts an undefined into a null
        }
        if (tradeAreas.length > 0) {
          newTradeAreas.push(...this.appTradeAreaService.createRadiusTradeAreasForLocations(tradeAreas, [l], false));
        }
      }
    });

    if (this.appStateService.analysisLevel$.getValue() == null && newTradeAreas.length !== 0 ) {
      this.store$.dispatch(ErrorNotification({ notificationTitle: 'Location Upload Error', message: 'Please select an Analysis Level prior to uploading locations with defined radii values.'}));
      this.geocodingService.clearDuplicates();
    } else {
      this.cachedTradeAreas = newTradeAreas;
      if (isEdit) {
        if (!isResubmit) {
          this.impLocationService.update(oldData, data[0]);
        } else {
          this.impLocationService.add(data);
          this.impLocAttributeService.add(data.flatMap(l => l.impGeofootprintLocAttribs));
        }
      } else {
        this.impLocationService.add(data);
        this.impLocAttributeService.add(data.flatMap(l => l.impGeofootprintLocAttribs));
      }
    }
  }

  public zoomToLocations(locations: ImpGeofootprintLocation[]) {
    this.esriMapService.zoomToPoints(toUniversalCoordinates(locations)).subscribe();
  }

  private confirmationBox() : void {
    if (!isEmpty(this.cachedTradeAreas)) {
      const currentCache = this.cachedTradeAreas;
      this.cachedTradeAreas = [];
      const distinctSiteIds = new Set(currentCache.map(ta => ta.impGeofootprintLocation?.locationNumber));
      let message = 'Your site list includes radii values.  Do you want to define your trade area with those values?';
      if (distinctSiteIds.size === 1) {
        // editing a single site - change message
        message = 'Do you want to reapply the radius uploaded with this site?';
      }
      this.messageService.showTwoButtonModal(message, 'Define Trade Areas', PrimeIcons.PLUS_CIRCLE, 'Use Uploaded Values', 'Ignore Uploaded Values')
        .subscribe(result => {
          if (result) {
            currentCache.forEach(ta => ta.impGeofootprintLocation.impGeofootprintTradeAreas.push(ta));
            this.appTradeAreaService.insertTradeAreas(currentCache);
            this.appTradeAreaService.zoomToTradeArea();
            this.appTradeAreaService.tradeareaType = 'distance';
          } else {
            const currentLocations = currentCache.map(ta => ta.impGeofootprintLocation);
            this.appTradeAreaService.tradeareaType = '';
            currentLocations.forEach(loc => {
              loc.radius1 = null;
              loc.radius2 = null;
              loc.radius3 = null;
            });
            this.impLocationService.makeDirty();
          }
        });
    }
  }

  public validateHomeGeoAttributesOnEdit(attributes: any[], editedTags ?: any[]) : Observable<__esri.Graphic[]> {
    if (editedTags.length > 0){
      const requestToCall: Array<Observable<__esri.Graphic[]>> = [];
      let call: Observable<__esri.Graphic[]>;
      const tagToEnvironmentData = {
        'zip': EnvironmentData.layerIds.zip.boundary,
        'atz': EnvironmentData.layerIds.atz.boundary,
        'pcr': EnvironmentData.layerIds.pcr.boundary,
        'dtz': EnvironmentData.layerIds.dtz.boundary
      };
      editedTags.forEach((tag) => {
          call = this.queryService.queryAttributeIn(tagToEnvironmentData[tag], 'geocode', [attributes[0][tagToFieldName[tag]]], false, ['geocode']);
          requestToCall.push(call);
      });
      return merge(...requestToCall).pipe(
        reduceConcat()
      );
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

  public processHomeGeoAttributes(attributes: HomeGeoQueryResult[], locations: ImpGeofootprintLocation[]) : void {
    const attributesBySiteNumber: Map<string, HomeGeoQueryResult> = mapBy(attributes, 'siteNumber');
    const impAttributesToAdd: ImpGeofootprintLocAttrib[] = [];
    let homeGeocodeIssue = 'N';
    let warningNotificationFlag = 'N';
    locations.forEach(loc => {
      const currentAttributes = attributesBySiteNumber.get(`${loc.locationNumber}`);
      if (currentAttributes != null){
        Object.keys(currentAttributes).filter(key => key.startsWith('home') && key !== 'homeDmaName' && key !== 'homeDigitalAtz').forEach(key => {
          if (newHomeGeoToAnalysisLevelMap[key] != null) {
            // the service might return multiple values for a home geo (in case of overlapping geos)
            // as csv. For now, we're only taking the first result.
            const firstHomeGeoValue = currentAttributes[key]?.split(',')[0] ?? '';
            // validate homegeo rules

            if (loc.origPostalCode != null && loc.origPostalCode.length > 0 && ( loc.locZip != null && loc.locZip.substr(0, 5) !== loc.origPostalCode.substr(0, 5))) {
              homeGeocodeIssue = 'Y';
              warningNotificationFlag = 'Y';
            }
            if (newHomeGeoToAnalysisLevelMap[key] !== 'Home DMA' && newHomeGeoToAnalysisLevelMap[key] !== 'Home County'
              && (firstHomeGeoValue.length === 0 || (firstHomeGeoValue.length > 0 && loc.locZip != null && loc.locZip.length > 0 && firstHomeGeoValue.substr(0, 5) !== loc.locZip.substr(0, 5)))){
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
      this.queryService.queryAttributeIn(EnvironmentData.layerIds.dma.boundary, 'dma_code', Array.from(homeDMAs), false, ['dma_code', 'dma_name']).pipe(
        filter(g => g != null)
      ).subscribe(
        graphics => {
          graphics.forEach(g => {
            dmaLookup[g.attributes.dma_code] = g.attributes.dma_name;
          });
        },
        err => this.logger.error.log('There was an error querying the layer', err),
        () => {
          locations.forEach(l => {
            const currentAttributes = attributesBySiteNumber.get(l.locationNumber);
            if (currentAttributes != null) {
              const dmaName = dmaLookup[currentAttributes['homeDma']];
              if (dmaName != null) {
                const newAttribute = this.domainFactory.createLocationAttribute(l, 'Home DMA Name', dmaName);
                if (newAttribute != null) impAttributesToAdd.push(newAttribute);
              }
            }
          });
          if (!isEmpty(impAttributesToAdd)) {
            this.impLocAttributeService.add(impAttributesToAdd);
            this.impLocationService.makeDirty();
          }
        });
    } else {
      if (!isEmpty(impAttributesToAdd)) this.impLocAttributeService.add(impAttributesToAdd);
    }
    if (warningNotificationFlag === 'Y'){
      this.store$.dispatch(WarningNotification({ notificationTitle: 'Home Geocode Warning', message: 'Issues found while calculating Home Geocodes, please check the Locations Grid.' }));
    }
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
      const siteMap = mapByExtended(currentAttributes, a => `${a.impGeofootprintLocation.clientLocationTypeCode}-${a.impGeofootprintLocation.locationNumber}`);
      const currentLocations = this.impLocationService.get();
      for (const loc of currentLocations) {
        if (siteMap.has(`${loc.clientLocationTypeCode}-${loc.locationNumber}`)) {
          loc.homeGeocode = siteMap.get(`${loc.clientLocationTypeCode}-${loc.locationNumber}`).attributeValue;
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

  public validateLocactionsforpip(locations: ImpGeofootprintLocation[]) : Map<string, ImpGeofootprintLocation[] | HomeGeoQueryResult[]>{
    const initialAttributeList: HomeGeoQueryResult[] = [];
    const needtoPipLocations: ImpGeofootprintLocation[] = [];
    const dmaAncCountyLoc: ImpGeofootprintLocation[] = [];
    const locMap = new Map<string, ImpGeofootprintLocation[] | HomeGeoQueryResult[]>();
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
          } else {
            initialAttributeList.push({
              homeZip         :  attrMap['Home Zip Code'],
              homeCounty      :  attrMap['Home County'],
              homeDma         :  attrMap['Home DMA'],
              homeDmaName     :  null,
              homePcr         :  attrMap['Home Carrier Route'],
              homeAtz         :  attrMap['Home ATZ'],
              homeDigitalAtz  :  attrMap['Home Digital ATZ'],
              siteNumber      :  loc.locationNumber,
              abZip           :  loc.locZip.substring(0, 5)
              });
          }
      }
    });
    locMap.set('needtoPipLocations', needtoPipLocations);
    locMap.set('dmaAndCountyLoc', dmaAncCountyLoc);
    locMap.set('initialAttributeList', initialAttributeList);
    return locMap;
  }

  public queryAllHomeGeos(locationsMap: Map<string, any>) : Observable<any> {
      this.logger.debug.log('Location data store prior to home geo query', this.impLocationService.get().length);
      this.logger.debug.log('Querying all Home Geocodes for', locationsMap);
      let pipObservable: Observable<HomeGeoQueryResult[]> = EMPTY;
      let combinedObservable: Observable<HomeGeoQueryResult[]> = EMPTY;
      let dmaAndCountyObservable: Observable<HomeGeoQueryResult[]> = EMPTY;
      let initialAttributesObs: Observable<HomeGeoQueryResult[]> = EMPTY;
      let fuseObservable: Observable<HomeGeoQueryResult[]> = EMPTY;

      if (locationsMap.get('needtoPipLocations').length > 0){
        const locationsHomeGeoFuse: ImpGeofootprintLocation[] = [];
        const locationsForPIP: ImpGeofootprintLocation[] = [];
        locationsMap.get('needtoPipLocations').forEach(loc => {
          if (loc.carrierRoute != null && loc.carrierRoute !== '' && loc.locZip != null){
            loc.homePcr = loc.locZip.substr(0, 5) + loc.carrierRoute;
            locationsHomeGeoFuse.push(loc);
          }else{
            locationsForPIP.push(loc);
          }
        });
        if (locationsForPIP.length > 0){
           pipObservable = this.pipLocations(locationsForPIP).pipe(
             switchMap(res => this.queryRemainingAttr(res, locationsForPIP)),
             map(result => {
               const attributesList: HomeGeoQueryResult[] = [];
                if (result.attributes.length > 0)
                    attributesList.push(... result.attributes);
                if (result.rePipLocations.length > 0){
                    const row = {'ATZ': null, 'DTZ' : null, 'ZIP': null, 'DMA': null, 'COUNTY': null};
                    result.rePipLocations.forEach(loc => {
                      attributesList.push(this.createAttribute(row, loc));
                  });
                }
                return attributesList;
             })
           );
        }
        if (locationsHomeGeoFuse.length > 0){
          const attrList: Map<ImpGeofootprintLocation, string> = new Map<ImpGeofootprintLocation, string>();
          const attributesList: HomeGeoQueryResult[] = [];
          locationsHomeGeoFuse.forEach(loc => attrList.set(loc, loc.locZip.substr(0, 5) + loc.carrierRoute));
          fuseObservable = this.queryRemainingAttr(attrList, locationsHomeGeoFuse).pipe(
            map(result => {
              if (result.attributes.length > 0)
                   attributesList.push(... result.attributes);
              return result;
            }),
            mergeMap(result => {
              if ( result.rePipLocations.length > 0) {
                return this.pipLocations(result.rePipLocations).pipe(
                  switchMap(res => this.queryRemainingAttr(res, result.rePipLocations)),
                  map(res1 => {
                    if (res1.attributes.length > 0)
                         attributesList.push(... res1.attributes);
                    if (res1.rePipLocations.length > 0){
                      res1.rePipLocations.forEach(loc => {
                          attributesList.push(this.createAttribute(null, loc));
                      });
                    }
                    return attributesList;
                    })
                );
              } else {
                return of(attributesList);
              }
            }),
            tap(result => console.log('fuseObservable result', result))
          );
        }
        combinedObservable = merge(fuseObservable, pipObservable);
      }
      if (locationsMap.get('initialAttributeList').length > 0){
        initialAttributesObs = of(locationsMap.get('initialAttributeList') as HomeGeoQueryResult[]);
      }
      if (locationsMap.get('dmaAndCountyLoc').length > 0) {
       dmaAndCountyObservable = this.getDmaAndCounty(locationsMap.get('dmaAndCountyLoc'));
      }
      return merge(dmaAndCountyObservable, combinedObservable, initialAttributesObs).pipe(
        filter(value => value != null),
        reduceConcat()
      );
  }

  public  getDmaAndCounty(locations: ImpGeofootprintLocation[]) : Observable<HomeGeoQueryResult[]>{
    return this.determineHomeGeos(locations.map(l => l.locZip.substring(0, 5)), 'IMP_GEO_HIERARCHY_MV', 'ZIP,DMA,COUNTY', 'ZIP').pipe(
        map(response => {
          return  response.payload;
        }),
        reduceConcat(),
        map(result => {
          const attributesList: HomeGeoQueryResult[] = [];
          const dmaCountyResponseMap = {};
          result.forEach(res => {
            dmaCountyResponseMap[res['ZIP']] = res;
          });
          locations.forEach(loc => {
            const zip = loc.locZip?.substring(0, 5) ?? '';
            const row = dmaCountyResponseMap[zip];
            if (isNotNil(row)){
              const attrMap = {};
              loc.impGeofootprintLocAttribs.forEach(attr => {
                if (homeGeoColumnsSet.has(attr.attributeCode) && attr.attributeValue != null){
                  attrMap[attr.attributeCode] = attr.attributeValue;
                }
              });
                const county = !isEmpty(attrMap['Home County']) ? attrMap['Home County'] : row['homeCounty'];
                const dma = !isEmpty(attrMap['Home DMA']) ? attrMap['Home DMA'] : row['homeDma'];
                attributesList.push({
                  homeZip        :  attrMap['Home Zip Code'],
                  homePcr        :  attrMap['Home Carrier Route'],
                  homeAtz        :  attrMap['Home ATZ'],
                  homeCounty     :  county,
                  homeDma        :  dma,
                  homeDmaName    :  null,
                  homeDigitalAtz :  attrMap['Home Digital ATZ'],
                  siteNumber     :  loc.locationNumber,
                  abZip          :  zip
                });
            }
          });
          return attributesList;
        })
    );
  }


  queryRemainingAttr(attrList: Map<any, any>, impGeofootprintLocations: ImpGeofootprintLocation[]){
    const homePcrList = Array.from(attrList.values());
    const attributesList: any[] = [];

    return  this.determineHomeGeos(homePcrList, 'IMP_GEO_HIERARCHY_MV', 'PCR, ZIP, ATZ, DTZ, COUNTY, DMA', 'PCR').pipe(
      map(response => {
        return  response.payload;
      }),
      reduceConcat(),
      map(result => {
        const locMapBySiteNumber = mapBy(impGeofootprintLocations, 'locationNumber');
        const responseMap: Map<string, any[]> = groupByExtended(result, row => row['PCR']);
        const t = this.getAttributesForLayers(locMapBySiteNumber, responseMap, attrList);
        if (t.attributes.length > 0) attributesList.push(...t.attributes);
        return t;
      }),
      mergeMap(t => {
        this.logger.debug.log(`remaining locations for ATZ: ${t.rePipLocations.length} `);
        if (t.rePipLocations.length > 0){
          return this.pipLocations(t.rePipLocations, 'atz').pipe(
            switchMap(atzGeos => {
              const homeAtzGeos = Array.from(atzGeos.values());
              return this.determineHomeGeos(homeAtzGeos, 'IMP_GEO_HIERARCHY_MV', 'ZIP, ATZ, DTZ, COUNTY, DMA ', 'ATZ').pipe(
                map(response => {
                  return  response.payload;
                }),
                reduceConcat(),
                map(result => {
                  const atzSet = new Set();
                  const atzResultMap = [];
                  result.forEach(record => {
                    if (!atzSet.has(record['ATZ'])){
                          atzSet.add(record['ATZ']);
                          const DTZ = record['DTZ'] === record['ATZ'] ? record['ATZ'] : record['DTZ'] === record['ATZ'].substr(0, 5) ? record['DTZ'] : null ;
                          atzResultMap.push({'ATZ': record['ATZ'], 'DTZ' : DTZ, 'ZIP': record['ZIP'], 'homeDma': record['homeDma'], 'homeCounty': record['homeCounty']});
                    }
                  });
                  const locMapBySiteNumber = mapBy(t.rePipLocations, 'locationNumber');
                  const responseMap: Map<string, any[]> = groupByExtended(Array.from(atzResultMap), row =>  row['ATZ']);
                  const atzResponse = this.getAttributesForLayers(locMapBySiteNumber, responseMap, atzGeos);
                    if (atzResponse.attributes.length > 0) attributesList.push(...atzResponse.attributes);
                    return {'attributes': attributesList, 'rePipLocations': atzResponse.rePipLocations};
                }));
            })
          );
        }
        else{
         return of({'attributes': attributesList, 'rePipLocations': t.rePipLocations})  ;
        }
      }),
      mergeMap(t => {
        this.logger.debug.log(`remaining locations for Zip: ${t.rePipLocations.length} `);
        if (t.rePipLocations.length > 0){
          return this.pipLocations(t.rePipLocations, 'zip').pipe(
            switchMap(zipGeos => {
              const homeZipGeos = Array.from(zipGeos.values());
              return this.determineHomeGeos(homeZipGeos, 'IMP_GEO_HIERARCHY_MV', 'ZIP, ATZ, DTZ, DMA, COUNTY', 'ZIP').pipe(
                map(response => {
                  return  response.payload;
                }),
                reduceConcat(),
                map(result => {
                  const zipSet = new Set();
                  const zipResultMap = [];
                  result.forEach(record => {
                    if (!zipSet.has(record['ZIP'])){
                          zipSet.add(record['ZIP']);
                          const DTZ = record['DTZ'] === record['ZIP'] ? record['DTZ'] : null ;
                          zipResultMap.push({'ATZ': record['ATZ'], 'DTZ' : DTZ, 'ZIP': record['ZIP'], 'homeDma': record['homeDma'], 'homeCounty': record['homeCounty']});
                    }
                  });
                  const locMapBySiteNumber: Map<string, ImpGeofootprintLocation> = mapBy(t.rePipLocations, 'locationNumber');
                  const responseMap: Map<string, any[]> = groupByExtended(Array.from(zipResultMap), row =>  row['ZIP']);
                  const zipResponse = this.getAttributesForLayers(locMapBySiteNumber, responseMap, zipGeos);
                  if (zipResponse.attributes.length > 0) attributesList.push(...zipResponse.attributes);
                  return {'attributes': attributesList, 'rePipLocations': zipResponse.rePipLocations};
                }));
            })
          );
        }
        else return of({'attributes': attributesList, 'rePipLocations': t.rePipLocations});
      })
     );
  }

  getAttributesForLayers(locMapBySiteNumber: Map<string, ImpGeofootprintLocation>, responseMap: Map<string, any[]>, pipResponse: Map<ImpGeofootprintLocation, any>) {
    const attributesList: any[] = [];
    const pipAgainLocations: ImpGeofootprintLocation[] = [];

    pipResponse.forEach((geo: string, loc: ImpGeofootprintLocation) => {
      const row = responseMap.get(geo);
          if (row != null && row.length > 0){
            attributesList.push(this.createAttribute(row[0], loc));
            locMapBySiteNumber.delete(loc.locationNumber);
          }
          else pipAgainLocations.push(loc);
    });
    if (Array.from(locMapBySiteNumber.keys()).length > 0){
          pipAgainLocations.push(...Array.from(locMapBySiteNumber.values()));
    }
    const t = {'attributes': attributesList, 'rePipLocations': pipAgainLocations};
    this.logger.debug.log('Attribute Hydration Complete', t);
    return t;
  }

  pipLocations(locations: ImpGeofootprintLocation[], analysisLevel: string = 'pcr') {
    const queries: Observable<[ImpGeofootprintLocation, string][]>[] = [];
    const layerId = this.config.getLayerIdForAnalysisLevel(analysisLevel);
    const chunks = quadPartitionLocations(locations, analysisLevel);
    const pipTransaction = getUuid();
    chunks.forEach(chunk => {
      if (chunk.length > 0) {
        const points = toUniversalCoordinates(chunk);
        queries.push(this.queryService.queryPoint(layerId, points, true, ['geocode'], pipTransaction).pipe(
          reduceConcat(),
          map(graphics => {
            const result: [ImpGeofootprintLocation, string][] = [];
            chunk.forEach(loc => {
              for (const graphic of graphics) {
                if (contains(graphic.geometry, toUniversalCoordinates(loc) as __esri.Point)){
                  result.push([loc, graphic.attributes['geocode']]);
                  break;
                }
              }
            });
            return result;
          })
        ));
      }
    });
    return merge(...queries, 4).pipe(
      reduceConcat(),
      finalize(() => this.esriLayerService.removeQueryLayer(pipTransaction)),
      map(result => {
        const resultMapByLocation: Map<ImpGeofootprintLocation, string> = new Map(result);
        this.logger.debug.log(`pip Response for ${analysisLevel} : ${Array.from(resultMapByLocation.values()).length} - total locations-${locations.length}`);
        return resultMapByLocation;
      })
    );
  }



  createAttribute(row: any, loc: ImpGeofootprintLocation) : HomeGeoQueryResult {
   const locHomeAttributes: Map<string, string>  = new Map<string, string>();
   loc.impGeofootprintLocAttribs.forEach(attr => {
      if (homeGeoColumnsSet.has(attr.attributeCode) && !isEmpty(attr.attributeValue)){
        locHomeAttributes.set(attr.attributeCode, attr.attributeValue);
      }
   });

    return {
      homeZip        :  locHomeAttributes.get('Home Zip Code')       ??   row?.['ZIP'],
      homePcr        :  locHomeAttributes.get('Home Carrier Route')  ??   row?.['PCR'],
      homeAtz        :  locHomeAttributes.get('Home ATZ')            ??   row?.['ATZ'],
      homeCounty     :  locHomeAttributes.get('Home County')         ??   row?.['homeCounty'],
      homeDma        :  locHomeAttributes.get('Home DMA')            ??   row?.['homeDma'],
      homeDigitalAtz :  locHomeAttributes.get('Home Digital ATZ')    ??   row?.['DTZ'],
      homeDmaName    :  null,
      siteNumber     :  loc.locationNumber,
      abZip          :  loc.locZip?.substring(0, 5)
    };

  }

}
