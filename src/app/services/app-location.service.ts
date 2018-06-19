import { Injectable } from '@angular/core';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ValGeocodingRequest } from '../models/val-geocoding-request.model';
import { ImpGeofootprintLocAttrib } from '../val-modules/targeting/models/ImpGeofootprintLocAttrib';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocAttribService } from '../val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import { AppGeocodingService } from './app-geocoding.service';
import { Observable, merge, combineLatest } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { MetricService } from '../val-modules/common/services/metric.service';
import { EsriQueryService } from '../esri-modules/layers/esri-query.service';
import { AppConfig } from '../app.config';
import { EsriModules } from '../esri-modules/core/esri-modules.service';
import { EsriUtils } from '../esri-modules/core/esri-utils.service';
import { EsriMapService } from '../esri-modules/core/esri-map.service';
import { AppMessagingService } from './app-messaging.service';
import { calculateStatistics, toUniversalCoordinates } from '../app.utils';
import { AppStateService } from './app-state.service';
import { simpleFlatten } from '../val-modules/common/common.utils';
import { AppGeoService } from './app-geo.service';

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

  constructor(private impLocationService: ImpGeofootprintLocationService,
              private impLocAttributeService: ImpGeofootprintLocAttribService,
              private appStateService: AppStateService,
              private geocodingService: AppGeocodingService,
              private geoService: AppGeoService,
              private queryService: EsriQueryService,
              private messageService: AppMessagingService,
              private metricsService: MetricService,
              private config: AppConfig,
              private esriMapService: EsriMapService) {
    const allLocations$ = this.impLocationService.storeObservable;
    const locationsNeedingHomeGeos$ = allLocations$.pipe(
      filter(locations => locations != null),
      map(locations => locations.filter(loc => !loc.impGeofootprintLocAttribs.some(attr => attr.attributeCode.startsWith('Home '))))
    );

    this.appStateService.analysisLevel$.subscribe(analysisLevel => this.setPrimaryGeocode(analysisLevel));
    combineLatest(locationsNeedingHomeGeos$, this.appStateService.analysisLevel$).pipe(
      filter(([locations]) => locations.length > 0)
    ).subscribe(
      ([locations, analysisLevel]) => this.queryAllHomeGeos(locations, analysisLevel)
    );

    this.allClientLocations$ = allLocations$.pipe(
      map(locations => locations.filter(l => l.clientLocationTypeCode && l.clientLocationTypeCode === 'Site'))
    );
    this.activeClientLocations$ = allLocations$.pipe(
      map(locations => locations.filter(l => l.clientLocationTypeCode && l.clientLocationTypeCode === 'Site' && l.isActive === true))
    );
    this.allCompetitorLocations$ = allLocations$.pipe(
      map(locations => locations.filter(l => l.clientLocationTypeCode && l.clientLocationTypeCode === 'Competitor'))
    );
    this.activeCompetitorLocations$ = allLocations$.pipe(
      map(locations => locations.filter(l => l.clientLocationTypeCode && l.clientLocationTypeCode === 'Competitor' && l.isActive === true))
    );

    this.activeClientLocations$.pipe(map(sites => sites.length)).subscribe(l => this.setCounts(l, 'Site'));
    this.activeCompetitorLocations$.pipe(map(sites => sites.length)).subscribe(l => this.setCounts(l, 'Competitor'));
  }

  public geocode(data: ValGeocodingRequest[], siteType: string) : Observable<ImpGeofootprintLocation[]> {
    return this.geocodingService.geocodeLocations(data).pipe(
      map(responses => responses.map(r => r.toGeoLocation(siteType)))
    );
  }

  public persistLocationsAndAttributes(data: ImpGeofootprintLocation[]) : void {
    data
      .filter(loc => loc.locationName == null || loc.locationName.length === 0)
      .forEach(loc => loc.locationName = loc.locationNumber);
    this.appStateService.currentMaster$.getValue().impGeofootprintLocations.push(...data);
    this.impLocationService.add(data);
    this.impLocAttributeService.add(simpleFlatten(data.map(l => l.impGeofootprintLocAttribs)));
  }

  public zoomToLocations(locations: ImpGeofootprintLocation[]) {
    const xStats = calculateStatistics(locations.map(d => d.xcoord));
    const yStats = calculateStatistics(locations.map(d => d.ycoord));
    this.esriMapService.zoomOnMap(xStats, yStats, locations.length);
  }

  private queryAllHomeGeos(locations: ImpGeofootprintLocation[], analysisLevel: string) {
    const observables: Observable<ImpGeofootprintLocAttrib[]>[] = [];
    for (const currentAnalysisLevel of this.analysisLevelsForHomeGeo) {
      const homeGeoKey = `Home ${currentAnalysisLevel}`;
      console.log(`Recalculating "${homeGeoKey}" for ${locations.length} sites`);
      const layerId = this.config.getLayerIdForAnalysisLevel(currentAnalysisLevel);
      observables.push(this.queryService.queryPoint(layerId, toUniversalCoordinates(locations), true, ['geocode']).pipe(
        map(graphics => {
          const attributesToAdd: ImpGeofootprintLocAttrib[] = [];
          for (const loc of locations) {
            const locationPoint = new EsriModules.Point({ x: loc.xcoord, y: loc.ycoord });
            for (const graphic of graphics) {
              if (EsriUtils.geometryIsPolygon(graphic.geometry)) {
                if (graphic.geometry.contains(locationPoint)) {
                  const newAttribute = new ImpGeofootprintLocAttrib({
                    attributeCode: homeGeoKey,
                    attributeValue: graphic.attributes.geocode,
                    impGeofootprintLocation: loc,
                    isActive: true
                  });
                  attributesToAdd.push(newAttribute);
                  loc.impGeofootprintLocAttribs.push(newAttribute);
                }
              }
            }
          }
          return attributesToAdd;
        })
      ));
    }
    if (observables.length > 0) {
      this.messageService.startSpinnerDialog('HomeGeoCalcKey', 'Calculating Home Geos');
      const attributeCache: ImpGeofootprintLocAttrib[] = [];
      const sub = merge(...observables, 4).subscribe(
        newAttributes => attributeCache.push(...newAttributes),
        err => {
          console.error('There was an error retrieving the home geos', err);
          this.messageService.stopSpinnerDialog('HomeGeoCalcKey');
          this.messageService.showGrowlError('Home Geo', 'There was an error during Home Geo calculation.');
        },
        () => {
          this.impLocAttributeService.add(attributeCache);
          this.setPrimaryGeocode(analysisLevel);
          this.messageService.stopSpinnerDialog('HomeGeoCalcKey');
          this.messageService.showGrowlSuccess('Home Geo', 'Home Geo calculation is complete.');
          if (sub) sub.unsubscribe();
        }
      );
    }
  }

  private setPrimaryGeocode(analysisLevel: string) {
    console.log('Setting primary geo for ', analysisLevel);
    if (analysisLevel == null) {
      const currentLocations = this.impLocationService.get();
      currentLocations.forEach(l => l.homeGeocode = null);
    } else {
      const homeGeoKey = `Home ${analysisLevel}`; // TODO: This was copy pasta'd
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
    if (siteType === 'Site') {
      this.metricsService.add('LOCATIONS', '# of Sites', count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
    } else {
      this.metricsService.add('LOCATIONS', '# of Competitors', count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
    }
  }
}