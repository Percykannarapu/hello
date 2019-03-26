import { Injectable } from '@angular/core';
import { calculateStatistics, filterArray, groupBy, isNumber, simpleFlatten, toUniversalCoordinates } from '@val/common';
import { EsriMapService, EsriQueryService, EsriUtils } from '@val/esri';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { distinctUntilChanged, filter, map, pairwise, take, withLatestFrom } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpDomainFactoryService } from '../val-modules/targeting/services/imp-domain-factory.service';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocAttribService } from '../val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpGeofootprintVarService } from '../val-modules/targeting/services/ImpGeofootprintVar.service';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes, TradeAreaMergeTypeCodes, TradeAreaTypeCodes } from '../val-modules/targeting/targeting.enums';
import { AppGeoService } from './app-geo.service';
import { AppLayerService } from './app-layer.service';
import { AppLoggingService } from './app-logging.service';
import { AppStateService } from './app-state.service';
import { mapBy } from '@val/common';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';

interface TradeAreaDefinition {
  store: string;
  geocode: string;
  message: string;
}

export const DEFAULT_MERGE_TYPE: TradeAreaMergeTypeCodes = TradeAreaMergeTypeCodes.MergeEach;

@Injectable()
export class AppTradeAreaService {

  private currentDefaults = new Map<(SuccessfulLocationTypeCodes), { radius: number, selected: boolean }[]>();
  private validAnalysisLevel$: Observable<string>;

  private mergeSpecs = new Map<(SuccessfulLocationTypeCodes), BehaviorSubject<TradeAreaMergeTypeCodes>>();
  public siteTradeAreaMerge$: Observable<TradeAreaMergeTypeCodes>;
  public competitorTradeAreaMerge$: Observable<TradeAreaMergeTypeCodes>;
  public tradeareaType: string = '';
  public uploadFailures: TradeAreaDefinition[] = [];
  private uploadFailuresSub: BehaviorSubject<TradeAreaDefinition[]> = new BehaviorSubject<TradeAreaDefinition[]>([]);
  public uploadFailuresObs$: Observable<TradeAreaDefinition[]> = this.uploadFailuresSub.asObservable();

  constructor(private impTradeAreaService: ImpGeofootprintTradeAreaService,
              private impLocationService: ImpGeofootprintLocationService,
              private impLocAttrService: ImpGeofootprintLocAttribService,
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
    this.siteTradeAreaMerge$ = this.mergeSpecs.get(ImpClientLocationTypeCodes.Site).asObservable().pipe(distinctUntilChanged());
    this.competitorTradeAreaMerge$ = this.mergeSpecs.get(ImpClientLocationTypeCodes.Competitor).asObservable().pipe(distinctUntilChanged());

    this.impTradeAreaService.storeObservable.pipe(
        map((tradeAreas) => tradeAreas.filter(ta => ta.taType === 'AUDIENCE')),
        filter(tas => tas.length > 0)
      ).subscribe(tradeAreas => this.drawTradeAreas(ImpClientLocationTypeCodes.Site, tradeAreas, null, TradeAreaTypeCodes.Audience));
        

    const radiusTradeAreas$ = this.impTradeAreaService.storeObservable.pipe(
      filter(tradeAreas => tradeAreas != null),
      distinctUntilChanged(),
      filterArray(ta => ta.taType.toUpperCase() === 'RADIUS'),
      filter(tas => tas.length > 0)
    );
    const siteTradeAreas$ = radiusTradeAreas$.pipe(
      filterArray(ta => ta.impGeofootprintLocation.clientLocationTypeCode === 'Site'),
      filter(ta => ta.length > 0)
      // distinctUntilArrayContentsChanged(ta => ({ radius: ta.taRadius, isActive: ta.isActive }))
    );
    const competitorTradeAreas$ = radiusTradeAreas$.pipe(
      filterArray(ta => ta.impGeofootprintLocation.clientLocationTypeCode === 'Competitor'),
      filter(ta => ta.length > 0)
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

    siteTradeAreas$.pipe(
      withLatestFrom(this.siteTradeAreaMerge$)
    ).subscribe(([ta, m]) => this.drawTradeAreas(ImpClientLocationTypeCodes.Site, ta, m));
    competitorTradeAreas$.pipe(
      withLatestFrom(this.competitorTradeAreaMerge$)
    ).subscribe(([ta, m]) => this.drawTradeAreas(ImpClientLocationTypeCodes.Competitor, ta, m));

    this.setupAnalysisLevelGeoClearObservable();

    radiusTradeAreas$.pipe(
      map(tas => tas.length),
      pairwise(),
      filter(([prev, curr]) => prev > 0 && curr === 0)
    ).subscribe(() => this.layerService.clearClientLayers());

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
    ).subscribe(() => this.clearGeos());
  }

  public onLocationsWithoutRadius(locations: ImpGeofootprintLocation[]) : void{
    const currentLocations = locations.filter(loc => loc.baseStatus === 'INSERT' && loc.impGeofootprintTradeAreas.filter(ta => ta.taType === 'RADIUS').length === 0);
    const newSites = currentLocations.filter(loc => loc.clientLocationTypeCode === 'Site');
    const newCompetitors = currentLocations.filter(loc => loc.clientLocationTypeCode === 'Competitor');    
    if (newSites.length > 0) {
        this.applyRadiusTradeAreasToLocations(this.currentDefaults.get(ImpClientLocationTypeCodes.Site), newSites);
    }
    if (newCompetitors.length > 0) {
        this.applyRadiusTradeAreasToLocations(this.currentDefaults.get(ImpClientLocationTypeCodes.Competitor), newCompetitors);
    }
  }

  public onAnalysisLevelChange() : void{
    const locations = this.impLocationService.get();
    const currentLocations = locations.filter(loc => loc.impGeofootprintTradeAreas.filter(ta => ta.taType === 'RADIUS').length === 0);
    const newSites = currentLocations.filter(loc => loc.clientLocationTypeCode === 'Site');
    const newCompetitors = currentLocations.filter(loc => loc.clientLocationTypeCode === 'Competitor');    
    if (newSites.length > 0) {
      const siteRadiusFlag: boolean = newSites.filter(loc => isNumber(loc.radius1) || isNumber(loc.radius2) || isNumber(loc.radius3)).length > 0;
      if (siteRadiusFlag) {
        this.applyRadiusTradeAreaOnAnalysisChange(newSites);
      } else {
        this.applyRadiusTradeAreasToLocations(this.currentDefaults.get(ImpClientLocationTypeCodes.Site), newSites);
      }
    }
    if (newCompetitors.length > 0) {
      const competitorRadiusFlag: boolean = newCompetitors.filter(loc => isNumber(loc.radius1) || isNumber(loc.radius2) || isNumber(loc.radius3)).length > 0;
      if (competitorRadiusFlag) {
        this.applyRadiusTradeAreaOnAnalysisChange(newCompetitors);
      } else {
        this.applyRadiusTradeAreasToLocations(this.currentDefaults.get(ImpClientLocationTypeCodes.Competitor), newCompetitors);
      }
    }
  }

  clearAll() : void {
    this.mergeSpecs.set(ImpClientLocationTypeCodes.Site, new BehaviorSubject<TradeAreaMergeTypeCodes>(DEFAULT_MERGE_TYPE));
    this.mergeSpecs.set(ImpClientLocationTypeCodes.Competitor, new BehaviorSubject<TradeAreaMergeTypeCodes>(DEFAULT_MERGE_TYPE));
    this.currentDefaults.set(ImpClientLocationTypeCodes.Site, []);
    this.currentDefaults.set(ImpClientLocationTypeCodes.Competitor, []);
    this.impTradeAreaService.clearAll();
    this.impVarService.clearAll();
  }

  private applyRadiusTradeAreaOnAnalysisChange(data: ImpGeofootprintLocation[]) : void{
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
      newTradeAreas.push(...this.createRadiusTradeAreasForLocations(tradeAreas, [l], false));
    });

    newTradeAreas.forEach(ta => ta.impGeofootprintLocation.impGeofootprintTradeAreas.push(ta));
    this.insertTradeAreas(newTradeAreas);
    this.zoomToTradeArea();
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
    if (varsToRemove.length > 0) this.impVarService.remove(varsToRemove);
    this.appGeoService.deleteGeos(geosToRemove);
    this.impTradeAreaService.remove(tradeAreas);
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
          err => { this.logger.error('Error getting lats and longs from layer', err); },
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

  private clearGeos() : void {
    const allTradeAreas = this.impTradeAreaService.get();
    allTradeAreas.forEach(ta => {
      ta.impGeofootprintGeos = [];
      ta.impGeofootprintVars = [];
      if (TradeAreaTypeCodes.parse(ta.taType) === TradeAreaTypeCodes.Radius) ta['isComplete'] = undefined;
    });
    const allLocations = this.impLocationService.get();
    allLocations.forEach(l => {
      l.impGeofootprintLocAttribs = l.impGeofootprintLocAttribs.filter(a => a.attributeCode !== 'Invalid Home Geo');
    });
    const attrs = this.impLocAttrService.get().filter(a => a.attributeCode === 'Invalid Home Geo');
    const tradeAreasToRemove = new Set([TradeAreaTypeCodes.HomeGeo, TradeAreaTypeCodes.Manual, TradeAreaTypeCodes.MustCover]);
    this.logger.debug('Clearing all Geos');
    this.impTradeAreaService.startTx();
    this.impLocAttrService.remove(attrs);
    this.impVarService.clearAll();
    this.appGeoService.clearAll();
    this.impTradeAreaService.remove(allTradeAreas.filter(ta => tradeAreasToRemove.has(TradeAreaTypeCodes.parse(ta.taType))));
    this.impTradeAreaService.stopTx();
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

    if (currentTradeAreas.length > 0) {
      const radii = currentTradeAreas.map(ta => ta.taRadius);
      if (mergeType !== TradeAreaMergeTypeCodes.MergeAll || taType === TradeAreaTypeCodes.Audience) {
        // all circles will be drawn
        drawnTradeAreas.push(...currentTradeAreas);
      } else {
        // only the largest circle will be drawn
        const maxRadius = Math.max(...radii);
        drawnTradeAreas.push(...currentTradeAreas.filter(ta => ta.taRadius === maxRadius));
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

  public applyCustomTradeArea(data: TradeAreaDefinition[]){
    const currentAnalysisLevel = this.stateService.analysisLevel$.getValue();
    const portalLayerId = this.appConfig.getLayerIdForAnalysisLevel(currentAnalysisLevel);
    const allLocations: ImpGeofootprintLocation[] = this.impLocationService.get();
    const locationsByNumber: Map<string, ImpGeofootprintLocation> = mapBy(allLocations, 'locationNumber');
    const matchedTradeAreas = new Set<TradeAreaDefinition>();

    // make sure we can find an associated location for each uploaded data row
    data.forEach(taDef => {
      if (locationsByNumber.has(taDef.store)){
        matchedTradeAreas.add(taDef);
      } else {
        taDef.message = 'Site number not found';
        this.uploadFailures = [...this.uploadFailures, taDef];
      }
    });

    const outfields = ['geocode', 'latitude', 'longitude'];
    const queryResult = new Map<string, {latitude: number, longitude: number}>();
    const geosToQuery = new Set(Array.from(matchedTradeAreas).map(ta => ta.geocode));

    this.esriQueryService.queryAttributeIn(portalLayerId, 'geocode', Array.from(geosToQuery), false, outfields).pipe(
      map(graphics => graphics.map(g => g.attributes)),
      map(attrs => attrs.map(a => ({ geocode: a.geocode, latitude: Number(a.latitude), longitude: Number(a.longitude) })))
    ).subscribe(
      results => results.forEach(r => queryResult.set(r.geocode, { latitude: r.latitude, longitude: r.longitude })),
      err => console.log('There was an error querying the ArcGIS layer', err),
      () => {
        const geosToAdd: ImpGeofootprintGeo[] = [];
        const tradeAreasToAdd: ImpGeofootprintTradeArea[] = [];
        matchedTradeAreas.forEach(ta => {
          // make sure the query returned a geocode+lat+lon for each of the uploaded data rows
          if (!queryResult.has(ta.geocode)) {
            ta.message = 'Geocode not found';
            this.uploadFailures = [...this.uploadFailures, ta];
          } else {
            const loc = locationsByNumber.get(ta.store);
            const layerData = queryResult.get(ta.geocode);
            // make sure the lat/lon data from the layer is valid
            if (Number.isNaN(layerData.latitude) || Number.isNaN(layerData.longitude)) {
              console.error(`Invalid Layer Data found for geocode ${ta.geocode}`, layerData);
            } else {
              // finally build the tradeArea (if necessary) and geo
              const distance = EsriUtils.getDistance(layerData.longitude, layerData.latitude, loc.xcoord, loc.ycoord);
              let currentTradeArea = loc.impGeofootprintTradeAreas.filter(current => current.taType.toUpperCase() === TradeAreaTypeCodes.Custom.toUpperCase())[0];
              if (currentTradeArea == null) {
                currentTradeArea = this.domainFactory.createTradeArea(loc, TradeAreaTypeCodes.Custom);
                tradeAreasToAdd.push(currentTradeArea);
              }
              const newGeo = this.domainFactory.createGeo(currentTradeArea, ta.geocode, layerData.longitude, layerData.latitude, distance);
              geosToAdd.push(newGeo);
            }
          }
        });
        // stuff all the results into appropriate data stores
        this.impGeoService.add(geosToAdd);
        this.impTradeAreaService.add(tradeAreasToAdd);
        this.appGeoService.ensureMustCovers();
       // this.uploadFailuresObs$ = of(this.uploadFailures);
       this.uploadFailuresSub.next(this.uploadFailures);
      });
  }
}
