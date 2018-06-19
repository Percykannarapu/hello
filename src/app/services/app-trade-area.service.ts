import { Injectable, OnDestroy } from '@angular/core';
import { filter, map } from 'rxjs/operators';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { Subscription, BehaviorSubject, combineLatest } from 'rxjs';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { AppConfig } from '../app.config';
import { EsriQueryService } from '../esri-modules/layers/esri-query.service';
import { EsriUtils } from '../esri-modules/core/esri-utils.service';
import { AppLayerService } from './app-layer.service';
import { AppStateService } from './app-state.service';
import { groupBy, simpleFlatten } from '../val-modules/common/common.utils';
import { Observable } from 'rxjs/Observable';
import { ImpGeofootprintGeoAttribService } from '../val-modules/targeting/services/ImpGeofootprintGeoAttribService';
import { calculateStatistics } from '../app.utils';
import { EsriMapService } from '../esri-modules/core/esri-map.service';

export type TradeAreaMergeSpec = 'No Merge' | 'Merge Each' | 'Merge All';
export const DEFAULT_MERGE_TYPE: TradeAreaMergeSpec = 'Merge Each';

@Injectable()
export class AppTradeAreaService implements OnDestroy {

  private readonly locationSubscription: Subscription;

  private currentDefaults = new Map<('Site' | 'Competitor'), { radius: number, selected: boolean }[]>();

  private mergeSpecs = new Map<('Site' | 'Competitor'), BehaviorSubject<TradeAreaMergeSpec>>();
  public siteTradeAreaMerge$: Observable<TradeAreaMergeSpec>;
  public competitorTradeAreaMerge$: Observable<TradeAreaMergeSpec>;

  constructor(private impTradeAreaService: ImpGeofootprintTradeAreaService,
              private impLocationService: ImpGeofootprintLocationService,
              private impGeoService:  ImpGeofootprintGeoService,
              private impGeoAttributeService: ImpGeofootprintGeoAttribService,
              private stateService: AppStateService,
              private layerService: AppLayerService,
              private appConfig: AppConfig,
              private esriMapService: EsriMapService,
              private esriQueryService: EsriQueryService) {
    this.mergeSpecs.set('Site', new BehaviorSubject<TradeAreaMergeSpec>(DEFAULT_MERGE_TYPE));
    this.mergeSpecs.set('Competitor', new BehaviorSubject<TradeAreaMergeSpec>(DEFAULT_MERGE_TYPE));
    this.currentDefaults.set('Site', []);
    this.currentDefaults.set('Competitor', []);
    this.siteTradeAreaMerge$ = this.mergeSpecs.get('Site').asObservable();
    this.competitorTradeAreaMerge$ = this.mergeSpecs.get('Competitor').asObservable();
    this.locationSubscription = this.impLocationService.storeObservable.subscribe(locations => {
      this.onLocationChange(locations);
    });
    const radiusTradeAreas$ = this.impTradeAreaService.storeObservable.pipe(
      filter(tradeAreas => tradeAreas != null && tradeAreas.length > 0),
      map(tradeAreas => tradeAreas.filter(ta => ta.taType.toUpperCase() === 'RADIUS'))
    );
    const siteTradeAreas$ = radiusTradeAreas$.pipe(
      map(tradeAreas => tradeAreas.filter(ta => ta.impGeofootprintLocation.clientLocationTypeCode === 'Site'))
    );
    const competitorTradeAreas$ = radiusTradeAreas$.pipe(
      map(tradeAreas => tradeAreas.filter(ta => ta.impGeofootprintLocation.clientLocationTypeCode === 'Competitor'))
    );

    combineLatest(siteTradeAreas$, this.siteTradeAreaMerge$).subscribe(([ta, m]) => this.drawTradeAreas('Site', ta, m));
    combineLatest(competitorTradeAreas$, this.competitorTradeAreaMerge$).subscribe(([ta, m]) => this.drawTradeAreas('Competitor', ta, m));

  }

  private static createRadiusTradeArea(radius: number, index: number, location: ImpGeofootprintLocation, isActive: boolean) : ImpGeofootprintTradeArea {
    const result = new ImpGeofootprintTradeArea({
      taNumber: index + 1,
      taName: `${location.clientLocationTypeCode} Radius ${index + 1}`,
      taRadius: radius,
      taType: 'RADIUS',
      impGeofootprintLocation: location,
      isActive: isActive
    });
    location.impGeofootprintTradeAreas.push(result);
    return result;
  }

  public static createCustomTradeArea(index: number, location: ImpGeofootprintLocation, isActive: boolean,  taType: string, radius?: number) : ImpGeofootprintTradeArea {
    const result = new ImpGeofootprintTradeArea({
      taNumber: index + 1,
      taName: `${location.clientLocationTypeCode} CUSTOM ${index + 1}`,
      taRadius: (radius !== null ? radius : 0),
      taType: taType,
      impGeofootprintLocation: location,
      isActive: isActive
    });
    location.impGeofootprintTradeAreas.push(result);
    return result;
  }

  ngOnDestroy() : void {
    if (this.locationSubscription) this.locationSubscription.unsubscribe();
  }

  private onLocationChange(locations: ImpGeofootprintLocation[]) {
    const currentLocations = locations.filter(loc => loc.impGeofootprintTradeAreas.filter(ta => ta.taType === 'RADIUS').length === 0);
    const newSites = currentLocations.filter(loc => loc.clientLocationTypeCode === 'Site');
    const newCompetitors = currentLocations.filter(loc => loc.clientLocationTypeCode === 'Competitor');
    if (newSites.length > 0) {
      this.applyRadiusTradeAreasToLocations(this.currentDefaults.get('Site'), newSites);
    }
    if (newCompetitors.length > 0) {
      this.applyRadiusTradeAreasToLocations(this.currentDefaults.get('Competitor'), newCompetitors);
    }
  }

  public applyRadiusTradeArea(tradeAreas: { radius: number, selected: boolean }[], siteType: 'Site' | 'Competitor') : void {
    if (tradeAreas == null || tradeAreas.length === 0 || tradeAreas.length > 3) {
      console.error('Invalid Trade Area request', { tradeAreas, siteType });
      throw new Error('Invalid Trade Area request');
    }
    console.log('applying Trade areas', [tradeAreas, siteType]);
    const currentLocations = this.getLocations(siteType);
    const currentTradeAreas = this.getAllTradeAreas(siteType).filter(ta => ta.taType === 'RADIUS');
    this.deleteTradeAreas(currentTradeAreas);
    this.currentDefaults.set(siteType, tradeAreas); // reset the defaults that get applied to new locations
    this.applyRadiusTradeAreasToLocations(tradeAreas, currentLocations);
  }

  public updateMergeType(mergeType: TradeAreaMergeSpec, siteType: 'Site' | 'Competitor') : void {
    this.mergeSpecs.get(siteType).next(mergeType);
  }

  public updateTradeAreaSelection(tradeAreaIndex: 0|1|2, isSelected: boolean, siteType: 'Site' | 'Competitor') {
    const currentTradeAreas = this.getAllTradeAreas(siteType).filter(ta => ta.taType === 'RADIUS' && ta.taNumber === tradeAreaIndex + 1);
    if (currentTradeAreas.length > 0) {
      let geoStateChanged = false;
      currentTradeAreas.forEach(ta => {
        ta.isActive = isSelected;
        if (ta.impGeofootprintGeos != null && ta.impGeofootprintGeos.length > 0) {
          geoStateChanged = true;
          ta.impGeofootprintGeos.forEach(geo => geo.isActive = isSelected);
        }
      }); // currentTradeAreas for each
      // notify subscribers when state has changed
      if (geoStateChanged) this.impGeoService.update(null, null);
      this.impTradeAreaService.update(null, null);
    }
  }

  public calculateHomegeocodeBuffer(tradeAreasForInsert: ImpGeofootprintTradeArea[], siteType: string, currentLocations: ImpGeofootprintLocation[]) {
    const analysisLevel = this.stateService.analysisLevel$.getValue();
    if (siteType === 'Competitor' || analysisLevel == null || analysisLevel.length > 0) return;
    const portalLayerId = this.appConfig.getLayerIdForAnalysisLevel(analysisLevel, false);
    const geocodesList = currentLocations.map(impGeoLocation => impGeoLocation['homeGeocode']);
    //console.log('length of home geocodes::', geocodesList);
    const geocodesSet = new Set(geocodesList);
    const geocodes = Array.from(geocodesSet);
    if (geocodes[0] == undefined) {
      console.warn('Attempted to define a trade area for a site without a home geocode');
      return; // TODO: Is this correct behavior for DE1765? It seems to work
    }
    let customIndex: number = tradeAreasForInsert.length + 1; // 0;
    const tas = tradeAreasForInsert.map(ta => ta.taRadius);
    const maxRadius = Math.max(...tas);
    const sub = this.esriQueryService.queryAttributeIn(portalLayerId, 'geocode', geocodes, true).subscribe(graphics => {
      const geosToAdd: ImpGeofootprintGeo[] = [];
      graphics.forEach(graphic => {
        currentLocations.forEach(loc => {
          if (loc.homeGeocode === graphic.attributes['geocode'] && EsriUtils.geometryIsPoint(graphic.geometry)){
            const geocodeDistance =  EsriUtils.getDistance(graphic.geometry, loc.xcoord, loc.ycoord);
            if (geocodeDistance > maxRadius || geocodeDistance === 0) {
              customIndex++;
              const ta: ImpGeofootprintTradeArea = AppTradeAreaService.createCustomTradeArea(customIndex, loc, true, 'HOMEGEO CUSTOM');
              geosToAdd.push(this.createGeo(geocodeDistance, graphic.geometry, loc, ta));
              tradeAreasForInsert.push(ta);
            }
          }
        });
      });
      this.impGeoService.add(geosToAdd.filter(g => g.impGeofootprintTradeArea.taType === 'HOMEGEO CUSTOM'));
    }, null, () => {
      this.impTradeAreaService.add(tradeAreasForInsert.filter(ta => ta.taType === 'HOMEGEO CUSTOM'));
      sub.unsubscribe();
    });
  }

  public  createGeo(distance: number, point: __esri.Point, loc: ImpGeofootprintLocation, ta?: ImpGeofootprintTradeArea) : ImpGeofootprintGeo {
    const impGeofootprintGeo: ImpGeofootprintGeo = new ImpGeofootprintGeo();
    impGeofootprintGeo.geocode = loc.homeGeocode;
    impGeofootprintGeo.isActive = true;
    impGeofootprintGeo.impGeofootprintLocation = loc;
    impGeofootprintGeo.distance = distance;
    impGeofootprintGeo.xcoord = point.x;
    impGeofootprintGeo.ycoord = point.y;
    if (ta != null)
       impGeofootprintGeo.impGeofootprintTradeArea = ta;
    return impGeofootprintGeo;
  }

  private applyRadiusTradeAreasToLocations(tradeAreas: { radius: number, selected: boolean }[], locations: ImpGeofootprintLocation[]) : void {
    const newTradeAreas: ImpGeofootprintTradeArea[] = [];
    locations.forEach(location => {
      for (let i = 0; i < tradeAreas.length; ++i) {
        if (tradeAreas[i].radius != null && tradeAreas[i].selected != null) {
          newTradeAreas.push(AppTradeAreaService.createRadiusTradeArea(tradeAreas[i].radius, i, location, tradeAreas[i].selected));
        }
      }
    }); // locations for each
    this.impTradeAreaService.add(newTradeAreas);
  }

  private deleteTradeAreas(tradeAreas: ImpGeofootprintTradeArea[]) : void {
    if (tradeAreas == null) return;
    this.impTradeAreaService.remove(tradeAreas);
    this.impTradeAreaService.addDbRemove(tradeAreas);

    const geosToRemove = simpleFlatten(tradeAreas.map(ta => ta.impGeofootprintGeos));
    const attributesToRemove = simpleFlatten(geosToRemove.map(geo => geo.impGeofootprintGeoAttribs));
    if (geosToRemove.length === 0) return;
    this.impGeoService.remove(geosToRemove);
    this.impGeoService.addDbRemove(geosToRemove);

    if (attributesToRemove.length === 0) return;
    this.impGeoAttributeService.remove(attributesToRemove);
    // Attributes aren't persisted to the DB, so no need for this, but I want to keep it here in case that changes
    this.impGeoAttributeService.addDbRemove(attributesToRemove);
  }

  private getAllTradeAreas(siteType: 'Site' | 'Competitor') : ImpGeofootprintTradeArea[] {
    const currentLocations = this.getLocations(siteType);
    return simpleFlatten(currentLocations.map(loc => loc.impGeofootprintTradeAreas));
  }

  private getLocations(siteType: 'Site' | 'Competitor') : ImpGeofootprintLocation[] {
    return this.impLocationService.get().filter(loc => loc.clientLocationTypeCode === siteType);
  }

  private drawTradeAreas(siteType: string, tradeAreas: ImpGeofootprintTradeArea[], mergeType: TradeAreaMergeSpec) : void {
    const drawnTradeAreas: ImpGeofootprintTradeArea[] = [];
    const locationMap = groupBy(tradeAreas, 'impGeofootprintLocation');
    const locations = Array.from(locationMap.keys());
    locations.forEach(loc => {
      const currentTradeAreas = locationMap.get(loc);
      if (mergeType !== 'Merge All') {
        // all circles will be drawn
        drawnTradeAreas.push(...currentTradeAreas);
      } else {
        // only the largest circle will be drawn
        const radii = currentTradeAreas.map(ta => ta.taRadius);
        const maxRadius = Math.max(...radii);
        drawnTradeAreas.push(...currentTradeAreas.filter(ta => ta.taRadius === maxRadius));
      }
    });
    this.layerService.addToTradeAreaLayer(siteType, drawnTradeAreas, mergeType);
  }

  public zoomToTradeArea() {
    const latitudes: number[] = [];
    const longitudes: number[] = [];
    const layerId = this.appConfig.getLayerIdForAnalysisLevel(this.stateService.analysisLevel$.getValue(), false);
    const geocodes = this.stateService.uniqueIdentifiedGeocodes$.getValue();
    console.log('layerId:::', layerId);
    if (layerId == null || geocodes == null || geocodes.length === 0) return;
    const query$ = this.esriQueryService.queryAttributeIn(layerId, 'geocode', geocodes, false, ['latitude', 'longitude']);
    const sub = query$.subscribe(
      selections => {
        selections.forEach(g => {
          if (g.attributes.latitude != null && !Number.isNaN(Number(g.attributes.latitude))) {
            latitudes.push(Number(g.attributes.latitude));
          }
          if (g.attributes.longitude != null && !Number.isNaN(Number(g.attributes.longitude))) {
            longitudes.push(Number(g.attributes.longitude));
          }
        });
      },
      err => { console.error('Error getting lats and longs from layer', err); },
      () => {
        const xStats = calculateStatistics(longitudes);
        const yStats = calculateStatistics(latitudes);
        this.esriMapService.zoomOnMap(xStats, yStats, geocodes.length);
        if (sub) sub.unsubscribe();
      }
    );
  }
}
