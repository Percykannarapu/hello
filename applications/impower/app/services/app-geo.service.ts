import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import {
  arrayToSet,
  filterArray,
  groupByExtended,
  isEmpty,
  isNil,
  mergeArrayMaps,
  reduceConcat,
  simpleFlatten,
  toUniversalCoordinates
} from '@val/common';
import { EsriConfigService, EsriMapService, EsriQueryService, EsriUtils, LayerTypes } from '@val/esri';
import { ErrorNotification, StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { combineLatest, EMPTY, merge, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, reduce, switchMap, take, withLatestFrom } from 'rxjs/operators';
import { ImpClientLocationTypeCodes, TradeAreaTypeCodes } from '../../worker-shared/data-model/impower.data-model.enums';
import { AppConfig } from '../app.config';
import { AnalysisLevel, ProjectFilterChanged } from '../common/models/ui-enums';
import { quadPartitionLocations } from '../common/quad-tree';
import {
  ClearGeoAttributes,
  DeleteGeoAttributes,
  UpsertGeoAttributes
} from '../impower-datastore/state/transient/geo-attributes/geo-attributes.actions';
import { GeoAttribute } from '../impower-datastore/state/transient/geo-attributes/geo-attributes.model';
import { FullAppState } from '../state/app.interfaces';
import { FiltersChanged } from '../state/data-shim/data-shim.actions';
import { projectIsReady } from '../state/data-shim/data-shim.selectors';
import { InTransaction } from '../val-modules/common/services/datastore.service';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpDomainFactoryService } from '../val-modules/targeting/services/imp-domain-factory.service';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocAttribService } from '../val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { AppLoggingService } from './app-logging.service';
import { AppStateService, Season } from './app-state.service';

interface AttributeDistance {
  attribute: any;
  distance: number;
}

interface FeatureAttribute {
  geocode: string;
  [k: string] : any;
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

  public allMustCovers$: Observable<string[]>;
  private processingMustCovers: boolean = false;

  constructor(private appStateService: AppStateService,
              private locationService: ImpGeofootprintLocationService,
              private locationAttrService: ImpGeofootprintLocAttribService,
              private tradeAreaService: ImpGeofootprintTradeAreaService,
              private impGeoService: ImpGeofootprintGeoService,
              private esriConfig: EsriConfigService,
              private queryService: EsriQueryService,
              private mapService: EsriMapService,
              private config: AppConfig,
              private domainFactory: ImpDomainFactoryService,
              private store$: Store<FullAppState>,
              private logger: AppLoggingService) {
    this.currentGeos$ = this.impGeoService.storeObservable;
    this.allMustCovers$ = this.impGeoService.allMustCoverBS$.asObservable();

    this.appStateService.applicationIsReady$.pipe(
      filter(ready => ready && !this.config.isBatchMode),
      take(1)
    ).subscribe(() => {
      this.setupRadiusSelectionObservable();
      this.setupFilterGeosObservable();

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

      this.impGeoService.storeObservable.pipe(
        debounceTime(250)
      ).subscribe((geos: ImpGeofootprintGeo[]) => {
        this.impGeoService.calculateGeoRanks();
        this.logger.debug.tableArray('Geo Rank and Owner data', geos, null,
            g => ({ geocode: g.geocode, rank: g.rank, dist: g.distance, owner: g.ownerSite, attachedTo: g.impGeofootprintLocation.locationNumber }));
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
      withLatestFrom(this.appStateService.season$, this.appStateService.analysisLevel$)
    ).subscribe(([tradeAreas, season, al]) => this.selectAndPersistRadiusGeos(tradeAreas, season, al));

    root$.pipe(
      filterArray(ta => ta.impGeofootprintLocation.clientLocationTypeCode === ImpClientLocationTypeCodes.Competitor),
      filter(tradeAreas => tradeAreas.length > 0)
    ).subscribe(tradeAreas => this.finalizeTradeAreas(tradeAreas));
  }

  private selectAndPersistRadiusGeos(tradeAreas: ImpGeofootprintTradeArea[], season: Season, analysisLevel: string) : void {
    const centroidAttrs = ['geocode', 'longitude', 'latitude', 'hhld_s', 'hhld_w'];
    const key = 'selectAndPersistRadiusGeos';
    this.store$.dispatch(new StartBusyIndicator({key, message: 'Calculating Radius Trade Areas...'}));

    const layerUrl = this.esriConfig.getLayerUrl(this.appStateService.analysisLevel$.getValue(), LayerTypes.Point, false);
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
        this.queryService.queryPointWithBuffer(layerUrl, toUniversalCoordinates(currentChunk), maxRadius, false, centroidAttrs)
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
          this.ensureMustCoversObs().subscribe(results => {
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
    const centroidAttrs = ['geocode', 'longitude', 'latitude', 'hhld_s', 'hhld_w'];
    const key = 'selectAndPersistHomeGeos';
    this.store$.dispatch(new StartBusyIndicator({key, message: `Selecting Home ${analysisLevel}s...`}));

    const primaryTradeAreaTypes = new Set<TradeAreaTypeCodes>([TradeAreaTypeCodes.Audience, TradeAreaTypeCodes.Custom]);
    const locs = locations.filter(loc => loc.impGeofootprintTradeAreas.some(ta => primaryTradeAreaTypes.has(TradeAreaTypeCodes.parse(ta.taType)) ||
        (TradeAreaTypeCodes.parse(ta.taType) === TradeAreaTypeCodes.Radius && ta['isComplete'] === true)) &&
        loc.impGeofootprintLocAttribs.filter(a => a.attributeCode === 'Invalid Home Geo' && a.attributeValue === 'Y').length === 0 &&
        loc.getImpGeofootprintGeos().filter(geo => geo.geocode === loc.homeGeocode).length === 0 &&
        loc.clientLocationTypeCode === 'Site');

    this.logger.debug.log('Firing home geo selection', locs.length);
    const layerUrl = this.esriConfig.getLayerUrl(AnalysisLevel.parse(analysisLevel), LayerTypes.Point, false);
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
        const currentQuery = this.queryService.queryAttributeIn(layerUrl, 'geocode', chunk.map(l => l.homeGeocode), false, centroidAttrs).pipe(
          reduce((acc, result) => acc.concat(result), [] as __esri.Graphic[]),
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
          this.store$.dispatch(ErrorNotification({ notificationTitle: 'Home Geocode Error', message , additionalErrorInfo: result.invalidLocations }));
        }
        this.store$.dispatch(new StopBusyIndicator({key}));
      }, err => {
        this.store$.dispatch(ErrorNotification({
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
      this.store$.dispatch(ErrorNotification({notificationTitle: 'Home Geocode Error', message , additionalErrorInfo: locationsMissingHomeGeo}));
    }
    if (locationsWithHomeGeo.length === 0) this.store$.dispatch(new StopBusyIndicator({key}));
  }

  public clearAllGeos(keepRadiusGeos: boolean, keepCustomGeos: boolean, keepForcedHomeGeos: boolean) {
    // also removes all vars and trade areas (except Radius and Audience)
    const allTradeAreas = this.tradeAreaService.get();
    const radiusTradeAreas = allTradeAreas.filter(ta => ta.taType === 'RADIUS');
    const customTradeAreas = allTradeAreas.filter(ta => ta.taType === 'CUSTOM');
    const forcedTradeAreas = allTradeAreas.filter(ta => ta.taType === 'HOMEGEO');
    const otherTradeAreas = allTradeAreas.filter(ta => !['RADIUS', 'AUDIENCE', 'CUSTOM'].includes(ta.taType));
    const tradeAreasToClear = [...otherTradeAreas];
    const tradeAreasToDelete = [...otherTradeAreas];
    if (!keepRadiusGeos) tradeAreasToClear.push(...radiusTradeAreas);
    if (!keepCustomGeos) {
      tradeAreasToClear.push(...customTradeAreas);
      tradeAreasToDelete.push(...customTradeAreas);
    }
    if (!keepForcedHomeGeos) {
      tradeAreasToClear.push(...forcedTradeAreas);
      tradeAreasToDelete.push(...forcedTradeAreas);
    }
    const geosToDelete = simpleFlatten(tradeAreasToClear.map(ta => ta.impGeofootprintGeos));

    this.deleteGeos(geosToDelete);
    tradeAreasToClear.forEach(ta => {
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
    const attributeErrors: any[] = [];
    locations.forEach(loc => {
      const currentTas = loc.impGeofootprintTradeAreas.filter(ta => tradeAreaSet.has(ta));
      const maxRadiusForLocation = Math.max(...currentTas.map(ta => ta.taRadius));
      currentAttributes.forEach(attributes => {
        if (isNil(attributes.longitude) || isNil(attributes.latitude)) {
          attributeErrors.push(attributes);
        } else {
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
        }
      });
    });
    if (attributeErrors.length > 0) this.logger.warn.log('These layer attributes have errors:', attributeErrors);
    return locationToCentroidMap;
  }

  private createGeosToPersist(locationMap: Map<ImpGeofootprintLocation, AttributeDistance[]>, tradeAreaSet: Set<ImpGeofootprintTradeArea>, season: Season) : ImpGeofootprintGeo[] {
    const hhcField = season === Season.Summer ? 'hhld_s' : 'hhld_w';
    const geosToSave: ImpGeofootprintGeo[] = [];
    const allAttributes: GeoAttribute[] = [];
    const uniqueIdentifiedGeocodeSet = new Set(this.appStateService.uniqueIdentifiedGeocodes$.getValue());
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
            if (!geoSet.has(currentAttribute.geocode) && !uniqueIdentifiedGeocodeSet.has(currentAttribute.geocode)) {
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
    const forceHomeGeoFlag = JSON.parse(impProjectPref.largeVal);
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
            if (forceHomeGeoFlag){
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
   */
  private ensureMustCoversObs() : Observable<ImpGeofootprintGeo[]> {
    if (this.processingMustCovers)
      return EMPTY;

    // Remove existing must cover trade areas
    const uniqueGeos = arrayToSet(this.appStateService.uniqueIdentifiedGeocodes$.getValue());
    const activeUniqueGeos = arrayToSet(this.appStateService.uniqueSelectedGeocodes$.getValue());
    const mustCoverSet = arrayToSet(this.impGeoService.mustCovers);
    const locations = this.appStateService.currentProject$.getValue().getImpGeofootprintLocations(true, ImpClientLocationTypeCodes.Site);
    const tradeAreasToDelete = this.tradeAreaService.get().filter(ta => ta.taType.toUpperCase() === TradeAreaTypeCodes.MustCover.toUpperCase());
    tradeAreasToDelete.forEach(ta => {
      ta.impGeofootprintGeos.forEach(mcg => {
        uniqueGeos.delete(mcg.geocode);
        activeUniqueGeos.delete(mcg.geocode);
      });
      this.impGeoService.remove(ta.impGeofootprintGeos);
      const index = ta.impGeofootprintLocation.impGeofootprintTradeAreas.indexOf(ta);
      ta.impGeofootprintLocation.impGeofootprintTradeAreas.splice(index, 1);
      ta.impGeofootprintLocation = null;
    });
    this.tradeAreaService.remove(tradeAreasToDelete, InTransaction.silent);

    // Determine which must covers are not in the list of geos
    const diff = this.impGeoService.mustCovers.filter(x => !uniqueGeos.has(x));

    // ensure mustcover are active
    this.impGeoService.get().forEach(geo => {
      if (mustCoverSet.has(geo.geocode) && !activeUniqueGeos.has(geo.geocode)) {
        geo.isActive = true;
      }
    });

    return new Observable<ImpGeofootprintGeo[]>(observer => {
      try {
        if (isEmpty(this.impGeoService.mustCovers) || isEmpty(diff) || isEmpty(locations)) {
          this.logger.debug.log('ensureMustCoversObs - Must cover criteria not met, ending observable');
          observer.complete();
          this.processingMustCovers = false;
        } else {
          this.logger.debug.log('ensureMustCoverObs - ' + diff.length + ' geos not covered.');
          this.processingMustCovers = true;
          const impGeofootprintGeos: ImpGeofootprintGeo[] = [];
          const newTradeAreas: ImpGeofootprintTradeArea[] = [];
          this.getGeoAttributesObs(diff).subscribe(
            results => {
              results.forEach(geoAttrib => {
                if (!uniqueGeos.has(geoAttrib.geocode)) {
                  // Assign to the nearest location
                  let closestLocation: ImpGeofootprintLocation = locations[0];
                  let minDistance: number = Number.MAX_VALUE;
                  locations.forEach(loc => {
                    const distanceToSite = EsriUtils.getDistance(geoAttrib['longitude'], geoAttrib['latitude'], loc.xcoord, loc.ycoord);
                    if (distanceToSite < minDistance) {
                      minDistance = distanceToSite;
                      closestLocation = loc;
                    }
                  });

                  // Assign to a new or existing MUSTCOVER trade area
                  const mustCoverTA: ImpGeofootprintTradeArea[] = closestLocation.impGeofootprintTradeAreas.filter(ta => ta.taType.toUpperCase() === TradeAreaTypeCodes.MustCover.toUpperCase());
                  if (mustCoverTA.length === 0) {
                    const newTA = this.domainFactory.createTradeArea(closestLocation, TradeAreaTypeCodes.MustCover);
                    newTA.taName = 'Must cover geographies not in an existing trade area';
                    mustCoverTA.push(newTA);
                    newTradeAreas.push(newTA);
                  }

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
                  mustCoverTA[0].impGeofootprintGeos ??= [];
                  mustCoverTA[0].impGeofootprintGeos.push(newGeo);
                  impGeofootprintGeos.push(newGeo);
                }
              });
              // Alert the subscribers that there are new geographies
              observer.next(impGeofootprintGeos);
            }
            , err => {
              this.logger.error.log('There was an error querying the ArcGIS layer for must covers', err);
              observer.error(err);
              this.processingMustCovers = false;
            }
            , () => {
              // Add any new trade areas created for must covers
              if (newTradeAreas.length > 0) this.tradeAreaService.add(newTradeAreas);

              this.logger.debug.log('New must cover geos(' + impGeofootprintGeos.length + '): ');
              if (impGeofootprintGeos.length > 0) this.logger.debug.logArray('Must cover geos added', impGeofootprintGeos, null, g => g.geocode);
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
      return;
    }
    this.logger.debug.log('ensureMustCovers fired');
    const geosToPersist: Array<ImpGeofootprintGeo> = [];
    const key = 'ensureMustCovers';
    this.store$.dispatch(new StartBusyIndicator({key: key, message: 'Applying Must Cover'}));
    // Add the must covers to geosToPersist
    this.ensureMustCoversObs().subscribe(results => {
        results.forEach(result => geosToPersist.push(result));
      }
      , err => {
        this.logger.error.log('Error in ensureMustCovers(): ', err);
        this.store$.dispatch(ErrorNotification({message: 'There was an error creating must covers'}));
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
   * Returns an observable for the retrieval of attributes for an array of geocodes
   * @param geocodes Array of geocodes to retrieve attributes for
   */
  public getGeoAttributesObs(geocodes: string[]) : Observable<FeatureAttribute[]> {
    const currentAnalysisLevel = this.appStateService.analysisLevel$.getValue();
    const layerUrl = this.esriConfig.getLayerUrl(currentAnalysisLevel, LayerTypes.Point, false);

    return this.queryService.queryAttributeIn(layerUrl, 'geocode', geocodes, false, ['geocode', 'latitude', 'longitude']).pipe(
      map(graphics => graphics.map(g => g.attributes)),
      reduceConcat()
    );
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

  public zoomToGeocode(geocode: string) {
    const currentAnalysisLevel = this.appStateService.analysisLevel$.getValue();
    const portalLayerId = this.esriConfig.getAnalysisBoundaryUrl(currentAnalysisLevel, true);
    this.queryService.queryAttributeIn(portalLayerId, 'geocode', [geocode], true).pipe(
      take(1),
      switchMap(result => this.mapService.zoomToPolys(result, 0.2))
    ).subscribe();
  }
}
