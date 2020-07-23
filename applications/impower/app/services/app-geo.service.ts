import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { filterArray, groupByExtended, mergeArrayMaps, simpleFlatten, toUniversalCoordinates } from '@val/common';
import { EsriLayerService, EsriQueryService, EsriUtils } from '@val/esri';
import { ErrorNotification, StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { ConfirmationService } from 'primeng/api';
import { combineLatest, EMPTY, merge, Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, reduce, take, withLatestFrom } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import {
  ClearGeoAttributes,
  DeleteGeoAttributes,
  UpsertGeoAttributes
} from '../impower-datastore/state/transient/geo-attributes/geo-attributes.actions';
import { GeoAttribute } from '../impower-datastore/state/transient/geo-attributes/geo-attributes.model';
import { quadPartitionLocations } from '../models/quad-tree';
import { ProjectFilterChanged } from '../models/ui-enums';
import { FullAppState } from '../state/app.interfaces';
import { FiltersChanged } from '../state/data-shim/data-shim.actions';
import { deleteCustomTa, deleteMustCover, projectIsReady } from '../state/data-shim/data-shim.selectors';
import { InTransaction } from '../val-modules/common/services/datastore.service';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpProjectPref } from '../val-modules/targeting/models/ImpProjectPref';
import { ImpDomainFactoryService } from '../val-modules/targeting/services/imp-domain-factory.service';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocAttribService } from '../val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpGeofootprintVarService } from '../val-modules/targeting/services/ImpGeofootprintVar.service';
import { ImpClientLocationTypeCodes, TradeAreaTypeCodes } from '../val-modules/targeting/targeting.enums';
import { AppLoggingService } from './app-logging.service';
import { AppMapService } from './app-map.service';
import { AppProjectPrefService } from './app-project-pref.service';
import { AppStateService, Season } from './app-state.service';

const featureAttributes = ['geocode', 'latitude', 'longitude', 'cl2i00', 'cl0c00', 'cl2prh', 'tap049', 'hhld_w', 'hhld_s', 'num_ip_addrs', 'pob', 'owner_group_primary', 'cov_frequency', 'dma_name', 'cov_desc', 'city_name'];

interface AttributeDistance {
  attribute: any;
  distance: number;
}

interface HomeGeoProcessingResult {
  newGeos: ImpGeofootprintGeo[];
  newTradeAreas: ImpGeofootprintTradeArea[];
  invalidLocations: ImpGeofootprintLocation[];
}

@Injectable({
  providedIn: 'root'
})
export class AppGeoService {

  currentGeos$: Observable<ImpGeofootprintGeo[]>;

  private validAnalysisLevel$: Observable<string>;
  public allMustCovers$: Observable<string[]>;
  private processingMustCovers: boolean = false;

  constructor(private appStateService: AppStateService,
              private appMapService: AppMapService,
              private locationService: ImpGeofootprintLocationService,
              private locationAttrService: ImpGeofootprintLocAttribService,
              private tradeAreaService: ImpGeofootprintTradeAreaService,
              private varService: ImpGeofootprintVarService,
              private impGeoService: ImpGeofootprintGeoService,
              private appProjectPrefService: AppProjectPrefService,
              private layerService: EsriLayerService,
              private queryService: EsriQueryService,
              private config: AppConfig,
              private domainFactory: ImpDomainFactoryService,
              private store$: Store<FullAppState>,
              private logger: AppLoggingService,
              private confirmationService: ConfirmationService) {
    this.validAnalysisLevel$ = this.appStateService.analysisLevel$.pipe(filter(al => al != null && al.length > 0));
    this.currentGeos$ = this.impGeoService.storeObservable;
    this.allMustCovers$ = this.impGeoService.allMustCoverBS$.asObservable();

    this.appStateService.applicationIsReady$.pipe(
      filter(ready => ready && !this.config.isBatchMode),
      take(1)
    ).subscribe(() => {
      this.setupRadiusSelectionObservable();
      this.setupHomeGeoSelectionObservable();
      this.setupFilterGeosObservable();
      this.setupMapClickEventHandler();

      // Detect changes in must covers list and call ensureMustCovers
      const projectReady$ = this.store$.pipe(select(projectIsReady));
      this.allMustCovers$.pipe(
        withLatestFrom(projectReady$),
        filter(([, isReady]) => isReady)
      ).subscribe(() => {
        this.ensureMustCovers();
      });

      this.locationService.storeObservable.pipe(
        withLatestFrom(projectReady$),
        filter(([, isReady]) => isReady)
      ).subscribe(() => {
        this.ensureMustCovers();
      });

      // Detect new project
      this.appStateService.clearUI$.subscribe(() => {
        // Clear must covers
        this.impGeoService.clearMustCovers();
      });
    });
  }

  clearAll() : void {
    this.impGeoService.clearAll();
    this.store$.dispatch(new ClearGeoAttributes());
  }

  notify() : void {
    this.impGeoService.makeDirty();
  }

  public toggleGeoSelection(geocode: string, geometry: { x: number, y: number }, filterFlag?: boolean) {
    const allSelectedGeos = new Set(this.appStateService.uniqueSelectedGeocodes$.getValue());
    const allIdentifiedGeos = new Set(this.appStateService.uniqueIdentifiedGeocodes$.getValue());
    if (this.appMapService.selectedButton === 3 || this.appMapService.selectedButton === 8) {
      if ((allSelectedGeos.has(geocode) && this.appMapService.selectedButton !== 3) || (allIdentifiedGeos.has(geocode) && this.appMapService.selectedButton === 8)) {
        this.deselectGeosByGeocode(geocode);
      } else if (allIdentifiedGeos.has(geocode)) {
        if (this.appMapService.selectedButton !== 8 && filterFlag) {
          this.reactivateGeosByGeocode(geocode);
        }
      } else {
        if (this.appMapService.selectedButton !== 8) {
          (filterFlag !== null && filterFlag !== undefined) ? this.addGeoToManualTradeArea(geocode, geometry, filterFlag) : this.addGeoToManualTradeArea(geocode, geometry);
        }
      }
    } else if (this.appMapService.selectedButton === 1) {
      if (allSelectedGeos.has(geocode)) {
        this.deselectGeosByGeocode(geocode);
      } else if (allIdentifiedGeos.has(geocode) && filterFlag) {
        this.reactivateGeosByGeocode(geocode);
      } else if (!(allIdentifiedGeos.has(geocode))) {
        (filterFlag !== null && filterFlag !== undefined) ? this.addGeoToManualTradeArea(geocode, geometry, filterFlag) : this.addGeoToManualTradeArea(geocode, geometry);
      }
    }
  }

  public checkGeoOnSingleSelect(features: __esri.Graphic[]) : boolean {
    const layerId = this.config.getLayerIdForAnalysisLevel(this.appStateService.analysisLevel$.getValue());
    if (layerId == null || layerId.length === 0) return;
    const layer = this.layerService.getPortalLayerById(layerId);
    let singleSelectFlag: boolean = false;
    features.forEach(feature => {
      if (feature.layer === layer) {
        const geoFound = this.impGeoService.get().filter(geo => geo.geocode === feature.attributes.geocode);
        singleSelectFlag = (geoFound.length === 0) ? false : geoFound[0].isActive;
      }
    });
    return singleSelectFlag;
  }

  public deleteGeos(geos: ImpGeofootprintGeo[]) : void {
    if (geos == null || geos.length === 0) return;

    const tradeAreas = new Set<ImpGeofootprintTradeArea>(geos.map(g => g.impGeofootprintTradeArea));
    const geoSet = new Set<ImpGeofootprintGeo>(geos);
    const geocodes = new Set<string>(geos.map(g => g.geocode));
    // remove entities from the hierarchy
    tradeAreas.forEach(ta => ta.impGeofootprintGeos = ta.impGeofootprintGeos.filter(g => !geoSet.has(g)));
    geos.forEach(g => g.impGeofootprintTradeArea = null);
    // remove from data stores
    this.store$.dispatch(new DeleteGeoAttributes({ids: Array.from(geocodes)}));
    this.impGeoService.remove(geos);
  }

  /**
   * Sets up an observable sequence that fires when a new, empty Radius trade area appears in the data store.
   */
  private setupRadiusSelectionObservable() : void {
    const root$ = combineLatest([this.tradeAreaService.storeObservable, this.locationService.storeObservable]).pipe(
      withLatestFrom(this.appStateService.applicationIsReady$),
      // halt the sequence if the project is still loading
      filter(([, isReady]) => isReady),
      // flatten the data to a 1-dimension array
      map(([[tradeAreas]]) => tradeAreas),
      filterArray(ta => ta.isActive && ta.impGeofootprintGeos.length === 0 && ta['isComplete'] !== true)
    );

    root$.pipe(
      filterArray(ta => ta.impGeofootprintLocation.clientLocationTypeCode === ImpClientLocationTypeCodes.Site),
      filter(tradeAreas => tradeAreas.length > 0),
      withLatestFrom(this.appStateService.season$, this.validAnalysisLevel$)
    ).subscribe(([tradeAreas, season, al]) => this.selectAndPersistRadiusGeos(tradeAreas, season, al));

    root$.pipe(
      filterArray(ta => ta.impGeofootprintLocation.clientLocationTypeCode === ImpClientLocationTypeCodes.Competitor),
      filter(tradeAreas => tradeAreas.length > 0)
    ).subscribe(tradeAreas => this.finalizeTradeAreas(tradeAreas));
  }

  /**
   * Sets up an observable sequence that fires when a location is missing its home geo in any trade area
   */
  private setupHomeGeoSelectionObservable() : void {
    const primaryTradeAreaTypes = new Set<TradeAreaTypeCodes>([TradeAreaTypeCodes.Audience, TradeAreaTypeCodes.Custom]);
    this.impGeoService.storeObservable.pipe(
      withLatestFrom(this.appStateService.applicationIsReady$,
                     this.appStateService.allClientLocations$,
                     this.store$.select(deleteCustomTa),
                     this.store$.select(deleteMustCover)),
      filter(([, isReady, locs, isCustomTaExists, isMustCoverExists]) => isReady && locs.length > 0 && !isCustomTaExists && !isMustCoverExists),
      map(([, , locs]) => locs),
      filterArray(loc => loc.impGeofootprintTradeAreas.some(ta => primaryTradeAreaTypes.has(TradeAreaTypeCodes.parse(ta.taType)) ||
        (TradeAreaTypeCodes.parse(ta.taType) === TradeAreaTypeCodes.Radius && ta['isComplete'] === true)) &&
        loc.impGeofootprintLocAttribs.filter(a => a.attributeCode === 'Invalid Home Geo' && a.attributeValue === 'Y').length === 0 &&
        loc.getImpGeofootprintGeos().filter(geo => geo.geocode === loc.homeGeocode).length === 0 &&
        loc.clientLocationTypeCode === 'Site'),
      withLatestFrom(this.appStateService.season$, this.validAnalysisLevel$),
    ).subscribe(([locations, season, analysisLevel]) => {
     // this.selectAndPersistHomeGeos(locations, analysisLevel, season);
    });
  }

  private setupMapClickEventHandler() {
    this.appMapService.geoSelected$.pipe(
      filter(events => events != null && events.length > 0)
    ).subscribe(events => {
      events.forEach(event => {
        (event.filterFlag !== null && event.filterFlag !== undefined) ? this.toggleGeoSelection(event.geocode, event.geometry, event.filterFlag) : this.toggleGeoSelection(event.geocode, event.geometry);
      });
    });
  }

  private selectAndPersistRadiusGeos(tradeAreas: ImpGeofootprintTradeArea[], season: Season, analysisLevel: string) : void {
    const key = 'selectAndPersistRadiusGeos';
    this.store$.dispatch(new StartBusyIndicator({key, message: 'Calculating Radius Trade Areas...'}));

    const layerId = this.config.getLayerIdForAnalysisLevel(this.appStateService.analysisLevel$.getValue(), true);
    this.logger.debug.log('Select and Persist Radius Geos', tradeAreas.length);
    const allLocations = new Set(tradeAreas.map(ta => ta.impGeofootprintLocation));
    const locationChunks = quadPartitionLocations(Array.from(allLocations), analysisLevel);
    const queries: Observable<Map<ImpGeofootprintLocation, AttributeDistance[]>>[] = [];
    const tradeAreaSet = new Set(tradeAreas);
    const locationDistanceMap = new Map<ImpGeofootprintLocation, AttributeDistance[]>();
    this.logger.debug.log('Total number of location slices to process', locationChunks.length);
    for (const currentChunk of locationChunks) {
      const currentTas = simpleFlatten(currentChunk.map(l => l.impGeofootprintTradeAreas)).filter(ta => tradeAreaSet.has(ta));
      const maxRadius = Math.max(...currentTas.map(ta => ta.taRadius));
      queries.push(
        this.queryService.queryPointWithBuffer(layerId, toUniversalCoordinates(currentChunk), maxRadius, false, featureAttributes)
          .pipe(map(selections => this.calculateDistances(currentChunk, tradeAreaSet, selections)))
      );
    }
    merge(...queries, 4)
      .subscribe(
        currentMap => mergeArrayMaps(currentMap, locationDistanceMap),
        err => {
          this.logger.error.log(err);
          this.store$.dispatch(new StopBusyIndicator({key}));
        },
        () => {

          const geosToPersist = this.createGeosToPersist(locationDistanceMap, tradeAreaSet, season);
          this.impGeoService.add(geosToPersist);
          this.finalizeTradeAreas(tradeAreas);
          this.selectAndPersistHomeGeos(this.locationService.get(), analysisLevel, season);

          // Check the geo filters
          this.setupFilterGeosObservable();

          // Add the must covers to geosToPersist
          let mustCovers = [];
          this.ensureMustCoversObs(null, null).subscribe(results => {
              this.logger.debug.log('Adding ', results.length, ' must cover geos');
              mustCovers = mustCovers.concat(results);
            }
            , err => {
              this.logger.error.log('ERROR occurred ensuring must covers: ', err);
            }
            , () => {
              this.impGeoService.add(mustCovers);
              this.store$.dispatch(new StopBusyIndicator({key}));
            });
        });
  }

  public selectAndPersistHomeGeos(locations: ImpGeofootprintLocation[], analysisLevel: string, season: Season) : void {
    const key = 'selectAndPersistHomeGeos';
    const currentAnalysisLevel = this.appStateService.analysisLevel$.getValue();
    this.store$.dispatch(new StartBusyIndicator({key, message: `Selecting Home ${currentAnalysisLevel}s...`}));

    const primaryTradeAreaTypes = new Set<TradeAreaTypeCodes>([TradeAreaTypeCodes.Audience, TradeAreaTypeCodes.Custom]);
    const locs = locations.filter(loc => loc.impGeofootprintTradeAreas.some(ta => primaryTradeAreaTypes.has(TradeAreaTypeCodes.parse(ta.taType)) ||
        (TradeAreaTypeCodes.parse(ta.taType) === TradeAreaTypeCodes.Radius && ta['isComplete'] === true)) &&
        loc.impGeofootprintLocAttribs.filter(a => a.attributeCode === 'Invalid Home Geo' && a.attributeValue === 'Y').length === 0 &&
        loc.getImpGeofootprintGeos().filter(geo => geo.geocode === loc.homeGeocode).length === 0 &&
        loc.clientLocationTypeCode === 'Site');

    this.logger.debug.log('Firing home geo selection', locs.length);
    const layerId = this.config.getLayerIdForAnalysisLevel(currentAnalysisLevel, true);
    const locationsWithHomeGeo: ImpGeofootprintLocation[] = [];
    const locationsMissingHomeGeo: ImpGeofootprintLocation[] = [];
    locs.forEach(loc => {
      if (loc.homeGeocode == null || loc.homeGeocode.length === 0) {
        locationsMissingHomeGeo.push(loc);
      } else {
        locationsWithHomeGeo.push(loc);
      }
    });
    if (locationsWithHomeGeo.length > 0) {
      const locationChunks = quadPartitionLocations(Array.from(locationsWithHomeGeo), analysisLevel);
      const queries: Observable<HomeGeoProcessingResult>[] = [];
      locationChunks.forEach(chunk => {
        const currentQuery = this.queryService.queryAttributeIn(layerId, 'geocode', chunk.map(l => l.homeGeocode), false, featureAttributes).pipe(
          reduce((acc, result) => [...acc, ...result], [] as __esri.Graphic[]),
          map(graphics => this.createHomeGeos(graphics, chunk, season))
        );
        queries.push(currentQuery);
      });
      merge(...queries, 4).pipe(
        reduce((acc, current) => ({
            newGeos: [...acc.newGeos, ...current.newGeos],
            newTradeAreas: [...acc.newTradeAreas, ...current.newTradeAreas],
            invalidLocations: [...acc.invalidLocations, ...current.invalidLocations]
          }), { newGeos: [], newTradeAreas: [], invalidLocations: [] } as HomeGeoProcessingResult)
      ).subscribe(result => {
        if (result.newGeos.length > 0) {
          this.impGeoService.add(result.newGeos);
          this.impGeoService.makeDirty();
        }
        if (result.newTradeAreas.length > 0) {
          this.tradeAreaService.add(result.newTradeAreas);
          this.tradeAreaService.makeDirty();
        }
        if (result.invalidLocations.length > 0) {
          this.flagLocationsWithInvalidHomeGeos(result.invalidLocations);
          const message = result.invalidLocations.length > 1
            ? `There are ${result.invalidLocations.length} locations that have invalid Home Geocodes`
            : `There is ${result.invalidLocations.length} location that has an invalid Home Geocode`;
          this.store$.dispatch(new ErrorNotification({ notificationTitle: 'Home Geocode Error', message , additionalErrorInfo: result.invalidLocations }));
        }
        this.store$.dispatch(new StopBusyIndicator({key}));
      }, err => {
        this.store$.dispatch(new ErrorNotification({
          notificationTitle: 'Home Geocode Error',
          message: 'There was a fatal error during home geocode processing. See console for more details.',
          additionalErrorInfo: err
        }));
        this.store$.dispatch(new StopBusyIndicator({key}));
      });
    }
    if (locationsMissingHomeGeo.length > 0) {
      this.flagLocationsWithInvalidHomeGeos(locationsMissingHomeGeo);
      const message = locationsMissingHomeGeo.length > 1
        ? `There are ${locationsMissingHomeGeo.length} locations that have missing Home Geocodes`
        : `There is ${locationsMissingHomeGeo.length} location that has a missing Home Geocode`;
      this.store$.dispatch(new ErrorNotification({notificationTitle: 'Home Geocode Error', message , additionalErrorInfo: locationsMissingHomeGeo}));
    }
    if (locationsWithHomeGeo.length === 0) this.store$.dispatch(new StopBusyIndicator({key}));
  }

  public clearAllGeos(keepRadiusGeos: boolean, keepAudienceGeos: boolean, keepCustomGeos: boolean, keepForcedHomeGeos: boolean) {
    // also removes all vars and trade areas (except Radius and Audience)
    const allTradeAreas = this.tradeAreaService.get();
    const radiusTradeAreas = allTradeAreas.filter(ta => ta.taType === 'RADIUS');
    const audienceTradeAreas = allTradeAreas.filter(ta => ta.taType === 'AUDIENCE');
    const customTradeAreas = allTradeAreas.filter(ta => ta.taType === 'CUSTOM');
    const forcedTradeAreas = allTradeAreas.filter(ta => ta.taType === 'HOMEGEO');
    const otherTradeAreas = allTradeAreas.filter(ta => !['RADIUS', 'AUDIENCE', 'CUSTOM'].includes(ta.taType));
    const tradeAreasToClear = [...otherTradeAreas];
    const tradeAreasToDelete = [...otherTradeAreas];
    if (!keepRadiusGeos) tradeAreasToClear.push(...radiusTradeAreas);
    if (!keepAudienceGeos) {
      tradeAreasToClear.push(...audienceTradeAreas);
      tradeAreasToDelete.push(...audienceTradeAreas);
    }
    if (!keepCustomGeos) {
      tradeAreasToClear.push(...customTradeAreas);
      tradeAreasToDelete.push(...customTradeAreas);
    }
    if (!keepForcedHomeGeos) {
      tradeAreasToClear.push(...forcedTradeAreas);
      tradeAreasToDelete.push(...forcedTradeAreas);
    }
    const geosToDelete = simpleFlatten(tradeAreasToClear.map(ta => ta.impGeofootprintGeos));
    const varsToDelete = simpleFlatten(tradeAreasToClear.map(ta => ta.impGeofootprintVars));

    this.deleteGeos(geosToDelete);
    this.varService.remove(varsToDelete);
    tradeAreasToClear.forEach(ta => {
      ta.impGeofootprintVars = [];
      ta.impGeofootprintGeos = [];
      ta['isComplete'] = false;
    });
    tradeAreasToDelete.forEach(ta => {
      const index = ta.impGeofootprintLocation.impGeofootprintTradeAreas.indexOf(ta);
      ta.impGeofootprintLocation.impGeofootprintTradeAreas.splice(index, 1);
      ta.impGeofootprintLocation = null;
    });
    this.tradeAreaService.remove(tradeAreasToDelete);
  }

  private calculateDistances(locations: ImpGeofootprintLocation[], tradeAreaSet: Set<ImpGeofootprintTradeArea>, centroids: __esri.Graphic[]) : Map<ImpGeofootprintLocation, AttributeDistance[]> {
    const locationToCentroidMap = new Map<ImpGeofootprintLocation, AttributeDistance[]>();
    const currentAttributes = centroids.map(c => c.attributes);
    locations.forEach(loc => {
      const currentTas = loc.impGeofootprintTradeAreas.filter(ta => tradeAreaSet.has(ta));
      const maxRadiusForLocation = Math.max(...currentTas.map(ta => ta.taRadius));
      currentAttributes.forEach(attributes => {
        const currentDistance = EsriUtils.getDistance(attributes.longitude, attributes.latitude, loc.xcoord, loc.ycoord);
        if (currentDistance <= maxRadiusForLocation) {
          const result: AttributeDistance = {
            attribute: attributes,
            distance: currentDistance
          };
          if (locationToCentroidMap.has(loc)) {
            locationToCentroidMap.get(loc).push(result);
          } else {
            locationToCentroidMap.set(loc, [result]);
          }
        }
      });
    });
    return locationToCentroidMap;
  }

  private createGeosToPersist(locationMap: Map<ImpGeofootprintLocation, AttributeDistance[]>, tradeAreaSet: Set<ImpGeofootprintTradeArea>, season: Season) : ImpGeofootprintGeo[] {
    const hhcField = season === Season.Summer ? 'hhld_s' : 'hhld_w';
    const geosToSave: ImpGeofootprintGeo[] = [];
    const allAttributes: GeoAttribute[] = [];
    locationMap.forEach((attributes, location) => {
      const currentTas = location.impGeofootprintTradeAreas.filter(ta => tradeAreaSet.has(ta)).sort((a, b) => a.taRadius - b.taRadius);
      for (let i = 0; i < currentTas.length; ++i) {
        const geoSet = new Set<string>();
        for (const currentPoint of attributes) {
          const currentAttribute = currentPoint.attribute;
          const currentHHC = Number(currentAttribute == null ? null : currentAttribute[hhcField]);
          allAttributes.push(currentAttribute);
          const min = i === 0 ? -1 : currentTas[i - 1].taRadius;
          if (currentPoint.distance <= currentTas[i].taRadius && currentPoint.distance > min) {
            if (!geoSet.has(currentAttribute.geocode)) {
              const newGeo = this.domainFactory.createGeo(currentTas[i], currentAttribute.geocode, currentAttribute.longitude, currentAttribute.latitude, currentPoint.distance);
              geoSet.add(currentAttribute.geocode);
              newGeo.hhc = currentHHC;
              geosToSave.push(newGeo);
            }
          }
        }
      }
    });
    if (allAttributes.length > 0) this.store$.dispatch(new UpsertGeoAttributes({ geoAttributes: allAttributes }));
    this.logger.debug.log('Total geo count:', geosToSave.length);
    return geosToSave;
  }

  private finalizeTradeAreas(tradeAreas: ImpGeofootprintTradeArea[]) : void {
    // mark trade areas as completed, so Home Geo query can pick it up
    tradeAreas.forEach(ta => {
      if (!ta.hasOwnProperty('isComplete')) {
        Object.defineProperty(ta, 'isComplete', {
          enumerable: false,
          configurable: true,
          writable: true
        });
      }
      ta['isComplete'] = true;
    });
  }

  private createHomeGeos(homeFeatures: __esri.Graphic[], locations: ImpGeofootprintLocation[], season: Season) : HomeGeoProcessingResult {
    const result: HomeGeoProcessingResult = {
      newGeos: [],
      newTradeAreas: [],
      invalidLocations: []
    };
    const impProjectPref = this.appStateService.currentProject$.getValue().impProjectPrefs.filter(pref => pref.prefGroup === 'project-flags' && pref.pref === 'FORCE_HOMEGEO')[0];
    const newGeoAttributes: GeoAttribute[] = [];
    const hhcAttribute = season === Season.Summer ? 'hhld_s' : 'hhld_w';
    const homeFeatureMap = groupByExtended(homeFeatures, f => f.attributes['geocode']);
    if (homeFeatureMap.size === 0) {
      result.invalidLocations = locations;
    } else {
      locations.forEach(loc => {
        const currentFeature = (homeFeatureMap.get(loc.homeGeocode) || [])[0];
        if (currentFeature == null) {
          result.invalidLocations.push(loc);
        } else {
          if (!loc.getImpGeofootprintGeos().some(geo => geo.geocode === currentFeature.attributes['geocode'])) {
            const geocodeDistance: number = EsriUtils.getDistance(currentFeature.attributes['longitude'], currentFeature.attributes['latitude'], loc.xcoord, loc.ycoord);
            const existingTA = loc.impGeofootprintTradeAreas.filter(ta => ta.taType === 'HOMEGEO')[0];
            const homeGeoTA = existingTA == null ? this.domainFactory.createTradeArea(loc, TradeAreaTypeCodes.HomeGeo) : existingTA;
            if (JSON.parse(impProjectPref.largeVal)){
              if (existingTA == null) result.newTradeAreas.push(homeGeoTA);
              const newGeo = new ImpGeofootprintGeo({
                xcoord: currentFeature.attributes['longitude'],
                ycoord: currentFeature.attributes['latitude'],
                geocode: currentFeature.attributes['geocode'],
                hhc: currentFeature.attributes[hhcAttribute],
                distance: geocodeDistance,
                impGeofootprintLocation: homeGeoTA.impGeofootprintLocation,
                impGeofootprintTradeArea: homeGeoTA,
                isActive: homeGeoTA.isActive
              });
              homeGeoTA.impGeofootprintGeos.push(newGeo);
              result.newGeos.push(newGeo);
              newGeoAttributes.push(currentFeature.attributes);
            }
          }
        }
      });
    }
    if (newGeoAttributes.length > 0) this.store$.dispatch(new UpsertGeoAttributes({geoAttributes: newGeoAttributes}));

    return result;
  }

  private flagLocationsWithInvalidHomeGeos(locations: ImpGeofootprintLocation[]) : void {
    const newLocationAttributes = [];
    locations.forEach(l => {
      const attr1 = this.domainFactory.createLocationAttribute(l, 'Home Geocode Issue', 'Y');
      const attr2 = this.domainFactory.createLocationAttribute(l, 'Invalid Home Geo', 'Y');
      if (attr1 != null) newLocationAttributes.push(attr1);
      if (attr2 != null) newLocationAttributes.push(attr2);
    });
    if (locations.length > 0) {
      this.locationAttrService.add(newLocationAttributes);
      this.locationService.makeDirty();
    }
  }

  /**
   * Will check a list of geos against the must cover geographies.  When geographies from the
   * must cover list are not in the provided geos parameter, they will be created and assigned
   * to the closest location.  If that location does not yet have a Must Cover trade area, one will
   * be created.
   * The observable will return an array of ImpGeofootprintGeos.
   *
   * @param locations Array of locations that must cover geos can get assigned to
   * @param geos Array of existing geos to be compared against the must cover list
   */
  public ensureMustCoversObs(locations: ImpGeofootprintLocation[], geos: ImpGeofootprintGeo[]) : Observable<ImpGeofootprintGeo[]> {
    if (this.processingMustCovers)
      return EMPTY;

    // Remove existing must cover trade areas
    const tradeAreasToDelete = this.tradeAreaService.get().filter(ta => ta.taType === 'MUSTCOVER');
    tradeAreasToDelete.forEach(ta => {
      this.impGeoService.remove(ta.impGeofootprintGeos);
      const index = ta.impGeofootprintLocation.impGeofootprintTradeAreas.indexOf(ta);
      ta.impGeofootprintLocation.impGeofootprintTradeAreas.splice(index, 1);
      ta.impGeofootprintLocation = null;
    });
    this.tradeAreaService.remove(tradeAreasToDelete, InTransaction.silent);

    // Check all geos if none are provided
    if (geos == null || geos.length === 0) {
      geos = this.impGeoService.get();
      this.logger.debug.log('Checking all ' + geos.length + ' geos for must covers');
    } else
      this.logger.debug.log('Checking ' + geos.length + ' geos for must cover');

    //this.logger.debug.log("### ensureMustCoversObs removed ", tradeAreasToDelete.length, " trade areas");

    // If no locations provided, pull them all
    if (locations == null || locations.length === 0)
      locations = this.locationService.get();

    // Determine which must covers are not in the list of geos
    const diff = this.impGeoService.mustCovers.filter(x => !geos.map(geo => geo.geocode).includes(x));

    // ensure mustcover are active
      this.impGeoService.get().forEach(geo => {
      if (this.impGeoService.mustCovers.includes(geo.geocode))
      {
        geo.isActive = true;
      }
      });

      // Track the number of new must cover geos added
    let numNewGeos: number = 0;
    let newGeoList: string = '';

    return new Observable<ImpGeofootprintGeo[]>(observer => {
      try {
        if (this.impGeoService.mustCovers == null || this.impGeoService.mustCovers.length === 0 || diff == null || diff.length === 0 || locations == null || locations.length === 0) {
          this.logger.debug.log('ensureMustCoversObs - Must cover criteria not met, ending observable');
          // this.logger.debug.log("### this.impGeoService.mustCovers: " + ((this.impGeoService.mustCovers != null) ? this.impGeoService.mustCovers.length : null));
          // this.logger.debug.log("### diff: " + ((diff != null) ? diff.length : null));
          // this.logger.debug.log("### locations: " + ((locations != null) ? locations.length : null));
          observer.complete();
          this.processingMustCovers = false;
        } else {
          this.logger.debug.log('ensureMustCoverObs - ' + diff.length + ' geos not covered.');
          this.processingMustCovers = true;
          this.getGeoAttributesObs(diff).subscribe(
            results => {
              const impGeofootprintGeos: ImpGeofootprintGeo[] = [];
              const newTradeAreas: ImpGeofootprintTradeArea[] = [];

              results.forEach(geoAttrib => {
                //this.logger.debug.log("### ensureMustCoversObs creating ImpGeo for " + geoAttrib.geocode + ", x: ", geoAttrib["longitude"], ", y: ", geoAttrib["latitude"]);

                // Assign to the nearest location
                let closestLocation: ImpGeofootprintLocation = locations[0];
                let minDistance: number = Number.MAX_VALUE;
                locations.forEach(loc => {
                  const distanceToSite = EsriUtils.getDistance(geoAttrib['longitude'], geoAttrib['latitude'], loc.xcoord, loc.ycoord);
                  if (distanceToSite < minDistance) {
                    minDistance = distanceToSite;
                    closestLocation = loc;
                  }
                  // this.logger.debug.log("### location: ", loc.locationName + ", loc x: ", loc.xcoord, ", loc y: ", loc.ycoord, ", geo x: ", result.xcoord, ", geo y: ", result.ycoord, ", distance: ", distanceToSite);
                });
                //this.logger.debug.log("### ensureMustCoversObs - closest location to ", geoAttrib.geocode, " is ", closestLocation.locationName, " at ", minDistance);

                // Assign to a new or existing MUSTCOVER trade area
                const mustCoverTA: ImpGeofootprintTradeArea[] = closestLocation.impGeofootprintTradeAreas.filter(ta => ta.taType.toUpperCase() === TradeAreaTypeCodes.MustCover.toUpperCase());
                if (mustCoverTA.length === 0) {
                  const newTA = this.domainFactory.createTradeArea(closestLocation, TradeAreaTypeCodes.MustCover);
                  newTA.taName = 'Must cover geographies not in an existing trade area';
                  mustCoverTA.push(newTA);
                  newTradeAreas.push(newTA);
                }

                // Initialize the TA list of geos if necessary
                if (mustCoverTA[0].impGeofootprintGeos == null)
                  mustCoverTA[0].impGeofootprintGeos = [];

                // Create the geo that must be covered
                const newGeo = new ImpGeofootprintGeo({
                  geocode: geoAttrib.geocode,
                  xcoord: geoAttrib['longitude'],
                  ycoord: geoAttrib['latitude'],
                  impGeofootprintLocation: closestLocation,
                  impGeofootprintTradeArea: mustCoverTA[0],
                  distance: minDistance,
                  isActive: true
                });

                // Add the geo to the trade area and list of geos
                mustCoverTA[0].impGeofootprintGeos.push(newGeo);
                impGeofootprintGeos.push(newGeo);
                numNewGeos++;
                newGeoList = newGeoList.concat((newGeoList === '') ? '' : ', ', newGeo.geocode);
              });

              // Add any new trade areas created for must covers
              if (newTradeAreas.length > 0)
                this.tradeAreaService.add(newTradeAreas);

              // Alert the subscribers that there are new geographies
              observer.next(impGeofootprintGeos);
            }
            , err => {
              this.logger.error.log('There was an error querying the ArcGIS layer for must covers', err);
              observer.error(err);
              this.processingMustCovers = false;
            }
            , () => {
              // queryResult.forEach(geoAttrib => this.logger.debug.log ("### geoAttrib: ", geoAttrib));
              this.logger.debug.log('New must cover geos(' + numNewGeos + '): ');
              if (numNewGeos > 0) this.logger.debug.log('   ', newGeoList);
              observer.complete();
              this.processingMustCovers = false;
            }
          );
        }
      } catch (err) {
        observer.error(err);
        this.processingMustCovers = false;
      }
    });
  }

  public ensureMustCovers() {
    if (this.processingMustCovers) {
      // this.logger.debug.log("### mustCovers are already processing");
      return;
    }
    this.logger.debug.log('ensureMustCovers fired');
    const geosToPersist: Array<ImpGeofootprintGeo> = [];
    const key = 'ensureMustCovers';
    this.store$.dispatch(new StartBusyIndicator({key: key, message: 'Applying Must Cover'}));
    // Add the must covers to geosToPersist
    this.ensureMustCoversObs(null, null).subscribe(results => {
        //this.logger.debug.log("### ensureMustCovers is pushing " + ((results != null) ? results.length : 0) + " geos");
        results.forEach(result => geosToPersist.push(result));
      }
      , err => {
        this.logger.error.log('Error in ensureMustCovers(): ', err);
        this.store$.dispatch(new ErrorNotification({message: 'There was an error creating must covers'}));
        this.store$.dispatch(new StopBusyIndicator({key: key}));
      }
      , () => {
        if (geosToPersist.length > 0) {
          this.logger.debug.log('Adding', geosToPersist.length, 'must cover geographies to the data store');
          this.impGeoService.add(geosToPersist);
        } else
          this.logger.debug.log('No new must cover geographies');

        this.store$.dispatch(new StopBusyIndicator({key: key}));
      });
  }

  /**
   * After the project has loaded, this method will re-hydrate the must covers list
   * by getting and parsing the MUSTCOVER project prefs
   */
  public reloadMustCovers() {
    //this.logger.debug.log("### reloadMustCovers fired");
    let newMustCovers: string[] = [];
    try {
      const prefs: ImpProjectPref[] = this.appProjectPrefService.getPrefsByGroup('MUSTCOVER');
      //this.logger.debug.log("### prefs.Count = " + ((prefs != null) ? prefs.length : null));
      if (prefs != null) {
        //prefs.forEach(pref => this.logger.debug.log("### MUSTCOVER pref: " + pref.pref + " = " + pref.val));
        prefs.forEach(mustCoverPref => {
          const prefsVal = mustCoverPref.val == null ? mustCoverPref.largeVal : mustCoverPref.val;
          newMustCovers = [...newMustCovers, ...this.impGeoService.parseMustCoverString(prefsVal)];
        });
        this.impGeoService.setMustCovers(newMustCovers);
      }
      //this.logger.debug.log("### newMustCovers.count = " + newMustCovers.length);
      //this.impGeoService.mustCovers.forEach(mc => this.logger.debug.log("### MC: " + mc));
    } catch (e) {
      this.logger.error.log('Error loading must covers: ' + e);
    }
  }

  /**
   * Returns an observable for the retrieval of attributes for an array of geocodes
   * @param geocodes Array of geocodes to retrieve attributes for
   * @param attributesNames Array of attributes to retrieve, if not specified, a default set will be returned
   */
  public getGeoAttributesObs(geocodes: string[], attributesNames: string[] = featureAttributes) : Observable<Map<string, { geocode: string, attributes: Map<string, any> }>> {
    const currentAnalysisLevel = this.appStateService.analysisLevel$.getValue();
    const portalLayerId = this.config.getLayerIdForAnalysisLevel(currentAnalysisLevel);
    const queryResult = new Map<string, { latitude: number, longitude: number }>();

    return new Observable<Map<string, {geocode: string, attributes: Map<string, any>}>>(observer => {
      try {
        this.queryService.queryAttributeIn(portalLayerId, 'geocode', geocodes, false, attributesNames).pipe(
          map(graphics => graphics.map(g => g.attributes)),
        ).subscribe(results => {
            results.forEach(r => queryResult.set(r.geocode, r));
            // this.logger.debug.log("### getGeoAttributesObs.queryAttributeIn found " + results.length + " geo attributes");
            // results.forEach(r => this.logger.debug.log("### getGeoAttributesObs.queryAttributeIn - ", r));
            observer.next(results as any); // HACK for now
          }
          , err => {
            this.logger.error.log('There was an error querying the ArcGIS layer for geo attributes', err);
          }
          , () => {
            observer.complete();
          });
      } catch (err) {
        observer.error(err);
      }
    });
  }

  private deselectGeosByGeocode(geocode: string) : void {
    const geosToRemove = this.impGeoService.get().filter(geo => geo.geocode === geocode);
    const geosToDelete = new Set(geosToRemove.filter(geo => geo.impGeofootprintTradeArea.taType === 'MANUAL'));
    const geosToDeactivate = geosToRemove.filter(geo => !geosToDelete.has(geo));
    if (geosToDeactivate.length > 0) {
      geosToDeactivate.forEach(geo => geo.isActive = false);
      if (geosToDelete.size === 0) {
        this.impGeoService.makeDirty();
      }
    }
    if (geosToDelete.size > 0) {
      this.deleteGeos(Array.from(geosToDelete));
    }
  }

  public confirmMustCover(geo: ImpGeofootprintGeo, isSelected: boolean, isHomeGeo: boolean) {
    const commonGeos = this.impGeoService.get().filter(g => g.geocode === geo.geocode);
    if (isHomeGeo) {
      this.confirmationService.confirm({
        message: 'Are you sure you want to unselect a Must Cover & Home Geocode geography?',
        header: 'Must Cover/Home Geocode selection',
        acceptLabel: 'Yes',
        rejectLabel: 'No',
        accept: () => {
          commonGeos.forEach(dupGeo => dupGeo.isActive = isSelected);
          setTimeout(() => {
            this.impGeoService.makeDirty();
          }, 0);
          setTimeout(() => {
            this.impGeoService.makeDirty();
          }, 0);
        },
        reject: () => {
          geo.isActive = true;
          setTimeout(() => {
            this.impGeoService.makeDirty();
          }, 0);
          setTimeout(() => {
            this.impGeoService.makeDirty();
          }, 0);
        }
      });
    } else {
      this.confirmationService.confirm({
        message: 'Are you sure you want to unselect a Must Cover geography?',
        header: 'Must Cover selection',
        acceptLabel: 'Yes',
        rejectLabel: 'No',
        accept: () => {
          commonGeos.forEach(dupGeo => dupGeo.isActive = isSelected);
          setTimeout(() => {
            this.impGeoService.makeDirty();
          }, 0);
          setTimeout(() => {
            this.impGeoService.makeDirty();
          }, 0);
        },
        reject: () => {
          geo.isActive = true;
          setTimeout(() => {
            this.impGeoService.makeDirty();
          }, 0);
          setTimeout(() => {
            this.impGeoService.makeDirty();
          }, 0);
        }
      });

    }
  }

  private reactivateGeosByGeocode(geocode: string) : void {
    this.impGeoService.get()
      .filter(geo => geo.geocode === geocode)
      .forEach(geo => {
        geo.isActive = true;
      });
    this.impGeoService.update(null, null);
  }

  private addGeoToManualTradeArea(geocode: string, geometry: { x: number; y: number }, filterFlag?: boolean) : void {
    const locations = this.locationService.get().filter(loc => loc.clientLocationTypeCode === 'Site');
    let minDistance = Number.MAX_VALUE;
    const closestLocation = locations.reduce((previous, current) => {
      const currentDistance = EsriUtils.getDistance(current.xcoord, current.ycoord, geometry.x, geometry.y);
      if (currentDistance < minDistance) {
        minDistance = currentDistance;
        return current;
      } else {
        return previous;
      }
    }, null);
    if (closestLocation != null){
      let tradeArea = closestLocation.impGeofootprintTradeAreas.filter(ta => ta.taType === 'MANUAL')[0];
    if (tradeArea == null) {
      tradeArea = this.domainFactory.createTradeArea(closestLocation, TradeAreaTypeCodes.Manual);
      this.tradeAreaService.add([tradeArea]);
    }
    const newGeo = this.domainFactory.createGeo(tradeArea, geocode, geometry.x, geometry.y, minDistance);
    if (filterFlag !== null && filterFlag !== undefined) newGeo.isActive = filterFlag;
    this.impGeoService.add([newGeo]);
  }
}

  private setupFilterGeosObservable() : void {
    this.appStateService.currentProject$.pipe(
      filter((project) => project != null),
      map((project) => project.isIncludeValassis),
      distinctUntilChanged(),
    ).subscribe(() => this.store$.dispatch(new FiltersChanged({filterChanged: ProjectFilterChanged.Valassis})));

    this.appStateService.currentProject$.pipe(
      filter((project) => project != null),
      map((project) => project.isIncludeAnne),
      distinctUntilChanged(),
    ).subscribe(() => this.store$.dispatch(new FiltersChanged({filterChanged: ProjectFilterChanged.Anne})));

    this.appStateService.currentProject$.pipe(
      filter((project) => project != null),
      map((project) => project.isIncludeSolo),
      distinctUntilChanged(),
    ).subscribe(() => this.store$.dispatch(new FiltersChanged({filterChanged: ProjectFilterChanged.Solo})));

    this.appStateService.currentProject$.pipe(
      filter((project) => project != null),
      map((project) => project.isExcludePob),
      distinctUntilChanged(),
    ).subscribe(() => this.store$.dispatch(new FiltersChanged({filterChanged: ProjectFilterChanged.Pob})));
  }
}
