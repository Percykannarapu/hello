import { Injectable } from '@angular/core';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { AppConfig } from '../app.config';
import { EsriQueryService } from '../esri-modules/layers/esri-query.service';
import { ImpGeofootprintVarService } from '../val-modules/targeting/services/ImpGeofootprintVar.service';
import { AppLayerService } from './app-layer.service';
import { AppStateService } from './app-state.service';
import { groupBy, simpleFlatten } from '../val-modules/common/common.utils';
import { calculateStatistics } from '../app.utils';
import { EsriMapService } from '../esri-modules/core/esri-map.service';
import { AppGeoService } from './app-geo.service';

export type TradeAreaMergeSpec = 'No Merge' | 'Merge Each' | 'Merge All';
export const DEFAULT_MERGE_TYPE: TradeAreaMergeSpec = 'Merge Each';

function isMergeType(item: string) : item is TradeAreaMergeSpec {
  return item === 'No Merge' || item === 'Merge Each' || item === 'Merge All';
}

@Injectable()
export class AppTradeAreaService {

  private currentDefaults = new Map<('Site' | 'Competitor'), { radius: number, selected: boolean }[]>();

  private mergeSpecs = new Map<('Site' | 'Competitor'), BehaviorSubject<TradeAreaMergeSpec>>();
  public siteTradeAreaMerge$: Observable<TradeAreaMergeSpec>;
  public competitorTradeAreaMerge$: Observable<TradeAreaMergeSpec>;

  constructor(private impTradeAreaService: ImpGeofootprintTradeAreaService,
              private impLocationService: ImpGeofootprintLocationService,
              private impGeoService:  ImpGeofootprintGeoService,
              private impVarService: ImpGeofootprintVarService,
              private stateService: AppStateService,
              private layerService: AppLayerService,
              private appGeoService: AppGeoService,
              private appConfig: AppConfig,
              private esriMapService: EsriMapService,
              private esriQueryService: EsriQueryService) {
    this.mergeSpecs.set('Site', new BehaviorSubject<TradeAreaMergeSpec>(DEFAULT_MERGE_TYPE));
    this.mergeSpecs.set('Competitor', new BehaviorSubject<TradeAreaMergeSpec>(DEFAULT_MERGE_TYPE));
    this.currentDefaults.set('Site', []);
    this.currentDefaults.set('Competitor', []);
    this.siteTradeAreaMerge$ = this.mergeSpecs.get('Site').asObservable();
    this.competitorTradeAreaMerge$ = this.mergeSpecs.get('Competitor').asObservable();

    combineLatest(this.impLocationService.storeObservable, this.stateService.projectIsLoading$)
      .pipe(
        filter(([locations, isLoading]) => !isLoading), // don't fire sub is project is loading
        map(([locations]) => locations) // strip isLoading flag off the tuple - don't need it in the sub
      )
      .subscribe(locations => this.onLocationChange(locations));

    const radiusTradeAreas$ = combineLatest(this.impTradeAreaService.storeObservable, this.esriMapService.onReady$).pipe(
      filter(([tradeAreas, isReady]) => isReady && tradeAreas != null),
      map(([tradeAreas]) => tradeAreas.filter(ta => ta.taType.toUpperCase() === 'RADIUS'))
    );
    const siteTradeAreas$ = radiusTradeAreas$.pipe(
      map(tradeAreas => tradeAreas.filter(ta => ta.impGeofootprintLocation.clientLocationTypeCode === 'Site'))
    );
    const competitorTradeAreas$ = radiusTradeAreas$.pipe(
      map(tradeAreas => tradeAreas.filter(ta => ta.impGeofootprintLocation.clientLocationTypeCode === 'Competitor'))
    );

    this.stateService.currentProject$.pipe(
      filter(project => project != null),
      map(project => project.taSiteMergeType),
      distinctUntilChanged()
    ).subscribe(mt => {
      if (isMergeType(mt)) {
        this.mergeSpecs.get('Site').next(mt);
      }
    });
    this.stateService.currentProject$.pipe(
      filter(project => project != null),
      map(project => project.taCompetitorMergeType),
      distinctUntilChanged()
    ).subscribe(mt => {
      if (isMergeType(mt)) {
        this.mergeSpecs.get('Competitor').next(mt);
      }
    });

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

  public static createCustomTradeArea(index: number, location: ImpGeofootprintLocation, isActive: boolean,  taType: string) : ImpGeofootprintTradeArea {
    const result = new ImpGeofootprintTradeArea({
      taNumber: index + 1,
      taName: `${location.clientLocationTypeCode} Custom ${index + 1}`,
      taRadius: 0,
      taType: taType,
      impGeofootprintLocation: location,
      isActive: isActive
    });
    location.impGeofootprintTradeAreas.push(result);
    return result;
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

  public deleteTradeAreas(tradeAreas: ImpGeofootprintTradeArea[]) : void {
    if (tradeAreas == null || tradeAreas.length === 0) return;

    const locations = new Set<ImpGeofootprintLocation>(tradeAreas.map(ta => ta.impGeofootprintLocation));
    const tradeAreaSet = new Set<ImpGeofootprintTradeArea>(tradeAreas);
    // remove from the hierarchy
    locations.forEach(loc => loc.impGeofootprintTradeAreas = loc.impGeofootprintTradeAreas.filter(ta => !tradeAreaSet.has(ta)));
    tradeAreas.forEach(ta => ta.impGeofootprintLocation = null);
    // delete from the data stores
    const geosToRemove = simpleFlatten(tradeAreas.map(ta => ta.impGeofootprintGeos));
    this.appGeoService.deleteGeos(geosToRemove);
    const varsToRemove = simpleFlatten(tradeAreas.map(ta => ta.impGeofootprintVars));
    if (varsToRemove.length > 0) this.impVarService.remove(varsToRemove);
    this.impTradeAreaService.remove(tradeAreas);
  }

  public applyRadiusTradeArea(tradeAreas: { radius: number, selected: boolean }[], siteType: 'Site' | 'Competitor') : void {
    if (tradeAreas == null || tradeAreas.length === 0) {
      console.error('Invalid Trade Area request', { tradeAreas, siteType });
      throw new Error('Invalid Trade Area request');
    }
    const currentLocations = this.getLocations(siteType);
    const currentTradeAreas = this.getAllTradeAreas(siteType).filter(ta => ta.taType === 'RADIUS' || ta.taType === 'HOMEGEO');
    this.deleteTradeAreas(currentTradeAreas);
    this.currentDefaults.set(siteType, tradeAreas); // reset the defaults that get applied to new locations
    this.applyRadiusTradeAreasToLocations(tradeAreas, currentLocations);
  }

  public updateMergeType(mergeType: TradeAreaMergeSpec, siteType: 'Site' | 'Competitor') : void {
    if (mergeType == null) return;
    // update project so merge type gets saved to DB
    const currentProject = this.stateService.currentProject$.getValue();
    siteType === 'Site' ?
      currentProject.taSiteMergeType = mergeType :
      currentProject.taCompetitorMergeType = mergeType;

    // notify the map service
    this.mergeSpecs.get(siteType).next(mergeType);
  }

  public updateTradeAreaSelection(tradeAreas: { taNumber: number, isSelected: boolean }[], siteType: 'Site' | 'Competitor') {
    const taNums = new Set(tradeAreas.map(ta => ta.taNumber));
    const currentTradeAreas = this.getAllTradeAreas(siteType).filter(ta => ta.taType === 'RADIUS' && taNums.has(ta.taNumber));
    const selectedMap = groupBy(tradeAreas, 'taNumber');
    if (currentTradeAreas.length > 0) {
      let geoStateChanged = false;
      currentTradeAreas.forEach(ta => {
        ta.isActive = selectedMap.get(ta.taNumber)[0].isSelected;
        if (ta.impGeofootprintGeos != null && ta.impGeofootprintGeos.length > 0) {
          geoStateChanged = true;
          ta.impGeofootprintGeos
            .filter(geo => geo.geocode !== ta.impGeofootprintLocation.homeGeocode)  // TODO: ask in scrum about this
            .forEach(geo => geo.isActive = selectedMap.get(ta.taNumber)[0].isSelected);
        }
      }); // currentTradeAreas for each
      // notify subscribers when state has changed
      if (geoStateChanged) this.impGeoService.update(null, null);
      this.impTradeAreaService.update(null, null);
    }
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

  private getAllTradeAreas(siteType: 'Site' | 'Competitor') : ImpGeofootprintTradeArea[] {
    const currentLocations = this.getLocations(siteType);
    return simpleFlatten(currentLocations.map(loc => loc.impGeofootprintTradeAreas));
  }

  private getLocations(siteType: 'Site' | 'Competitor') : ImpGeofootprintLocation[] {
    return this.impLocationService.get().filter(loc => loc.clientLocationTypeCode === siteType);
  }

  private drawTradeAreas(siteType: string, tradeAreas: ImpGeofootprintTradeArea[], mergeType: TradeAreaMergeSpec) : void {
    const drawnTradeAreas: ImpGeofootprintTradeArea[] = [];
    const currentTradeAreas = tradeAreas.filter(ta => ta.isActive === true);
    if (mergeType !== 'Merge All') {
      // all circles will be drawn
      drawnTradeAreas.push(...currentTradeAreas);
    } else {
      // only the largest circle will be drawn
      const radii = currentTradeAreas.map(ta => ta.taRadius);
      const maxRadius = Math.max(...radii);
      drawnTradeAreas.push(...currentTradeAreas.filter(ta => ta.taRadius === maxRadius));
    }
    console.log(`Drawing ${siteType} trade areas`, drawnTradeAreas);
    this.layerService.addToTradeAreaLayer(siteType, drawnTradeAreas, mergeType);
  }

  public zoomToTradeArea() {
    const latitudes: number[] = [];
    const longitudes: number[] = [];
    const layerId = this.appConfig.getLayerIdForAnalysisLevel(this.stateService.analysisLevel$.getValue(), false);
    const geocodes = this.stateService.uniqueIdentifiedGeocodes$.getValue();
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
