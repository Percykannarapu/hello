import { Injectable } from '@angular/core';
import { distinctUntilChanged, filter, map, withLatestFrom, take } from 'rxjs/operators';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { AppConfig } from '../app.config';
import { EsriQueryService } from '../esri/services/esri-query.service';
import { ImpGeofootprintVarService } from '../val-modules/targeting/services/ImpGeofootprintVar.service';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes, TradeAreaMergeTypeCodes, TradeAreaTypeCodes } from '../val-modules/targeting/targeting.enums';
import { AppLayerService } from './app-layer.service';
import { AppStateService } from './app-state.service';
import { groupBy, simpleFlatten } from '../val-modules/common/common.utils';
import { calculateStatistics, toUniversalCoordinates } from '../app.utils';
import { EsriMapService } from '../esri/services/esri-map.service';
import { AppGeoService } from './app-geo.service';
import { ImpDomainFactoryService } from '../val-modules/targeting/services/imp-domain-factory.service';
import { filterArray } from '../val-modules/common/common.rxjs';
import { AppLoggingService } from './app-logging.service';

export const DEFAULT_MERGE_TYPE: TradeAreaMergeTypeCodes = TradeAreaMergeTypeCodes.MergeEach;

@Injectable()
export class AppTradeAreaService {

  private currentDefaults = new Map<(SuccessfulLocationTypeCodes), { radius: number, selected: boolean }[]>();
  private validAnalysisLevel$: Observable<string>;

  private mergeSpecs = new Map<(SuccessfulLocationTypeCodes), BehaviorSubject<TradeAreaMergeTypeCodes>>();
  public siteTradeAreaMerge$: Observable<TradeAreaMergeTypeCodes>;
  public competitorTradeAreaMerge$: Observable<TradeAreaMergeTypeCodes>;

  constructor(private impTradeAreaService: ImpGeofootprintTradeAreaService,
              private impLocationService: ImpGeofootprintLocationService,
              private impGeoService:  ImpGeofootprintGeoService,
              private impVarService: ImpGeofootprintVarService,
              private stateService: AppStateService,
              private layerService: AppLayerService,
              private appGeoService: AppGeoService,
              private appConfig: AppConfig,
              private esriMapService: EsriMapService,
              private esriQueryService: EsriQueryService,
              private domainFactory: ImpDomainFactoryService,
              private logger: AppLoggingService) {
    this.mergeSpecs.set(ImpClientLocationTypeCodes.Site, new BehaviorSubject<TradeAreaMergeTypeCodes>(DEFAULT_MERGE_TYPE));
    this.mergeSpecs.set(ImpClientLocationTypeCodes.Competitor, new BehaviorSubject<TradeAreaMergeTypeCodes>(DEFAULT_MERGE_TYPE));
    this.currentDefaults.set(ImpClientLocationTypeCodes.Site, []);
    this.currentDefaults.set(ImpClientLocationTypeCodes.Competitor, []);
    this.validAnalysisLevel$ = this.stateService.analysisLevel$.pipe(filter(al => al != null && al.length > 0));
    this.siteTradeAreaMerge$ = this.mergeSpecs.get(ImpClientLocationTypeCodes.Site).asObservable();
    this.competitorTradeAreaMerge$ = this.mergeSpecs.get(ImpClientLocationTypeCodes.Competitor).asObservable();

    combineLatest(this.impLocationService.storeObservable, this.stateService.applicationIsReady$)
      .pipe(
        filter(([locations, isReady]) => isReady), // don't fire sub if project is loading
      )
      .subscribe(([locations]) => this.onLocationChange(locations));

    this.impTradeAreaService.storeObservable.pipe(
        map((tradeAreas) => tradeAreas.filter(ta => ta.taType === 'AUDIENCE'))
      ).subscribe(tradeAreas => this.drawTradeAreas(ImpClientLocationTypeCodes.Site, tradeAreas, null, TradeAreaTypeCodes.Audience))
        

    const radiusTradeAreas$ = this.impTradeAreaService.storeObservable.pipe(
      filter(tradeAreas => tradeAreas != null),
      filterArray(ta => ta.taType.toUpperCase() === 'RADIUS')
    );
    const siteTradeAreas$ = radiusTradeAreas$.pipe(
      filterArray(ta => ta.impGeofootprintLocation.clientLocationTypeCode === 'Site')
      // distinctUntilArrayContentsChanged(ta => ({ radius: ta.taRadius, isActive: ta.isActive }))
    );
    const competitorTradeAreas$ = radiusTradeAreas$.pipe(
      filterArray(ta => ta.impGeofootprintLocation.clientLocationTypeCode === 'Competitor')
      // distinctUntilArrayContentsChanged(ta => ({ radius: ta.taRadius, isActive: ta.isActive }))
    );

    this.stateService.currentProject$.pipe(
      filter(project => project != null),
      map(project => TradeAreaMergeTypeCodes.parse(project.taSiteMergeType)),
      filter(mergeType => mergeType != null),
      distinctUntilChanged()
    ).subscribe(mt => this.mergeSpecs.get(ImpClientLocationTypeCodes.Site).next(mt));

    this.stateService.currentProject$.pipe(
      filter(project => project != null),
      map(project => TradeAreaMergeTypeCodes.parse(project.taCompetitorMergeType)),
      filter(mergeType => mergeType != null),
      distinctUntilChanged()
    ).subscribe(mt => this.mergeSpecs.get(ImpClientLocationTypeCodes.Competitor).next(mt));

    combineLatest(siteTradeAreas$, this.siteTradeAreaMerge$).subscribe(([ta, m]) => this.drawTradeAreas(ImpClientLocationTypeCodes.Site, ta, m));
    combineLatest(competitorTradeAreas$, this.competitorTradeAreaMerge$).subscribe(([ta, m]) => this.drawTradeAreas(ImpClientLocationTypeCodes.Competitor, ta, m));

    this.setupAnalysisLevelGeoClearObservable();

    this.stateService.clearUI$.subscribe(() => this.currentDefaults.clear());
  }

  private setupAnalysisLevelGeoClearObservable() {
    // the core sequence only fires when analysis level changes
    this.validAnalysisLevel$.pipe(
      // need to enlist the latest geos and isLoading flag
      withLatestFrom(this.impGeoService.storeObservable, this.stateService.applicationIsReady$),
      // halt the sequence if the project is loading
      filter(([analysisLevel, geos, isReady]) => isReady),
      // halt the sequence if there are no geos
      filter(([analysisLevel, geos]) => geos != null && geos.length > 0),
    ).subscribe(() => this.clearAll());
  }

  private onLocationChange(locations: ImpGeofootprintLocation[]) {
    const currentLocations = locations.filter(loc => loc.impGeofootprintTradeAreas.filter(ta => ta.taType === 'RADIUS').length === 0);
    const newSites = currentLocations.filter(loc => loc.clientLocationTypeCode === 'Site');
    const newCompetitors = currentLocations.filter(loc => loc.clientLocationTypeCode === 'Competitor');
    if (newSites.length > 0) {
      this.applyRadiusTradeAreasToLocations(this.currentDefaults.get(ImpClientLocationTypeCodes.Site), newSites);
    }
    if (newCompetitors.length > 0) {
      this.applyRadiusTradeAreasToLocations(this.currentDefaults.get(ImpClientLocationTypeCodes.Competitor), newCompetitors);
    }
  }

  public deleteTradeAreas(tradeAreas: ImpGeofootprintTradeArea[]) : void {
    if (tradeAreas == null || tradeAreas.length === 0) return;

    const locations = new Set<ImpGeofootprintLocation>(tradeAreas.map(ta => ta.impGeofootprintLocation));
    const tradeAreaSet = new Set<ImpGeofootprintTradeArea>(tradeAreas);
    // remove from the hierarchy
    locations.forEach(loc => loc.impGeofootprintTradeAreas = loc.impGeofootprintTradeAreas.filter(ta => !tradeAreaSet.has(ta)));
    // delete from the data stores
    const geosToRemove = simpleFlatten(tradeAreas.map(ta => ta.impGeofootprintGeos));
    const varsToRemove = simpleFlatten(tradeAreas.map(ta => ta.impGeofootprintVars));
    tradeAreas.forEach(ta => {
      ta.impGeofootprintLocation = null;
      ta.impGeofootprintVars = [];
    });
    varsToRemove.forEach(v => v.impGeofootprintTradeArea = null);
    this.impTradeAreaService.remove(tradeAreas);
    if (varsToRemove.length > 0) this.impVarService.remove(varsToRemove);
    this.appGeoService.deleteGeos(geosToRemove);
  }

  public insertTradeAreas(tradeAreas: ImpGeofootprintTradeArea[]) : void {
    this.impTradeAreaService.add(tradeAreas);
  }

  public applyRadiusTradeArea(tradeAreas: { radius: number, selected: boolean }[], siteType: SuccessfulLocationTypeCodes) : void {
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

  public updateMergeType(mergeType: TradeAreaMergeTypeCodes, siteType: SuccessfulLocationTypeCodes) : void {
    if (mergeType == null) return;
    // update project so merge type gets saved to DB
    const currentProject = this.stateService.currentProject$.getValue();
    switch (siteType) {
      case ImpClientLocationTypeCodes.Competitor:
        currentProject.taCompetitorMergeType = mergeType;
        break;
      case ImpClientLocationTypeCodes.Site:
        currentProject.taSiteMergeType = mergeType;
        break;
    }
    // notify the map service
    this.mergeSpecs.get(siteType).next(mergeType);
  }

  public updateTradeAreaSelection(tradeAreas: { taNumber: number, isSelected: boolean }[], siteType: SuccessfulLocationTypeCodes) {
    const taNumbers = new Set(tradeAreas.map(ta => ta.taNumber));
    const currentTradeAreas = this.getAllTradeAreas(siteType).filter(ta => ta.taType === 'RADIUS' && taNumbers.has(ta.taNumber));
    const selectedMap = groupBy(tradeAreas, 'taNumber');
    if (currentTradeAreas.length > 0) {
      let geoStateChanged = false;
      currentTradeAreas.forEach(ta => {
        ta.isActive = selectedMap.get(ta.taNumber)[0].isSelected;
        if (ta.impGeofootprintGeos != null && ta.impGeofootprintGeos.length > 0) {
          geoStateChanged = true;
          ta.impGeofootprintGeos
            .filter(geo => geo.geocode !== ta.impGeofootprintLocation.homeGeocode)
            .forEach(geo => geo.isActive = selectedMap.get(ta.taNumber)[0].isSelected);
        }
      }); // currentTradeAreas for each
      // notify subscribers when state has changed
      if (geoStateChanged) this.impGeoService.update(null, null);
      this.impTradeAreaService.update(null, null);
    }
  }

  public zoomToTradeArea() {
    const latitudes: number[] = [];
    const longitudes: number[] = [];
    const currentAnalysisLevel = this.stateService.analysisLevel$.getValue();

    if (currentAnalysisLevel != null && currentAnalysisLevel.length > 0) {
      // analysisLevel exists - zoom to Trade Area
      const layerId = this.appConfig.getLayerIdForAnalysisLevel(currentAnalysisLevel, false);
      if (layerId == null) return;
      this.stateService.uniqueIdentifiedGeocodes$.pipe(
        filter(geos => geos != null && geos.length > 0),
        take(1)
      ).subscribe(geocodes => {
        const query$ = this.esriQueryService.queryAttributeIn(layerId, 'geocode', geocodes, false, ['latitude', 'longitude']);
        query$.subscribe(
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
          () => this.calculateStatsAndZoom(latitudes, longitudes)
        );
      });
    } else {
      // analysisLevel doesn't exist yet - zoom to site list
      const currentSiteCoords = this.impLocationService.get()
        .filter(loc => loc.clientLocationTypeCode === ImpClientLocationTypeCodes.Site || loc.clientLocationTypeCode === ImpClientLocationTypeCodes.Competitor)
        .map(loc => toUniversalCoordinates(loc));
      currentSiteCoords.forEach(coordinate => {
        latitudes.push(coordinate.y);
        longitudes.push(coordinate.x);
      });
      this.calculateStatsAndZoom(latitudes, longitudes);
    }
  }

  private clearAll() : void {
    const allTradeAreas = this.impTradeAreaService.get();
    this.deleteTradeAreas(allTradeAreas);
  }

  private calculateStatsAndZoom(latitudes: number[], longitudes: number[]) : void {
    const xStats = calculateStatistics(longitudes);
    const yStats = calculateStatistics(latitudes);
    this.esriMapService.zoomOnMap(xStats, yStats, latitudes.length);
  }

  public createRadiusTradeAreasForLocations(tradeAreas: { radius: number, selected: boolean }[], locations: ImpGeofootprintLocation[], attachToHierarchy: boolean = true) : ImpGeofootprintTradeArea[] {
    const newTradeAreas: ImpGeofootprintTradeArea[] = [];
    locations.forEach(location => {
      if (tradeAreas != null && tradeAreas.length > 0)
        for (let i = 0; i < tradeAreas.length; ++i) {
          if (tradeAreas[i].radius != null && tradeAreas[i].selected != null) {
            newTradeAreas.push(this.domainFactory.createTradeArea(location, TradeAreaTypeCodes.Radius, tradeAreas[i].selected, i, tradeAreas[i].radius, attachToHierarchy));
          }
        }
    });  

    return newTradeAreas;
  }

  public applyRadiusTradeAreasToLocations(tradeAreas: { radius: number, selected: boolean }[], locations: ImpGeofootprintLocation[]) : void {
    const newTradeAreas: ImpGeofootprintTradeArea[] = this.createRadiusTradeAreasForLocations(tradeAreas, locations);
    if (newTradeAreas.length > 0) {
      this.impTradeAreaService.add(newTradeAreas);
    }
  }

  private getAllTradeAreas(siteType: SuccessfulLocationTypeCodes) : ImpGeofootprintTradeArea[] {
    const currentLocations = this.getLocations(siteType);
    return simpleFlatten(currentLocations.map(loc => loc.impGeofootprintTradeAreas));
  }

  private getLocations(siteType: SuccessfulLocationTypeCodes) : ImpGeofootprintLocation[] {
    return this.impLocationService.get().filter(loc => loc.clientLocationTypeCode === siteType);
  }

  private drawTradeAreas(siteType: SuccessfulLocationTypeCodes, tradeAreas: ImpGeofootprintTradeArea[], mergeType: TradeAreaMergeTypeCodes, taType?: TradeAreaTypeCodes) : void {
    this.logger.info('Drawing Trade Areas for', siteType);
    this.logger.debug('Draw Trade Area parameters', { siteType, tradeAreas, mergeType });
    const drawnTradeAreas: ImpGeofootprintTradeArea[] = [];
    const currentTradeAreas = tradeAreas.filter(ta => ta.isActive === true);
    const currentLocations = this.impLocationService.get();
    if (currentTradeAreas.length === 0 && currentLocations.length === 0) {
        this.layerService.clearClientLayers();
        return;
    }
    const radii = currentTradeAreas.map(ta => ta.taRadius);
    if (mergeType !== TradeAreaMergeTypeCodes.MergeAll) {
      // all circles will be drawn
      drawnTradeAreas.push(...currentTradeAreas);
    } else {
      // only the largest circle will be drawn
      const maxRadius = Math.max(...radii);
      drawnTradeAreas.push(...currentTradeAreas.filter(ta => ta.taRadius === maxRadius));
    }
    if (taType === TradeAreaTypeCodes.Audience) {
      drawnTradeAreas.push(...currentTradeAreas);
    }
    this.layerService.addToTradeAreaLayer(siteType, drawnTradeAreas, mergeType, taType);
    // reset the defaults that get applied to new locations
    if ((this.currentDefaults.get(siteType) == null || this.currentDefaults.get(siteType).length === 0) && radii.length > 0) {
      const uniqueValues = new Set(radii.sort());
      const taValues: any[] = [];
      uniqueValues.forEach(radius => {
        taValues.push({radius: radius , selected: true });
      });
      this.currentDefaults.set(siteType, taValues);
    }
  }
}
