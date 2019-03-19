import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { filterArray, groupBy, mergeArrayMaps, simpleFlatten, toUniversalCoordinates, accumulateArrays } from '@val/common';
import { EsriQueryService, EsriUtils } from '@val/esri';
import { ErrorNotification, StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { combineLatest, merge, Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, withLatestFrom, tap, reduce } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { LocationQuadTree } from '../models/location-quad-tree';
import { LocalAppState } from '../state/app.interfaces';
import { InTransaction } from '../val-modules/common/services/datastore.service';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintGeoAttrib } from '../val-modules/targeting/models/ImpGeofootprintGeoAttrib';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpProjectPref } from '../val-modules/targeting/models/ImpProjectPref';
import { ImpDomainFactoryService } from '../val-modules/targeting/services/imp-domain-factory.service';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintGeoAttribService } from '../val-modules/targeting/services/ImpGeofootprintGeoAttribService';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocAttribService } from '../val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpGeofootprintVarService } from '../val-modules/targeting/services/ImpGeofootprintVar.service';
import { TradeAreaTypeCodes } from '../val-modules/targeting/targeting.enums';
import { AppLoggingService } from './app-logging.service';
import { AppMapService } from './app-map.service';
import { AppProjectPrefService } from './app-project-pref.service';
import { AppStateService, Season } from './app-state.service';

const boundaryAttributes = ['cl2i00', 'cl0c00', 'cl2prh', 'tap049', 'hhld_w', 'hhld_s', 'num_ip_addrs', 'geocode', 'pob', 'owner_group_primary', 'cov_frequency', 'dma_name', 'cov_desc', 'city_name'];
const centroidAttributes = ['geocode', 'latitude', 'longitude'];

interface AttributeDistance {
  attribute: any;
  distance: number;
}

@Injectable({
  providedIn: 'root'
})
export class AppGeoService {

  private validAnalysisLevel$: Observable<string>;
  public  allMustCovers$: Observable<string[]>;
  public  locMustCovers$: Observable<string[]>;
  private processingMustCovers: boolean = false;

  constructor(private appStateService: AppStateService,
              private appMapService: AppMapService,
              private locationService: ImpGeofootprintLocationService,
              private locationAttrService: ImpGeofootprintLocAttribService,
              private tradeAreaService: ImpGeofootprintTradeAreaService,
              private varService: ImpGeofootprintVarService,
              private impGeoService: ImpGeofootprintGeoService,
              private impAttributeService: ImpGeofootprintGeoAttribService,
              private appProjectPrefService: AppProjectPrefService,
              private queryService: EsriQueryService,
              private config: AppConfig,
              private domainFactory: ImpDomainFactoryService,
              private store$: Store<LocalAppState>,
              private logger: AppLoggingService) {
    this.validAnalysisLevel$ = this.appStateService.analysisLevel$.pipe(filter(al => al != null && al.length > 0));
    this.setupRadiusSelectionObservable();
    this.setupHomeGeoSelectionObservable();
    this.setupGeoAttributeUpdateObservable();
    this.setupFilterGeosObservable();
    this.setupMapClickEventHandler();

    // Detect changes in must covers list and call ensureMustCovers
    this.allMustCovers$ = this.impGeoService.allMustCoverBS$.asObservable();
    this.allMustCovers$.subscribe(mustCovers => {
       //mustCovers.forEach(mustCover => console.debug("### APP-GEO-SERVICE - allMustCoverObs - ", mustCover));
       this.ensureMustCovers();
    });

    this.locationService.storeObservable.subscribe(l => {
       this.ensureMustCovers();
    });

    // Detect new project
    this.appStateService.clearUI$.subscribe(() => {
       // Clear must covers
       this.impGeoService.clearMustCovers();
    });
  }

  clearAll() : void {
    this.impGeoService.clearAll();
    this.impAttributeService.clearAll();
  }

  public toggleGeoSelection(geocode: string, geometry: { x: number, y: number }) {
    const allSelectedGeos = new Set(this.appStateService.uniqueSelectedGeocodes$.getValue());
    const allIdentifiedGeos = new Set(this.appStateService.uniqueIdentifiedGeocodes$.getValue());
    if (allSelectedGeos.has(geocode) && this.appMapService.selectedButton !== 3) {
      this.deselectGeosByGeocode(geocode);
    } else if (allIdentifiedGeos.has(geocode)) {
      if (this.appMapService.selectedButton !== 8){
        this.reactivateGeosByGeocode(geocode);
      }
    } else {
      if (this.appMapService.selectedButton !== 8) {
        this.addGeoToManualTradeArea(geocode, geometry);
      }
    }
  }

  public deleteGeos(geos: ImpGeofootprintGeo[]) : void {
    if (geos == null || geos.length === 0) return;

    const tradeAreas = new Set<ImpGeofootprintTradeArea>(geos.map(g => g.impGeofootprintTradeArea));
    const geoSet = new Set<ImpGeofootprintGeo>(geos);
    // remove entities from the hierarchy
    tradeAreas.forEach(ta => ta.impGeofootprintGeos = ta.impGeofootprintGeos.filter(g => !geoSet.has(g)));
    geos.forEach(g => g.impGeofootprintTradeArea = null);
    // remove from data stores
    const attributes = simpleFlatten(geos.map(g => g.impGeofootprintGeoAttribs));
    geos.forEach(geo => geo.impGeofootprintGeoAttribs = []);
    if (attributes.length > 0) {
      attributes.forEach(a => a.impGeofootprintGeo = null);
      this.impAttributeService.remove(attributes);
    }
    this.impGeoService.remove(geos);
  }

  /**
   * Sets up an observable sequence that fires when a new, empty Radius trade area appears in the data store.
   */
  private setupRadiusSelectionObservable() : void {
    // The root sequence is Radius only trade areas for Sites (not competitors)
    this.tradeAreaService.storeObservable.pipe(
      withLatestFrom(this.appStateService.applicationIsReady$),
      // halt the sequence if the project is still loading
      filter(([tradeAreas, isReady]) => isReady),
      // flatten the data to a 1-dimension array
      map(([tradeAreas]) => tradeAreas),
      // keep all trade areas that have no geos and has not been marked complete
      map(tradeAreas => tradeAreas.filter(ta => ta.impGeofootprintGeos.length === 0 && ta['isComplete'] !== true)),
      // halt the sequence if there are no trade areas remaining at this point
      filter(tradeAreas => tradeAreas.length > 0),
    ).subscribe(tradeAreas => this.selectAndPersistRadiusGeos(tradeAreas));
  }

  /**
   * Sets up an observable sequence that fires when a location is missing its home geo in any trade area
   */
  private setupHomeGeoSelectionObservable() : void {
    const primaryTradeAreaTypes = new Set<TradeAreaTypeCodes>([TradeAreaTypeCodes.Audience, TradeAreaTypeCodes.Custom]);
    this.impGeoService.storeObservable.pipe(
      withLatestFrom(this.appStateService.applicationIsReady$, this.appStateService.allClientLocations$),
      filter(([geo, isReady, locs]) => isReady && locs.length > 0),
      map(([geo, isReady, locs]) => locs),
      filterArray(loc => loc.impGeofootprintTradeAreas.some(ta => primaryTradeAreaTypes.has(TradeAreaTypeCodes.parse(ta.taType)) ||
                                                                      (TradeAreaTypeCodes.parse(ta.taType) === TradeAreaTypeCodes.Radius && ta['isComplete'] === true)) &&
                              loc.impGeofootprintLocAttribs.filter(a => a.attributeCode === 'Invalid Home Geo' && a.attributeValue === 'Y').length === 0 &&
                              loc.getImpGeofootprintGeos().filter(geo => geo.geocode === loc.homeGeocode).length === 0)
    ).subscribe(locations => this.selectAndPersistHomeGeos(locations));
  }
  /**
   * Sets up an observable sequence that fires when any geocode is added to the data store
   */
  private setupGeoAttributeUpdateObservable() : void {
    combineLatest(this.impGeoService.storeObservable, this.appStateService.applicationIsReady$)
      .pipe(
        // halt the sequence if the project is loading
        filter(([geos, isReady]) => isReady),
        map(([geos]) => geos.filter(g => g.impGeofootprintGeoAttribs.filter(a => boundaryAttributes.includes(a.attributeCode)).length === 0)),
        filter(geos => geos.length > 0),
        withLatestFrom(this.validAnalysisLevel$)
      ).subscribe(
        ([geos, analysisLevel]) => this.updateAttributesFromLayer(geos, analysisLevel)
        );
  }

  private setupMapClickEventHandler() {
    this.appMapService.geoSelected$.pipe(
      filter(events => events != null && events.length > 0)
    ).subscribe(events => {
      events.forEach(event => {
        this.toggleGeoSelection(event.geocode, event.geometry);
      });
    });
  }

  private updateAttributesFromLayer(geos: ImpGeofootprintGeo[], analysisLevel: string) {
    const queryableGeos = geos.filter(g => g.impGeofootprintGeoAttribs.length < boundaryAttributes.length); // HACK: This is to detect anyone who hasn't gone through this particular query
    if (queryableGeos.length === 0) return;
    const key = 'GeoAttributeSelectionKey';
    this.store$.dispatch(new StartBusyIndicator({ key, message: 'Getting Attributes' }));
    const geocodes = new Set(queryableGeos.map(g => g.geocode));
    const portalId = this.config.getLayerIdForAnalysisLevel(analysisLevel);
    this.queryService.queryAttributeIn(portalId, 'geocode', Array.from(geocodes), false, boundaryAttributes).pipe(
      map(graphics => this.updateGeoAttributes(graphics.map(g => g.attributes))),
      reduce((acc, curr) => accumulateArrays(acc, curr))
    ).subscribe(
      attributes => {
        this.filterGeosOnFlags(geos.filter(geo => geo.impGeofootprintTradeArea != null && geo.impGeofootprintTradeArea.taType === 'RADIUS'));
        this.impAttributeService.add(attributes);
        this.store$.dispatch(new StopBusyIndicator({ key }));
      },
      err => {
        console.error(err);
        this.store$.dispatch(new ErrorNotification({ message: 'There was an error during geo selection' }));
        this.store$.dispatch(new StopBusyIndicator({ key }));
      });
  }

  private partitionLocations(locations: ImpGeofootprintLocation[]) : ImpGeofootprintLocation[][] {
    const quadTree = new LocationQuadTree(locations);
    const result = quadTree.partition(250, 500);
    this.logger.debug('QuadTree partitions', quadTree);
    return result.filter(chunk => chunk && chunk.length > 0);
  }

  private selectAndPersistRadiusGeos(tradeAreas: ImpGeofootprintTradeArea[]) : void {
    const layerId = this.config.getLayerIdForAnalysisLevel(this.appStateService.analysisLevel$.getValue(), false);
    this.logger.debug('Select and Persist Radius Geos', tradeAreas);
    const key = 'selectAndPersistRadiusGeos';
    const allLocations = new Set(tradeAreas.map(ta => ta.impGeofootprintLocation));
    const locationChunks = this.partitionLocations(Array.from(allLocations));
    const queries: Observable<Map<ImpGeofootprintLocation, AttributeDistance[]>>[] = [];
    const tradeAreaSet = new Set(tradeAreas);
    const locationDistanceMap = new Map<ImpGeofootprintLocation, AttributeDistance[]>();
    this.store$.dispatch(new StartBusyIndicator({ key, message: 'Calculating Trade Areas...' }));
    this.logger.debug('Total number of location slices to process', locationChunks.length);
    for (const currentChunk of locationChunks) {
      const currentTas = simpleFlatten(currentChunk.map(l => l.impGeofootprintTradeAreas)).filter(ta => tradeAreaSet.has(ta));
      const maxRadius = Math.max(...currentTas.map(ta => ta.taRadius));
      queries.push(
        this.queryService.queryPointWithBuffer(layerId, toUniversalCoordinates(currentChunk), maxRadius, false, centroidAttributes)
          .pipe(map(selections => this.calculateDistances(currentChunk, tradeAreaSet, selections)))
      );
    }
    merge(...queries, 4)
      .subscribe(
        currentMap => mergeArrayMaps(currentMap, locationDistanceMap),
        err => {
          console.error(err);
          this.store$.dispatch(new StopBusyIndicator({ key }));
        },
        () => {
            const geosToPersist = this.createGeosToPersist(locationDistanceMap, tradeAreaSet);
            this.finalizeTradeAreas(tradeAreas);

            // Add the must covers to geosToPersist
            this.ensureMustCoversObs(Array.from(locationDistanceMap.keys()), geosToPersist).subscribe(results => {
               results.forEach(result => {
                  console.log('Added ', results.length, ' must cover geos');
                  geosToPersist.push(result);
               });
            }
            , err => {console.log('ERROR occurred ensuring must covers: ', err); }
            , () => {
               this.impGeoService.add(geosToPersist);
               this.store$.dispatch(new StopBusyIndicator({ key }));
            });
        });
  }

  private selectAndPersistHomeGeos(locations: ImpGeofootprintLocation[]) : void {
    console.log('Firing home geo selection', locations);
    const layerId = this.config.getLayerIdForAnalysisLevel(this.appStateService.analysisLevel$.getValue(), false);
    const allSelectedData: __esri.Graphic[] = [];
    const key = 'selectAndPersistHomeGeos';
    const validLocations = locations.filter(l => l.homeGeocode != null && l.homeGeocode.length > 0);
    const invalidLocations = locations.filter(l => l.homeGeocode == null || l.homeGeocode.length === 0);
    if (validLocations.length > 0) {
      this.store$.dispatch(new StartBusyIndicator({ key, message: 'Calculating Trade Areas...' }));
      this.queryService.queryAttributeIn(layerId, 'geocode', validLocations.map(l => l.homeGeocode), false, centroidAttributes)
        .subscribe(
          selections => allSelectedData.push(...selections),
          err => {
            console.error(err);
            this.store$.dispatch(new StopBusyIndicator({ key }));
          },
          () => {
            const homeGeocodes = this.createHomeGeos(allSelectedData, locations);
            if (homeGeocodes.length > 0) {
              this.impGeoService.add(homeGeocodes);
            }
            this.store$.dispatch(new StopBusyIndicator({ key }));
          });
    }
    if (invalidLocations.length > 0) {
      this.flagLocationsWithInvalidHomeGeos(invalidLocations);
      this.store$.dispatch(new ErrorNotification({ notificationTitle: 'Home Geocode Error', message: `There were ${invalidLocations.length} location(s) that have an empty Home Geocode`, additionalErrorInfo: locations}));
    }
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

  private createGeosToPersist(locationMap: Map<ImpGeofootprintLocation, AttributeDistance[]>, tradeAreaSet: Set<ImpGeofootprintTradeArea>) : ImpGeofootprintGeo[] {
    const geosToSave: ImpGeofootprintGeo[] = [];
    const allAttributes = [];
    locationMap.forEach((attributes, location) => {
      const currentTas = location.impGeofootprintTradeAreas.filter(ta => tradeAreaSet.has(ta));
      for (let i = 0; i < currentTas.length; ++i) {
        const geoSet = new Set<string>();
        for (const currentPoint of attributes) {
          const currentAttribute = currentPoint.attribute;
          allAttributes.push(currentAttribute);
          const min = i === 0 ? -1 : currentTas[i - 1].taRadius;
          if (currentPoint.distance <= currentTas[i].taRadius && currentPoint.distance > min) {
            if (!geoSet.has(currentAttribute.geocode)) {
              const newGeo = this.domainFactory.createGeo(currentTas[i], currentAttribute.geocode, currentAttribute.longitude, currentAttribute.latitude, currentPoint.distance);
              geoSet.add(currentAttribute.geocode);
              geosToSave.push(newGeo);
            }
          }
        }
      }
    });
    this.logger.debug('Total geo count:', geosToSave.length);
    //this.updateGeoAttributes(allAttributes, geosToSave);
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

  private createHomeGeos(homeCentroids: __esri.Graphic[], locations: ImpGeofootprintLocation[]) : ImpGeofootprintGeo[] {
    const homeGeosToAdd: ImpGeofootprintGeo[] = [];
    const newTradeAreas: ImpGeofootprintTradeArea[] = [];
    const homeGeoMap: Map<string, ImpGeofootprintLocation[]> = groupBy(locations, 'homeGeocode');
    if (homeCentroids.length > 0 ) {
      homeCentroids.forEach(centroid => {
        if (homeGeoMap.has(centroid.attributes.geocode)) {
          const currentLocations = homeGeoMap.get(centroid.attributes.geocode);
          currentLocations.forEach(loc => {
            if (loc.getImpGeofootprintGeos().filter(geo => geo.geocode === centroid.attributes.geocode).length === 0) {
              const geocodeDistance: number = EsriUtils.getDistance(centroid.attributes.longitude, centroid.attributes.latitude, loc.xcoord, loc.ycoord);
              const homeGeoTA: ImpGeofootprintTradeArea[] = loc.impGeofootprintTradeAreas.filter(ta => ta.taType === 'HOMEGEO');
              if (homeGeoTA.length === 0) {
                const newTA = this.domainFactory.createTradeArea(loc, TradeAreaTypeCodes.HomeGeo);
                homeGeoTA.push(newTA);
                newTradeAreas.push(newTA);
              }
              const newGeo = new ImpGeofootprintGeo({
                xcoord: centroid.attributes.longitude,
                ycoord: centroid.attributes.latitude,
                geocode: centroid.attributes.geocode,
                distance: geocodeDistance,
                impGeofootprintLocation: homeGeoTA[0].impGeofootprintLocation,
                impGeofootprintTradeArea: homeGeoTA[0],
                isActive: homeGeoTA[0].isActive
              });
              homeGeoTA[0].impGeofootprintGeos.push(newGeo);
              homeGeosToAdd.push(newGeo);
            }
          });
        }
      });
    } else {
      this.flagLocationsWithInvalidHomeGeos(locations);
      this.store$.dispatch(new ErrorNotification({ notificationTitle: 'Home Geocode Error', message: `There were ${locations.length} location(s) that have invalid Home Geocodes`, additionalErrorInfo: locations}));
    }
    if (newTradeAreas.length > 0) this.tradeAreaService.add(newTradeAreas);
    return homeGeosToAdd;
  }

  private flagLocationsWithInvalidHomeGeos(locations: ImpGeofootprintLocation[]) : void {
    const newLocationAttributes = [];
    locations.forEach(l => {
      const attr1 = this.domainFactory.createLocationAttribute(l, 'Home Geocode Issue', 'Y');
      const attr2 = this.domainFactory.createLocationAttribute(l, 'Invalid Home Geo', 'Y');
      if (attr1 != null) newLocationAttributes.push(attr1);
      if (attr2 != null) newLocationAttributes.push(attr2);
    });
    if (locations.length > 0){
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
         return Observable.create(async observer => observer.complete());

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
      if (geos == null || geos.length === 0)
      {
         geos = this.impGeoService.get();
         console.log('Checking all ' + geos.length + ' geos for must covers');
      }
      else
         console.log('Checking ' + geos.length + ' geos for must cover');

      //console.debug("### ensureMustCoversObs removed ", tradeAreasToDelete.length, " trade areas");

      // If no locations provided, pull them all
      if (locations == null || locations.length === 0)
         locations = this.locationService.get();

      // Determine which must covers are not in the list of geos
      const diff = this.impGeoService.mustCovers.filter(x => !geos.map(geo => geo.geocode).includes(x));

      // Track the number of new must cover geos added
      let numNewGeos: number = 0;
      let newGeoList: string = '';

      return Observable.create(async observer => {
         try {
            if (this.impGeoService.mustCovers == null || this.impGeoService.mustCovers.length === 0 || diff == null || diff.length == 0 || locations == null || locations.length == 0)
            {
               console.debug('ensureMustCoversObs - Must cover criteria not met, ending observable');
               // console.debug("### this.impGeoService.mustCovers: " + ((this.impGeoService.mustCovers != null) ? this.impGeoService.mustCovers.length : null));
               // console.debug("### diff: " + ((diff != null) ? diff.length : null));
               // console.debug("### locations: " + ((locations != null) ? locations.length : null));
               observer.complete();
               this.processingMustCovers = false;
            }
            else
            {
               console.log("ensureMustCoverObs - " + ((diff != null) ? diff.length : 0) + " geos not covered.");
               this.processingMustCovers = true;
               this.getGeoAttributesObs(diff).subscribe(
                  results => {
                     const impGeofootprintGeos: ImpGeofootprintGeo[] = [];
                     const newTradeAreas: ImpGeofootprintTradeArea[] = [];

                     results.forEach(geoAttrib => {
                        //console.debug("### ensureMustCoversObs creating ImpGeo for " + geoAttrib.geocode + ", x: ", geoAttrib["longitude"], ", y: ", geoAttrib["latitude"]);

                        // Assign to the nearest location
                        let closestLocation: ImpGeofootprintLocation;
                        let minDistance: number = 999999;
                        locations.forEach(loc => {
                           const distanceToSite = EsriUtils.getDistance(geoAttrib['longitude'], geoAttrib['latitude'], loc.xcoord, loc.ycoord);
                           if (distanceToSite < minDistance) {
                              minDistance = distanceToSite;
                              closestLocation = loc;
                           }
                           // console.debug("### location: ", loc.locationName + ", loc x: ", loc.xcoord, ", loc y: ", loc.ycoord, ", geo x: ", result.xcoord, ", geo y: ", result.ycoord, ", distance: ", distanceToSite);
                        });
                        //console.debug("### ensureMustCoversObs - closest location to ", geoAttrib.geocode, " is ", closestLocation.locationName, " at ", minDistance);

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
                        const newGeo = new ImpGeofootprintGeo({geocode: geoAttrib.geocode,
                                                               xcoord:  geoAttrib['longitude'],
                                                               ycoord:  geoAttrib['latitude'],
                                                               impGeofootprintLocation: closestLocation,
                                                               impGeofootprintTradeArea: mustCoverTA[0],
                                                               distance: minDistance,
                                                               isActive: true});

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
                        console.log('There was an error querying the ArcGIS layer for must covers', err);
                        observer.error(err);
                        this.processingMustCovers = false;
                     }
                  , () => {
                        // queryResult.forEach(geoAttrib => console.log ("### geoAttrib: ", geoAttrib));
                        console.log('New must cover geos(' + numNewGeos + '): ');
                        if (numNewGeos > 0) console.log('   ', newGeoList);
                        observer.complete();
                        this.processingMustCovers = false;
                     }
               );
            }
         }
         catch (err) {
            observer.error(err);
            this.processingMustCovers = false;
         }
      });
   }

   public ensureMustCovers() {
      if (this.processingMustCovers) {
         // console.debug("### mustCovers are already processing");
         return;
      }
      console.debug("ensureMustCovers fired");
      const geosToPersist: Array<ImpGeofootprintGeo> = [];
      const key = 'ensureMustCovers';
      this.store$.dispatch(new StartBusyIndicator({ key: key, message: 'Ensuring Must Covers' }));
      // Add the must covers to geosToPersist
      this.ensureMustCoversObs(null, null).subscribe(results => {
         //console.debug("### ensureMustCovers is pushing " + ((results != null) ? results.length : 0) + " geos");
         results.forEach(result => geosToPersist.push(result));
      }
      , err => {
         console.error('Error in ensureMustCovers(): ', err);
         this.store$.dispatch(new ErrorNotification({ message: 'There was an error creating must covers' }));
         this.store$.dispatch(new StopBusyIndicator({ key: key }));
      }
      , () => {
         if (geosToPersist.length > 0) {
            console.log('Adding', geosToPersist.length, 'must cover geographies to the data store');
            this.impGeoService.add(geosToPersist);
         }
         else
            console.log('No new must cover geographies');

         this.store$.dispatch(new StopBusyIndicator({ key: key }));
      });
   }

   /**
    * After the project has loaded, this method will re-hydrate the must covers list
    * by getting and parsing the MUSTCOVER project prefs
    */
   public reloadMustCovers() {
      //console.debug("### reloadMustCovers fired");
      let newMustCovers: string[] = [];
      try {
         let prefs: ImpProjectPref[] = this.appProjectPrefService.getPrefsByGroup('MUSTCOVER');
         //console.debug("### prefs.Count = " + ((prefs != null) ? prefs.length : null));
         if (prefs != null)
         {
            //prefs.forEach(pref => console.debug("### MUSTCOVER pref: " + pref.pref + " = " + pref.val));
            prefs.forEach(mustCoverPref => newMustCovers = [...newMustCovers, ...this.impGeoService.parseMustCoverString(mustCoverPref.val)]);
            this.impGeoService.setMustCovers(newMustCovers);
         }
         //console.log("### newMustCovers.count = " + newMustCovers.length);
         //this.impGeoService.mustCovers.forEach(mc => console.log("### MC: " + mc));
      }
      catch (e) {
         console.error ("### Error loading must covers: " + e);
      }
   }

   /**
    * Returns an observable for the retrieval of attributes for an array of geocodes
    * @param geocodes Array of geocodes to retrieve attributes for
    * @param attributesNames Array of attributes to retrieve, if not specified, a default set will be returned
    */
   public getGeoAttributesObs(geocodes: string[], attributesNames: string[] = centroidAttributes) : Observable<Map<string, {geocode: string, attributes: Map<string, any>}>> {
      const currentAnalysisLevel = this.appStateService.analysisLevel$.getValue();
      const portalLayerId = this.config.getLayerIdForAnalysisLevel(currentAnalysisLevel);
      const queryResult = new Map<string, {latitude: number, longitude: number}>();

      return Observable.create(async observer => {
         try {
            this.queryService.queryAttributeIn(portalLayerId, 'geocode', geocodes, false, attributesNames).pipe(
               map(graphics => graphics.map(g => g.attributes)),
            ).subscribe(results => {
               results.forEach(r => queryResult.set(r.geocode, r));
               // console.log("### getGeoAttributesObs.queryAttributeIn found " + results.length + " geo attributes");
               // results.forEach(r => console.log("### getGeoAttributesObs.queryAttributeIn - ", r));
               observer.next(results);
            }
            , err => {
               console.log('There was an error querying the ArcGIS layer for geo attributes', err);
            }
            , () => {
               observer.complete();
            });
         }
         catch (err) {
           observer.error(err);
         }
      });
   }

  private filterValassisGeos(geos: ImpGeofootprintGeo[]) {
    console.log('Filtering Valassis Geos');
    const currentProject = this.appStateService.currentProject$.getValue();
    if (currentProject == null || geos == null || geos.length === 0) return;
    const includeValassis = currentProject.isIncludeValassis;
    const ownerGroupGeosMap: Map<string, ImpGeofootprintGeo[]> = groupBy(simpleFlatten(geos.map(g => g.impGeofootprintGeoAttribs.filter(a => a.attributeCode === 'owner_group_primary'))), 'attributeValue', attrib => attrib.impGeofootprintGeo);
    const audGeosMap: Map<string, ImpGeofootprintGeo[]> = groupBy(simpleFlatten(geos.map(g => g.impGeofootprintGeoAttribs.filter(a => a.attributeCode === 'preSelectedForAudience' && a.attributeValue === 'true'))), 'attributeValue', attrib => attrib.impGeofootprintGeo);
    const geoSet: Set<string> = new Set<string>();
     if(audGeosMap.has('true')) {
       audGeosMap.get('true').forEach(geo => geoSet.add(geo.geocode));
     }
    if (ownerGroupGeosMap.has('VALASSIS')) {
      ownerGroupGeosMap.get('VALASSIS').forEach(geo => {
        if(includeValassis){
          if(audGeosMap.size > 0 ){
          if(geoSet.has(geo.geocode)){
            geo.isActive = true;
            geo['filterReasons'] = null;
          } else{
            geo.isActive = false;
            geo['filterReasons'] = 'Under Audience TA threshold ';
          } 
        } else{
          geo.isActive = includeValassis;
          geo['filterReasons'] = null;
        }
        } else {
          geo.isActive = false;
          geo['filterReasons'] = 'Filtered because: VALASSIS';
        } 
      });
    }
  }

  private filterAnneGeos(geos: ImpGeofootprintGeo[]){
    console.log('Filtering ANNE Geos');
    const currentProject = this.appStateService.currentProject$.getValue();
    if (currentProject == null || geos == null || geos.length === 0) return;
    const includeAnne = currentProject.isIncludeAnne;
    const ownerGroupGeosMap: Map<string, ImpGeofootprintGeo[]> = groupBy(simpleFlatten(geos.map(g => g.impGeofootprintGeoAttribs.filter(a => a.attributeCode === 'owner_group_primary'))), 'attributeValue', attrib => attrib.impGeofootprintGeo);
    const audGeosMap: Map<string, ImpGeofootprintGeo[]> = groupBy(simpleFlatten(geos.map(g => g.impGeofootprintGeoAttribs.filter(a => a.attributeCode === 'preSelectedForAudience' && a.attributeValue === 'true'))), 'attributeValue', attrib => attrib.impGeofootprintGeo);
    const geoSet: Set<string> = new Set<string>();
     if(audGeosMap.has('true')) {
       audGeosMap.get('true').forEach(geo => geoSet.add(geo.geocode));
     }
     if (ownerGroupGeosMap.has('ANNE')) {
      ownerGroupGeosMap.get('ANNE').forEach(geo => {
        if(includeAnne){
          if(audGeosMap.size > 0){
          if(geoSet.has(geo.geocode)){
          geo.isActive = true;
          geo['filterReasons'] = null;
        } else{
          geo['filterReasons'] = 'Under Audience TA threshold';
          geo.isActive = false;
          }
          
        } else{
          geo.isActive = includeAnne;
          geo['filterReasons'] = null;
        }
      } else {
        geo.isActive = false;
        geo['filterReasons'] = 'Filtered because: ANNE';
      } 
    });
    }
  }

  private filterSoloGeos(geos: ImpGeofootprintGeo[]){
    console.log('Filtering SOLO Geos');
    const currentProject = this.appStateService.currentProject$.getValue();
    if (currentProject == null || geos == null || geos.length === 0) return;
    const includeSolo = currentProject.isIncludeSolo;
    const soloGeosMap: Map<string, ImpGeofootprintGeo[]> = groupBy(simpleFlatten(geos.map(g => g.impGeofootprintGeoAttribs.filter(a => a.attributeCode === 'cov_frequency'))), 'attributeValue', attrib => attrib.impGeofootprintGeo);
    const audGeosMap: Map<string, ImpGeofootprintGeo[]> = groupBy(simpleFlatten(geos.map(g => g.impGeofootprintGeoAttribs.filter(a => a.attributeCode === 'preSelectedForAudience' && a.attributeValue === 'true'))), 'attributeValue', attrib => attrib.impGeofootprintGeo);
    const geoSet: Set<string> = new Set<string>();
     if(audGeosMap.has('true')) {
       audGeosMap.get('true').forEach(geo => geoSet.add(geo.geocode));
     }
     if (soloGeosMap.has('Solo')) {
      soloGeosMap.get('Solo').forEach(geo => {
        if(includeSolo){
          if(audGeosMap.size > 0){
          if(geoSet.has(geo.geocode)){
          geo.isActive = true;
          geo['filterReasons'] = null;
        } else{
          geo['filterReasons'] = 'Under Audience TA threshold';
          geo.isActive = false;
          }
        } else{
          geo.isActive = includeSolo;
          geo['filterReasons'] = null;
        }
      } else {
        geo.isActive = false;
        geo['filterReasons'] = 'Filtered because: SOLO';
      } 
    });
    }
  }
  
  private filterPobGeos(geos: ImpGeofootprintGeo[]){
    console.log('Filtering POB Geos');
    const currentProject = this.appStateService.currentProject$.getValue();
    if (currentProject == null || geos == null || geos.length === 0) return;
    const includePob = !currentProject.isExcludePob;
    const pobGeosMap: Map<any, ImpGeofootprintGeo[]> = groupBy(simpleFlatten(geos.map(g => g.impGeofootprintGeoAttribs.filter(a => a.attributeCode === 'is_pob_only' || a.attributeCode === 'pob'))), 'attributeValue', attrib => attrib.impGeofootprintGeo);
    const audGeosMap: Map<string, ImpGeofootprintGeo[]> = groupBy(simpleFlatten(geos.map(g => g.impGeofootprintGeoAttribs.filter(a => a.attributeCode === 'preSelectedForAudience' && a.attributeValue === 'true'))), 'attributeValue', attrib => attrib.impGeofootprintGeo);
    const geoSet: Set<string> = new Set<string>();
     if(audGeosMap.has('true')) {
       audGeosMap.get('true').forEach(geo => geoSet.add(geo.geocode));
     }
     
     if (pobGeosMap.has('B') || pobGeosMap.has('1')) {
      const centroidPobs = pobGeosMap.get(1) || [];
      const topVarPobs = pobGeosMap.get('B') || [];
      const allPobs = [...centroidPobs, ...topVarPobs];
      allPobs.forEach(geo => {
      if(includePob){
        if(audGeosMap.size > 0){
          if(geoSet.has(geo.geocode)){
          geo.isActive = true;
          geo['filterReasons'] = null;
          } else{
          geo['filterReasons'] = 'Under Audience TA threshold';
          geo.isActive = false;
          }
        } else{
          geo.isActive = includePob;
          geo['filterReasons'] = null;
          }
      } else {
        geo.isActive = false;
        geo['filterReasons'] = 'Filtered because: POB';
        } 
      });
    }

  }

  private filterGeosImpl(geos: ImpGeofootprintGeo[]) {
    console.log('Filtering Geos Based on Flags');
    const currentProject = this.appStateService.currentProject$.getValue();
    if (currentProject == null || geos == null || geos.length === 0) return;
    this.filterValassisGeos(geos);
    this.filterAnneGeos(geos);
    this.filterSoloGeos(geos);
    this.filterPobGeos(geos);
    
  }

  public filterGeosOnFlags(geos: ImpGeofootprintGeo[]) {
    this.filterGeosImpl(geos);
    this.impGeoService.makeDirty();
    //this.impAttributeService.makeDirty();
  }

  private updateGeoAttributes(layerAttribute: any[], geos?: ImpGeofootprintGeo[]) : ImpGeofootprintGeoAttrib[] {
    const currentGeos = geos || this.impGeoService.get();
    const isSummer = this.appStateService.season$.getValue() === Season.Summer;
    const geoMap: Map<string, ImpGeofootprintGeo[]> = groupBy(currentGeos, 'geocode');
    const attributesToIgnore = new Set(['geocode', 'geometry_type']);
    const newAttributes: ImpGeofootprintGeoAttrib[] = [];
    for (const attribute of layerAttribute) {
      if (attribute.geocode && geoMap.has(attribute.geocode)) {
        geoMap.get(attribute.geocode).forEach(geo => {
          geo.hhc = Number(isSummer ? attribute.hhld_s : attribute.hhld_w);
          Object.entries(attribute).forEach(([k, v]: [string, any]) => {
            try {
              if (!attributesToIgnore.has(k)) {
                const newAttribute = this.domainFactory.createGeoAttribute(geo, k, v);
                if (newAttribute != null) {
                  newAttributes.push(newAttribute);
                }
              }
            } catch (err) {
              console.error('Error creating geo attribute: ', { err, geo, attribute });
            }
          });
        });
      }
    }
    return newAttributes;
  }

  private deselectGeosByGeocode(geocode: string) : void {
    const geosToRemove = this.impGeoService.get().filter(geo => geo.geocode === geocode);
    const geosToDelete = new Set(geosToRemove.filter(geo => geo.impGeofootprintTradeArea.taType === 'MANUAL'));
    const geosToDeactivate = geosToRemove.filter(geo => !geosToDelete.has(geo));
    if (geosToDeactivate.length > 0) {
      geosToDeactivate.forEach(geo => geo.isActive = false);
      if (geosToDelete.size === 0) {
        this.impAttributeService.makeDirty();
        this.impGeoService.makeDirty();
      }
    }
    if (geosToDelete.size > 0) {
      this.deleteGeos(Array.from(geosToDelete));
    }
  }

  private reactivateGeosByGeocode(geocode: string) : void {
    this.impGeoService.get()
      .filter(geo => geo.geocode === geocode)
      .forEach(geo => {
        geo.impGeofootprintGeoAttribs.forEach(a => a.isActive = true);
        geo.isActive = true;
      });
    this.impGeoService.update(null, null);
  }

  private addGeoToManualTradeArea(geocode: string, geometry: { x: number; y: number }) : void {
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
    let tradeArea = closestLocation.impGeofootprintTradeAreas.filter(ta => ta.taType === 'MANUAL')[0];
    if (tradeArea == null) {
      tradeArea = this.domainFactory.createTradeArea(closestLocation, TradeAreaTypeCodes.Manual);
      this.tradeAreaService.add([tradeArea]);
    }
    const newGeo = this.domainFactory.createGeo(tradeArea, geocode, geometry.x, geometry.y, minDistance);
    this.impGeoService.add([newGeo]);
  }

  private setupFilterGeosObservable() : void {

    const geos$ = this.impGeoService.storeObservable.pipe(
      filter(geos => geos != null && geos.length > 0),
      map(geos => geos.filter(geo => geo.impGeofootprintTradeArea.taType === 'RADIUS' || geo.impGeofootprintTradeArea.taType === 'AUDIENCE'))
      );
    
    const valassisFlag$ = this.appStateService.currentProject$.pipe(
      filter(project => project != null),
      map(project => project.isIncludeValassis),
      distinctUntilChanged(),
      withLatestFrom(geos$)
      ).subscribe(([flag, geos]) => {
            this.filterValassisGeos(geos);
            this.impGeoService.makeDirty();
      });

    const anneFlag$ = this.appStateService.currentProject$.pipe(
      filter(project => project != null),
      map(project => project.isIncludeAnne),
      distinctUntilChanged(),
      withLatestFrom(geos$)
      ).subscribe(([flag, geos]) => {
            this.filterAnneGeos(geos);
            this.impGeoService.makeDirty();
       });

    const soloFlag$ = this.appStateService.currentProject$.pipe(
      filter(project => project != null),
      map(project => project.isIncludeSolo),
      distinctUntilChanged(),
      withLatestFrom(geos$)
    ).subscribe(([flag, geos]) => {
          this.filterSoloGeos(geos);
          this.impGeoService.makeDirty();
    });
    
    const pobFlag$ = this.appStateService.currentProject$.pipe(
      filter(project => project != null),
      map(project => project.isExcludePob),
      distinctUntilChanged(),
      withLatestFrom(geos$)
      ).subscribe(([flag, geos]) => {
            this.filterPobGeos(geos);
            this.impGeoService.makeDirty();
      });
    }
}
