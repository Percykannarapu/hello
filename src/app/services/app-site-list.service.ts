import { Injectable, OnDestroy } from '@angular/core';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ValGeocodingRequest } from '../models/val-geocoding-request.model';
import { ImpGeofootprintLocAttrib } from '../val-modules/targeting/models/ImpGeofootprintLocAttrib';
import { valGeocodingAttributeKey, ValGeocodingResponse } from '../models/val-geocoding-response.model';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocAttribService } from '../val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import { ValGeocodingService } from './app-geocoding.service';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';
import { MessageService } from 'primeng/components/common/messageservice';
import { ImpDiscoveryService } from './ImpDiscoveryUI.service';
import { ImpDiscoveryUI } from '../models/ImpDiscoveryUI';
import { LocationUiModel } from '../models/location-ui.model';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { MetricService } from '../val-modules/common/services/metric.service';
import { EsriQueryService } from '../esri-modules/layers/esri-query.service';
import { AppConfig } from '../app.config';
import { EsriModules } from '../esri-modules/core/esri-modules.service';
import { EsriUtils } from '../esri-modules/core/esri-utils.service';
import { EsriMapService } from '../esri-modules/core/esri-map.service';

@Injectable()
export class ValSiteListService implements OnDestroy {

  // TODO: get these into a config file somewhere
  private homeGeos = ['ZIP', 'ATZ', 'PCR', 'Digital ATZ'];
  private siteSubscription: Subscription;
  private siteAttributeSubscription: Subscription;
  private discoverySubscription: Subscription;
  private clientCountSubscription: Subscription;
  private compCountSubscription: Subscription;

  private allLocations$: Observable<ImpGeofootprintLocation[]>;
  private currentAnalysisLevel: string;
  private uiModelSubject: BehaviorSubject<LocationUiModel[]> = new BehaviorSubject<LocationUiModel[]>([]);
  private uiModels: LocationUiModel[];

  public allClientLocations$: Observable<ImpGeofootprintLocation[]>;
  public activeClientLocations$: Observable<ImpGeofootprintLocation[]>;
  public allCompetitorLocations$: Observable<ImpGeofootprintLocation[]>;
  public activeCompetitorLocations$: Observable<ImpGeofootprintLocation[]>;

  public allSites$: Observable<LocationUiModel[]> = this.uiModelSubject.asObservable();
  public allClientSites$: Observable<LocationUiModel[]>;
  public allCompetitorSites$: Observable<LocationUiModel[]>;

  constructor(private locationService: ImpGeofootprintLocationService,
              private attributeService: ImpGeofootprintLocAttribService,
              private discoveryService: ImpDiscoveryService,
              private geocodingService: ValGeocodingService,
              private queryService: EsriQueryService,
              private messageService: MessageService,
              private metricsService: MetricService,
              private config: AppConfig,
              private esriMapService: EsriMapService) {
    this.allLocations$ = this.locationService.storeObservable;
    this.uiModels = [];
    this.currentAnalysisLevel = '';
    this.discoverySubscription = this.discoveryService.storeObservable.subscribe(d => {
      this.onDiscoveryChange(d[0]);
    });
    this.siteSubscription = this.allLocations$.subscribe(locations => {
      this.createOrUpdateUiModels(locations, null);
      this.determineAllHomeGeos(locations);
    });
    this.siteAttributeSubscription = this.attributeService.storeObservable.subscribe(attributes => {
      const locs = new Set(attributes.map(a => a.impGeofootprintLocation));
      this.createOrUpdateUiModels(Array.from(locs), attributes);
    });

    this.allClientLocations$ = this.allLocations$.pipe(
      map(locations => locations.filter(l => l.clientLocationTypeCode && l.clientLocationTypeCode === 'Site'))
    );
    this.activeClientLocations$ = this.allLocations$.pipe(
      map(locations => locations.filter(l => l.clientLocationTypeCode && l.clientLocationTypeCode === 'Site' && l.isActive === true))
    );
    this.allCompetitorLocations$ = this.allLocations$.pipe(
      map(locations => locations.filter(l => l.clientLocationTypeCode && l.clientLocationTypeCode === 'Competitor'))
    );
    this.activeCompetitorLocations$ = this.allLocations$.pipe(
      map(locations => locations.filter(l => l.clientLocationTypeCode && l.clientLocationTypeCode === 'Competitor' && l.isActive === true))
    );

    this.allClientSites$ = this.allSites$.pipe(map(sites => sites.filter(s => s.location.clientLocationTypeCode === 'Site')));
    this.allCompetitorSites$ = this.allSites$.pipe(map(sites => sites.filter(s => s.location.clientLocationTypeCode === 'Competitor')));

    this.clientCountSubscription = this.activeClientLocations$.pipe(map(sites => sites.length)).subscribe(l => this.setCounts(l, 'Site'));
    this.compCountSubscription = this.activeCompetitorLocations$.pipe(map(sites => sites.length)).subscribe(l => this.setCounts(l, 'Competitor'));
  }

  public ngOnDestroy() : void {
    if (this.siteSubscription) this.siteSubscription.unsubscribe();
    if (this.siteAttributeSubscription) this.siteAttributeSubscription.unsubscribe();
    if (this.discoverySubscription) this.discoverySubscription.unsubscribe();
    if (this.clientCountSubscription) this.clientCountSubscription.unsubscribe();
    if (this.compCountSubscription) this.compCountSubscription.unsubscribe();
  }

  private onDiscoveryChange(discoveryUI: ImpDiscoveryUI) {
    if (discoveryUI && discoveryUI.analysisLevel != null && discoveryUI.analysisLevel !== this.currentAnalysisLevel) {
      this.currentAnalysisLevel = discoveryUI.analysisLevel;
      this.setPrimaryGeocode(this.currentAnalysisLevel);
    }
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
    this.esriMapService.zoomOnMap(data);
  }

  private determineAllHomeGeos(locations: ImpGeofootprintLocation[]) {
    if (locations.length === 0) return;
    const locationSet = new Set(locations);
    const attributes = this.attributeService.get().filter(a => locationSet.has(a.impGeofootprintLocation));
    const subscriptions = {};
    for (const analysisLevel of this.homeGeos) {
      const homeGeoKey = `Home ${analysisLevel}`;
      const locationsWithHomeGeos = new Set(attributes.filter(a => a.attributeCode === homeGeoKey && a.attributeValue != null).map(a => a.impGeofootprintLocation));
      const locationsNeedingHomeGeo = locations.filter(l => !locationsWithHomeGeos.has(l));
      if (locationsNeedingHomeGeo.length === 0) continue;
      console.log(`Recalculating "${homeGeoKey}" for ${locationsNeedingHomeGeo.length} sites`);
      const layerId = this.config.getLayerIdForAnalysisLevel(analysisLevel);
      subscriptions[analysisLevel] = this.queryService.queryPoint({ portalLayerId: layerId }, locationsNeedingHomeGeo, true, ['geocode']).subscribe(graphics => {
        const attributesToAdd: ImpGeofootprintLocAttrib[] = [];
        for (const loc of locationsNeedingHomeGeo) {
          const locationPoint = new EsriModules.Point({ x: loc.xcoord, y: loc.ycoord });
          for (const graphic of graphics) {
            if (EsriUtils.geometryIsPolygon(graphic.geometry)) {
              if (graphic.geometry.contains(locationPoint)) {
                const realAttribute = new ImpGeofootprintLocAttrib({
                  attributeCode: homeGeoKey,
                  attributeValue: graphic.attributes.geocode,
                  impGeofootprintLocation: loc,
                  isActive: 1
                });
                attributesToAdd.push(realAttribute);
                if (analysisLevel === this.currentAnalysisLevel) loc.homeGeocode = graphic.attributes.geocode;
              }
            }
          }
        }
        this.attributeService.add(attributesToAdd);
      },
          err => console.error('There was an error determining the Home Geocode.', err),
        () => subscriptions[analysisLevel].unsubscribe());
    }
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
        if (attribute.impGeofootprintLocation != null) {
          attribute.impGeofootprintLocation.homeGeocode = attribute.attributeValue;
        }
      }
    }
    this.locationService.update(null, null);
  }

  private createOrUpdateUiModels(locations: ImpGeofootprintLocation[], attributes: ImpGeofootprintLocAttrib[]) {
    const localAttributes = attributes == null ? this.attributeService.get() : attributes;
    const locationSet: Set<ImpGeofootprintLocation> = new Set(locations);
    const uiSet = new Set(this.uiModels.map(m => m.location));
    const updatedModels = new Set(this.uiModels.filter(m => locationSet.has(m.location)));
    const newSites = new Set(locations.filter(l => !uiSet.has(l)));
    const newAttributes = localAttributes.filter(a => newSites.has(a.impGeofootprintLocation));
    const updatedAttributes = localAttributes.filter(a => uiSet.has(a.impGeofootprintLocation) && !newSites.has(a.impGeofootprintLocation));
    // adds
    for (const site of Array.from(newSites)) {
      const newModel = new LocationUiModel(site, newAttributes.filter(a => a.impGeofootprintLocation === site));
      this.uiModels.push(newModel);
    }
    // updates
    for (const update of Array.from(updatedModels)) {
      update.setAttributes(updatedAttributes.filter(a => a.impGeofootprintLocation === update.location));
      update.setPointVisibility(update.location.isActive === true);
    }
    //deletes
    this.uiModels = this.uiModels.filter(m => locationSet.has(m.location));
    this.uiModelSubject.next(this.uiModels);
  }

  private setCounts(count: number, siteType: string) {
    if (siteType === 'Site') {
      this.metricsService.add('LOCATIONS', '# of Sites', count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
    } else {
      this.metricsService.add('LOCATIONS', '# of Competitors', count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
    }
  }
}
