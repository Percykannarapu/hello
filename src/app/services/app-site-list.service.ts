import { Injectable, OnDestroy } from '@angular/core';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ValGeocodingRequest } from '../models/val-geocoding-request.model';
import { ImpGeofootprintLocAttrib } from '../val-modules/targeting/models/ImpGeofootprintLocAttrib';
import { valGeocodingAttributeKey, ValGeocodingResponse } from '../models/val-geocoding-response.model';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocAttribService } from '../val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import { ValGeocodingService } from './app-geocoding.service';
import { Subscription } from 'rxjs/Subscription';
import { EsriRestQueryService, HomeGeoPoint, homeGeoTempKey } from '../esri-modules/rest-api/esri-rest-query.service';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';
import { MessageService } from 'primeng/components/common/messageservice';
import { ImpDiscoveryService } from './ImpDiscoveryUI.service';
import { ImpDiscoveryUI } from '../models/ImpDiscoveryUI';

@Injectable()
export class ValSiteListService implements OnDestroy {

  // TODO: get these into a config file somewhere
  private restUrls: Map<string, string> = new Map([
    ['ZIP', 'ZIP_Top_Vars_CopyAllData/FeatureServer/0/query'],
    ['ATZ', 'ATZ_Top_Vars_CopyAllData/FeatureServer/0/query'],
    ['PCR', 'PCR_Top_Vars_Portal_CopyAllData/FeatureServer/0/query'],
    ['Digital ATZ', 'DIG_ATZ_Top_Vars_CopyAllData/FeatureServer/0/query']
  ]);
  private siteSubscription: Subscription;
  private discoverySubscription: Subscription;
  private allLocations$: Observable<ImpGeofootprintLocation[]>;
  private currentAnalysisLevel: string;

  public allSites$: Observable<ImpGeofootprintLocation[]>;
  public activeSites$: Observable<ImpGeofootprintLocation[]>;
  public allCompetitors$: Observable<ImpGeofootprintLocation[]>;
  public activeCompetitors$: Observable<ImpGeofootprintLocation[]>;

  constructor(private locationService: ImpGeofootprintLocationService,
              private attributeService: ImpGeofootprintLocAttribService,
              private discoveryService: ImpDiscoveryService,
              private geocodingService: ValGeocodingService,
              private esriRestService: EsriRestQueryService,
              private messageService: MessageService) {
    this.discoverySubscription = this.discoveryService.storeObservable.subscribe(d => {
      this.onDiscoveryChange(d[0]);
    });

    this.allLocations$ = this.locationService.storeObservable;
    this.siteSubscription = this.allLocations$.subscribe(locations => {
      this.determineAllHomeGeos(locations);
    });

    this.allSites$ = this.allLocations$.pipe(
      map(locations => locations.filter(l => l.impClientLocationType === 'Site' as any))
    );
    this.activeSites$ = this.allLocations$.pipe(
      map(locations => locations.filter(l => l.impClientLocationType === 'Site' as any && l.isActive === 1))
    );
    this.allCompetitors$ = this.allLocations$.pipe(
      map(locations => locations.filter(l => l.impClientLocationType === 'Competitor' as any))
    );
    this.activeCompetitors$ = this.allLocations$.pipe(
      map(locations => locations.filter(l => l.impClientLocationType === 'Competitor' as any && l.isActive === 1))
    );
  }

  public ngOnDestroy() : void {
    this.siteSubscription.unsubscribe();
    this.discoverySubscription.unsubscribe();
  }

  public geocodeAndPersist(data: ValGeocodingRequest[], siteType: string) : Promise<void> {
    return this.geocodingService.geocodeLocations(data).then((result: ValGeocodingResponse[]) => {
      this.handlePersist(result.map(r => r.toGeoLocation(siteType)));
    });
  }

  private handlePersist(data: ImpGeofootprintLocation[]) : void {
    const flatten = (previous: ImpGeofootprintLocAttrib[], current: ImpGeofootprintLocAttrib[]) => {
      previous.push(...current);
      return previous;
    };
    const attributes: ImpGeofootprintLocAttrib[] = data.map(l => l[valGeocodingAttributeKey]).reduce(flatten, []);
    data.forEach(d => delete d[valGeocodingAttributeKey]);
    this.locationService.add(data);
    this.attributeService.add(attributes);
  }

  private determineAllHomeGeos(locations: ImpGeofootprintLocation[]) {
    if (locations.length === 0) return;
    this.messageService.add({ severity: 'info', summary: 'Home Geo Processing', detail: 'Home Geos are being calculated' });
    const attributes = this.attributeService.get().filter(a => locations.includes(a.impGeofootprintLocation));

    for (const analysisLevel of Array.from(this.restUrls.keys())) {
      const homeGeoKey = `Home ${analysisLevel}`;
      const locationsWithHomeGeos = new Set(attributes.filter(a => a.attributeCode === homeGeoKey && a.attributeValue != null).map(a => a.impGeofootprintLocation));
      const locationsNeedingHomeGeo = locations.filter(l => !locationsWithHomeGeos.has(l));
      if (locationsNeedingHomeGeo.length === 0) continue;
      console.log(`Recalculating "${homeGeoKey}" for ${locationsNeedingHomeGeo.length} sites`);
      this.determineHomeGeos(locationsNeedingHomeGeo, analysisLevel, homeGeoKey)
        .catch(e => {
          console.error(e);
          return [];
        })
        .then(result => this.processHomeGeoResult(result, homeGeoKey));
    }
  }

  private determineHomeGeos(sites: HomeGeoPoint[], analysisLevel: string, attributeKey: string) : Promise<HomeGeoPoint[]>{
    if (this.restUrls.has(analysisLevel)) {
      return this.esriRestService.homeGeocodeQuery(sites, this.restUrls.get(analysisLevel), attributeKey);
    }
    return Promise.reject([]);
  }

  private processHomeGeoResult(sites: HomeGeoPoint[], geoKey: string) {
    const allRealAttributes: ImpGeofootprintLocAttrib[] = [];
    for (const currentSite of sites as ImpGeofootprintLocation[]) {
      if (currentSite[homeGeoTempKey] != null && currentSite[homeGeoTempKey][geoKey] != null) {
        const realAttribute = new ImpGeofootprintLocAttrib({
          attributeCode: geoKey,
          attributeValue: currentSite[homeGeoTempKey][geoKey],
          impGeofootprintLocation: currentSite
        });
        allRealAttributes.push(realAttribute);
      }
    }
    this.attributeService.add(allRealAttributes);
    console.log(`${geoKey} is done calculating`);
    this.messageService.add({ severity: 'info', summary: 'Home Geo Processing', detail: `${geoKey} is done calculating` });
  }

  private setPrimaryGeocode(analysisLevel: string) {
    console.log('Setting primary geo for ', analysisLevel);
    const currentLocations = this.locationService.get();
    if (analysisLevel == null) {
      currentLocations.forEach(l => l.homeGeocode = null);
    } else {
      const homeGeoKey = `Home ${analysisLevel}`; // TODO: This was copy pasta'd
      const currentAttributes = this.attributeService.get().filter(a => a.attributeCode === homeGeoKey);
      for (const attribute of currentAttributes) {
        const index = currentLocations.indexOf(attribute.impGeofootprintLocation);
        if (index >= 0) {
          currentLocations[index].homeGeocode = attribute.attributeValue;
        }
      }
    }
    this.locationService.update(null, null);
    this.messageService.add({ severity: 'info', summary: 'Home Geo Processing', detail: `Primary geo has been set` });
  }

  private onDiscoveryChange(discoveryUI: ImpDiscoveryUI) {
    if (discoveryUI.analysisLevel !== this.currentAnalysisLevel) {
      this.currentAnalysisLevel = discoveryUI.analysisLevel;
      this.setPrimaryGeocode(this.currentAnalysisLevel);
    }
  }
}
