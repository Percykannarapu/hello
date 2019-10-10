import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { calculateStatistics, filterArray, groupBy, isNumber, mapBy, simpleFlatten, toUniversalCoordinates } from '@val/common';
import { EsriMapService, EsriQueryService, EsriUtils } from '@val/esri';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map, take, withLatestFrom } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { FullAppState } from '../state/app.interfaces';
import { RenderTradeAreas } from '../state/rendering/rendering.actions';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpDomainFactoryService } from '../val-modules/targeting/services/imp-domain-factory.service';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocAttribService } from '../val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpGeofootprintVarService } from '../val-modules/targeting/services/ImpGeofootprintVar.service';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes, TradeAreaTypeCodes } from '../val-modules/targeting/targeting.enums';
import { AppGeoService } from './app-geo.service';
import { AppLoggingService } from './app-logging.service';
import { AppStateService } from './app-state.service';
import { ClearAudiencesAndVars } from 'app/impower-datastore/state/transient/transient.actions';
import { ClearMapVars } from 'app/impower-datastore/state/transient/map-vars/map-vars.actions';
import { ClearGeoVars } from 'app/impower-datastore/state/transient/geo-vars/geo-vars.actions';
import { ClearAudienceStats } from 'app/impower-datastore/state/transient/audience/audience.actions';

interface TradeAreaDefinition {
  store: string;
  geocode: string;
  message: string;
}

@Injectable()
export class AppTradeAreaService {

  public currentDefaults = new Map<(SuccessfulLocationTypeCodes), { radius: number, selected: boolean }[]>();
  private validAnalysisLevel$: Observable<string>;

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
              private appGeoService: AppGeoService,
              private appConfig: AppConfig,
              private esriMapService: EsriMapService,
              private esriQueryService: EsriQueryService,
              private domainFactory: ImpDomainFactoryService,
              private logger: AppLoggingService,
              private store$: Store<FullAppState>) {
    this.currentDefaults.set(ImpClientLocationTypeCodes.Site, []);
    this.currentDefaults.set(ImpClientLocationTypeCodes.Competitor, []);
    this.validAnalysisLevel$ = this.stateService.analysisLevel$.pipe(filter(al => al != null && al.length > 0));

    this.impTradeAreaService.storeObservable.pipe(
      filter(ta => ta != null),
      filterArray(ta => ta.impGeofootprintLocation != null && ta.isActive),
    ).subscribe(tradeAreas => this.store$.dispatch(new RenderTradeAreas({ tradeAreas })));

    this.setupAnalysisLevelGeoClearObservable();

  }

  private setupAnalysisLevelGeoClearObservable() {
    // the core sequence only fires when analysis level changes
    this.validAnalysisLevel$.pipe(
      // need to enlist the latest geos and isLoading flag
      withLatestFrom(this.impGeoService.storeObservable, this.stateService.applicationIsReady$),
      // halt the sequence if the project is loading
      filter(([, , isReady]) => isReady),
      // halt the sequence if there are no geos
      filter(([, geos]) => geos != null && geos.length > 0),
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
    console.log('Zooming');
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
          err => { this.logger.error.log('Error getting lats and longs from layer', err); },
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
    this.logger.debug.log('Clearing all Geos');
    this.impTradeAreaService.startTx();
    this.impLocAttrService.remove(attrs);
    this.store$.dispatch( new ClearMapVars());
    this.store$.dispatch( new ClearGeoVars());
    this.store$.dispatch( new ClearAudienceStats());
    this.impVarService.clearAll();
    this.appGeoService.clearAll();
    this.impTradeAreaService.remove(allTradeAreas.filter(ta => tradeAreasToRemove.has(TradeAreaTypeCodes.parse(ta.taType))));
    this.impTradeAreaService.stopTx();
  }

  private calculateStatsAndZoom(latitudes: number[], longitudes: number[]) : void {
    const xStats = calculateStatistics(longitudes);
    const yStats = calculateStatistics(latitudes);
    this.esriMapService.zoomOnMap(xStats, yStats, latitudes.length).subscribe();
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

  public applyCustomTradeArea(data: TradeAreaDefinition[]){
    this.uploadFailures = [];
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

  public setCurrentDefaults(){
    const loc = this.impLocationService.get();
    const tradeAreas = this.impTradeAreaService.get();

    const tas: { radius: number, selected: boolean }[] = [];
    if (loc.length > 0 &&  loc != null && loc[0].radius1 == null && loc[0].radius2 == null && loc[0].radius3 == null){
      const siteType = ImpClientLocationTypeCodes.markSuccessful(ImpClientLocationTypeCodes.parse(loc[0].clientLocationTypeCode));
      const radiusSet = new Set<Number>();
      //tradeAreas.forEach(ta => radiusSet.add(ta.taRadius));
       tradeAreas.forEach(ta => {
         if (ta.taType.toUpperCase() === TradeAreaTypeCodes.Radius.toUpperCase()){
           radiusSet.add(ta.taRadius);
         }
       });
      const radiusArray = Array.from(radiusSet).sort((a, b) => Number(a) - Number(b));
      if (radiusSet.size > 0){
        radiusArray.forEach(radius => {
          tas.push({radius: Number(radius), selected: true});
        });
        this.currentDefaults.set(siteType, tas);
      }
    }

  }
}
