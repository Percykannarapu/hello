import { Injectable } from '@angular/core';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ValGeocodingRequest } from '../models/val-geocoding-request.model';
import { ImpGeofootprintLocAttrib } from '../val-modules/targeting/models/ImpGeofootprintLocAttrib';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocAttribService } from '../val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import { AppGeocodingService } from './app-geocoding.service';
import { Observable, merge, combineLatest } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
import { MetricService } from '../val-modules/common/services/metric.service';
import { EsriQueryService } from '../esri-modules/layers/esri-query.service';
import { AppConfig } from '../app.config';
import { EsriModules } from '../esri-modules/core/esri-modules.service';
import { EsriUtils } from '../esri-modules/core/esri-utils';
import { EsriMapService } from '../esri-modules/core/esri-map.service';
import { AppMessagingService } from './app-messaging.service';
import { calculateStatistics, toUniversalCoordinates } from '../app.utils';
import { AppStateService } from './app-state.service';
import { simpleFlatten } from '../val-modules/common/common.utils';
import { ImpGeofootprintMaster } from '../val-modules/targeting/models/ImpGeofootprintMaster';
import { AppTradeAreaService } from './app-trade-area.service';
import { ImpDomainFactoryService } from '../val-modules/targeting/services/imp-domain-factory.service';
import { filterArray } from '../val-modules/common/common.rxjs';
import { AppLoggingService } from './app-logging.service';

const getHomeGeoKey = (analysisLevel: string) => `Home ${analysisLevel}`;

@Injectable({
  providedIn: 'root'
})
export class AppLocationService {

  // TODO: get these into a config file somewhere
  private analysisLevelsForHomeGeo = ['ZIP', 'ATZ', 'PCR', 'Digital ATZ'];

  public allClientLocations$: Observable<ImpGeofootprintLocation[]>;
  public activeClientLocations$: Observable<ImpGeofootprintLocation[]>;
  public allCompetitorLocations$: Observable<ImpGeofootprintLocation[]>;
  public activeCompetitorLocations$: Observable<ImpGeofootprintLocation[]>;

  public failedClientLocations$: Observable<ImpGeofootprintLocation[]>;
  public failedCompetitorLocations$: Observable<ImpGeofootprintLocation[]>;
  public failureCount$: Observable<number>;
  public totalCount$: Observable<number>;
  public hasFailures$: Observable<boolean>;

  constructor(private impLocationService: ImpGeofootprintLocationService,
              private impLocAttributeService: ImpGeofootprintLocAttribService,
              private appStateService: AppStateService,
              private appTradeAreaService: AppTradeAreaService,
              private geocodingService: AppGeocodingService,
              private queryService: EsriQueryService,
              private messageService: AppMessagingService,
              private metricsService: MetricService,
              private config: AppConfig,
              private esriMapService: EsriMapService,
              private logger: AppLoggingService,
              private domainFactory: ImpDomainFactoryService) {
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

    combineLatest(locationsNeedingHomeGeos$, this.appStateService.analysisLevel$, this.appStateService.projectIsLoading$).pipe(
      filter(([locations, level, isLoading]) => locations.length > 0 && level != null && level.length > 0 && !isLoading)
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
    if (sites == null || sites.length === 0) return;

    const masters = new Set<ImpGeofootprintMaster>(sites.map(l => l.impGeofootprintMaster));
    const siteSet = new Set<ImpGeofootprintLocation>(sites);
    // remove the sites from the hierarchy
    masters.forEach(m => m.impGeofootprintLocations = m.impGeofootprintLocations.filter(l => !siteSet.has(l)));
    sites.forEach(l => l.impGeofootprintMaster = null);
    // delete from data stores
    const tradeAreas = simpleFlatten(sites.map(l => l.impGeofootprintTradeAreas));
    this.appTradeAreaService.deleteTradeAreas(tradeAreas);
    const attributes = simpleFlatten(sites.map(l => l.impGeofootprintLocAttribs));
    if (attributes.length > 0) this.impLocAttributeService.remove(attributes);
    this.impLocationService.remove(sites);
  }

  public notifySiteChanges() : void {
    this.impLocationService.makeDirty();
  }

  public geocode(data: ValGeocodingRequest[], siteType: string) : Observable<ImpGeofootprintLocation[]> {
    return this.geocodingService.getGeocodingResponse(data, siteType).pipe(
      map(responses => responses.map(r => r.toGeoLocation(siteType, this.appStateService.analysisLevel$.getValue())))
    );
  }

  public persistLocationsAndAttributes(data: ImpGeofootprintLocation[]) : void {
    const currentMaster = this.appStateService.currentMaster$.getValue();

    data.forEach(l =>
      { if (l.locationNumber == null || l.locationNumber.length === 0 ) l.locationNumber = this.impLocationService.getNextLocationNumber().toString() ;
        l.impGeofootprintMaster = currentMaster;
      });
    data
      .filter(loc => loc.locationName == null || loc.locationName.length === 0)
      .forEach(loc => loc.locationName = loc.locationNumber);
        currentMaster.impGeofootprintLocations.push(...data);
    this.impLocationService.add(data);
    this.impLocAttributeService.add(simpleFlatten(data.map(l => l.impGeofootprintLocAttribs)));
  }

  public zoomToLocations(locations: ImpGeofootprintLocation[]) {
    const xStats = calculateStatistics(locations.map(d => d.xcoord));
    const yStats = calculateStatistics(locations.map(d => d.ycoord));
    this.esriMapService.zoomOnMap(xStats, yStats, locations.length);
  }

  private queryAllHomeGeos(locations: ImpGeofootprintLocation[], analysisLevel: string) {
    const observables: Observable<[string, any[]]>[] = [];
    for (const currentAnalysisLevel of this.analysisLevelsForHomeGeo) {
      const homeGeoKey = getHomeGeoKey(currentAnalysisLevel);
      this.logger.debug(`Recalculating "${homeGeoKey}" for ${locations.length} sites`);
      const layerId = this.config.getLayerIdForAnalysisLevel(currentAnalysisLevel);
      observables.push(
        this.queryService.queryPoint(layerId, toUniversalCoordinates(locations), true, ['geocode', 'pob']).pipe(
          map<any[], [string, any[]]>(features => [homeGeoKey, features])
        )
      );
    }
    if (observables.length > 0) {
      this.messageService.startSpinnerDialog('HomeGeoCalcKey', 'Calculating Home Geos');
      const featureCache = new Map<string, any[]>();
      merge(...observables, 4).subscribe(
        ([key, newFeatures]) => {
          if (featureCache.has(key)) {
            featureCache.get(key).push(...newFeatures);
          } else {
            featureCache.set(key, newFeatures);
          }
        },
        err => {
          this.logger.errorWithNotification('Home Geo', 'There was an error during Home Geo calculation.', err);
          console.error('There was an error retrieving the home geos', err);
          this.messageService.stopSpinnerDialog('HomeGeoCalcKey');
        },
        () => {
          featureCache.forEach((features, homeGeoKey) => {
            this.createAttributesFromFeatures(features, homeGeoKey, locations);
          });
          this.flagHomeGeos(locations, analysisLevel);
          this.messageService.stopSpinnerDialog('HomeGeoCalcKey');
          this.messageService.showSuccessNotification('Home Geo', 'Home Geo calculation is complete.');
        }
      );
    }
  }

  private createAttributesFromFeatures(graphics: any[], homeGeoKey: string, locations: ImpGeofootprintLocation[]) : void {
    const attributesToAdd: ImpGeofootprintLocAttrib[] = [];
    for (const loc of locations) {
      const locationPoint = new EsriModules.Point({ x: loc.xcoord, y: loc.ycoord });
      const matches = [];
      for (const graphic of graphics) {
        if (EsriUtils.geometryIsPolygon(graphic.geometry)) {
          if (graphic.geometry.contains(locationPoint)) {
            matches.push(graphic);
          }
        }
      }
      let bestMatch = null;
      if (matches.length > 1) {
        bestMatch = matches.filter(g => g.attributes.pob == null)[0];
      } else {
        bestMatch = matches[0];
      }
      if (bestMatch != null) {
        const newAttribute = this.domainFactory.createLocationAttribute(loc, homeGeoKey, bestMatch.attributes.geocode);
        attributesToAdd.push(newAttribute);
      }
    }
    this.impLocAttributeService.add(attributesToAdd);
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
    this.impLocationService.update(null, null);
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
  }
}
