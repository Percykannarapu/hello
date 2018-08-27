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
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes, TradeAreaMergeTypeCodes, TradeAreaTypeCodes } from '../val-modules/targeting/targeting.enums';
import { AppLayerService } from './app-layer.service';
import { AppStateService } from './app-state.service';
import { groupBy, simpleFlatten } from '../val-modules/common/common.utils';
import { calculateStatistics } from '../app.utils';
import { EsriMapService } from '../esri-modules/core/esri-map.service';
import { AppGeoService } from './app-geo.service';
import { ImpDomainFactoryService } from '../val-modules/targeting/services/imp-domain-factory.service';

export const DEFAULT_MERGE_TYPE: TradeAreaMergeTypeCodes = TradeAreaMergeTypeCodes.MergeEach;

@Injectable()
export class AppTradeAreaService {

  private currentDefaults = new Map<(SuccessfulLocationTypeCodes), { radius: number, selected: boolean }[]>();

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
              private domainFactory: ImpDomainFactoryService) {
    this.mergeSpecs.set(ImpClientLocationTypeCodes.Site, new BehaviorSubject<TradeAreaMergeTypeCodes>(DEFAULT_MERGE_TYPE));
    this.mergeSpecs.set(ImpClientLocationTypeCodes.Competitor, new BehaviorSubject<TradeAreaMergeTypeCodes>(DEFAULT_MERGE_TYPE));
    this.currentDefaults.set(ImpClientLocationTypeCodes.Site, []);
    this.currentDefaults.set(ImpClientLocationTypeCodes.Competitor, []);
    this.siteTradeAreaMerge$ = this.mergeSpecs.get(ImpClientLocationTypeCodes.Site).asObservable();
    this.competitorTradeAreaMerge$ = this.mergeSpecs.get(ImpClientLocationTypeCodes.Competitor).asObservable();

    combineLatest(this.impLocationService.storeObservable, this.stateService.projectIsLoading$)
      .pipe(
        filter(([locations, isLoading]) => !isLoading), // don't fire sub if project is loading
      )
      .subscribe(([locations]) => this.onLocationChange(locations));

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

    this.stateService.getClearUserInterfaceObs().pipe(filter(flag => flag)).subscribe(( ) => this.currentDefaults.clear());

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
    tradeAreas.forEach(ta => ta.impGeofootprintLocation = null);
    // delete from the data stores
    const geosToRemove = simpleFlatten(tradeAreas.map(ta => ta.impGeofootprintGeos));
    this.appGeoService.deleteGeos(geosToRemove);
    const varsToRemove = simpleFlatten(tradeAreas.map(ta => ta.impGeofootprintVars));
    if (varsToRemove.length > 0) this.impVarService.remove(varsToRemove);
    this.impTradeAreaService.remove(tradeAreas);
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

  public applyRadiusTradeAreasToLocations(tradeAreas: { radius: number, selected: boolean }[], locations: ImpGeofootprintLocation[]) : void {
    const newTradeAreas: ImpGeofootprintTradeArea[] = [];
    locations.forEach(location => {
      if (tradeAreas != null && tradeAreas.length > 0)
        for (let i = 0; i < tradeAreas.length; ++i) {
          if (tradeAreas[i].radius != null && tradeAreas[i].selected != null) {
            newTradeAreas.push(this.domainFactory.createTradeArea(location, TradeAreaTypeCodes.Radius, tradeAreas[i].selected, i, tradeAreas[i].radius));
          }
        }
    }); // locations for each
    this.impTradeAreaService.add(newTradeAreas);
  }

  private getAllTradeAreas(siteType: SuccessfulLocationTypeCodes) : ImpGeofootprintTradeArea[] {
    const currentLocations = this.getLocations(siteType);
    return simpleFlatten(currentLocations.map(loc => loc.impGeofootprintTradeAreas));
  }

  private getLocations(siteType: SuccessfulLocationTypeCodes) : ImpGeofootprintLocation[] {
    return this.impLocationService.get().filter(loc => loc.clientLocationTypeCode === siteType);
  }

  private drawTradeAreas(siteType: SuccessfulLocationTypeCodes, tradeAreas: ImpGeofootprintTradeArea[], mergeType: TradeAreaMergeTypeCodes) : void {
    const drawnTradeAreas: ImpGeofootprintTradeArea[] = [];
    const currentTradeAreas = tradeAreas.filter(ta => ta.isActive === true);
    const radii = currentTradeAreas.map(ta => ta.taRadius);
    if (mergeType !== TradeAreaMergeTypeCodes.MergeAll) {
      // all circles will be drawn
      drawnTradeAreas.push(...currentTradeAreas);
    } else {
      // only the largest circle will be drawn
      const maxRadius = Math.max(...radii);
      drawnTradeAreas.push(...currentTradeAreas.filter(ta => ta.taRadius === maxRadius));
    }
    console.log(`Drawing ${siteType} trade areas`, drawnTradeAreas);
    this.layerService.addToTradeAreaLayer(siteType, drawnTradeAreas, mergeType);
    // reset the defaults that get applied to new locations
    if (this.currentDefaults.get(siteType).length < 1 && radii.length > 0){
      const unique = (value, index, self) => {
        return self.indexOf(value) === index;
      };
      const uniqueValues = radii.filter(unique);
      const taValues: any[] = [];
      uniqueValues.forEach(radius => {
        taValues.push({radius: radius , selected: true });
      });
      this.currentDefaults.set(siteType, taValues);
    }
  }
}
