import { Injectable } from '@angular/core';
import { combineLatest, merge, Observable } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { toUniversalCoordinates } from '../app.utils';
import { EsriUtils } from '../esri/core/esri-utils';
import { EsriQueryService } from '../esri/services/esri-query.service';
import { groupBy, simpleFlatten, groupByExtended } from '../val-modules/common/common.utils';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintGeoAttrib } from '../val-modules/targeting/models/ImpGeofootprintGeoAttrib';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpDomainFactoryService } from '../val-modules/targeting/services/imp-domain-factory.service';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintGeoAttribService } from '../val-modules/targeting/services/ImpGeofootprintGeoAttribService';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpGeofootprintVarService } from '../val-modules/targeting/services/ImpGeofootprintVar.service';
import { TradeAreaTypeCodes } from '../val-modules/targeting/targeting.enums';
import { AppMapService } from './app-map.service';
import { AppStateService, Season } from './app-state.service';
import { AppLoggingService } from './app-logging.service';
import { Store } from '@ngrx/store';
import { AppState } from '../state/app.interfaces';
import { ErrorNotification, StartBusyIndicator, StopBusyIndicator } from '../messaging';
import { LocationQuadTree } from '../models/location-quad-tree';

const layerAttributes = ['cl2i00', 'cl0c00', 'cl2prh', 'tap049', 'hhld_w', 'hhld_s', 'num_ip_addrs', 'geocode', 'pob', 'owner_group_primary', 'cov_frequency', 'dma_name', 'cov_desc', 'city_name'];

interface AttributeDistance {
  attribute: any;
  distance: number;
}

@Injectable({
  providedIn: 'root'
})
export class AppGeoService {

  private validAnalysisLevel$: Observable<string>;

  constructor(private appStateService: AppStateService,
              private appMapService: AppMapService,
              private locationService: ImpGeofootprintLocationService,
              private tradeAreaService: ImpGeofootprintTradeAreaService,
              private varService: ImpGeofootprintVarService,
              private impGeoService: ImpGeofootprintGeoService,
              private impAttributeService: ImpGeofootprintGeoAttribService,
              private queryService: EsriQueryService,
              private config: AppConfig,
              private domainFactory: ImpDomainFactoryService,
              private store$: Store<AppState>,
              private logger: AppLoggingService) {
    this.validAnalysisLevel$ = this.appStateService.analysisLevel$.pipe(filter(al => al != null && al.length > 0));
    this.setupRadiusSelectionObservable();
    this.setupHomeGeoSelectionObservable();
    this.setupGeoAttributeUpdateObservable();
    this.setupFilterGeosObservable();
    this.setupMapClickEventHandler();
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
    this.impGeoService.remove(geos);
    if (attributes.length > 0) {
      attributes.forEach(a => a.impGeofootprintGeo = null);
      this.impAttributeService.remove(attributes);
    }
  }

  /**
   * Sets up an observable sequence that fires when a new, empty Radius trade area appears in the data store.
   */
  private setupRadiusSelectionObservable() : void {
    // The root sequence is Radius only trade areas for Sites (not competitors)
    combineLatest(this.appStateService.siteTradeAreas$, this.appStateService.applicationIsReady$).pipe(
      // halt the sequence if the project is still loading
      filter(([tradeAreaMap, isReady]) => isReady),
      // flatten the data to a 1-dimension array
      map(([tradeAreaMap]) => simpleFlatten(Array.from(tradeAreaMap.values()))),
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
    // The root sequence is locations, but I also want to fire when geos change, though I never use them directly
    combineLatest(this.locationService.storeObservable,
      this.impGeoService.storeObservable,
      this.appStateService.applicationIsReady$).pipe(
      // halt the sequence if the project is still loading
      filter(([locations, geos, isReady]) => isReady),
      // keep only locations identified as sites
      map(([locations]) => locations.filter(loc => loc.clientLocationTypeCode === 'Site')),
      // keep locations that have a home geocode identified
      map(locations => locations.filter(loc => loc.homeGeocode != null && loc.homeGeocode.length > 0)),
      // keep locations that have trade areas defined
      map(locations => locations.filter(loc => loc.impGeofootprintTradeAreas.length > 0)),
      // keep sites that do not already have their home geo selected
      map(locations => locations.filter(loc => loc.getImpGeofootprintGeos().filter(geo => geo.geocode === loc.homeGeocode).length === 0)),
      // keep locations where finished radius count matches all radius count
      map(locations => locations.filter(loc => loc.impGeofootprintTradeAreas.filter(ta => ta.taType === 'RADIUS' && ta['isComplete'] !== true).length === 0)),
      // halt the sequence if there are no locations remaining
      filter(locations => locations.length > 0)
    ).subscribe(locations => this.selectAndPersistHomeGeos(locations));
  }

  /**
   * Sets up an observable sequence that fires when any geocode is added to the data store
   */
  private setupGeoAttributeUpdateObservable() : void {
    combineLatest(this.impGeoService.storeObservable, this.validAnalysisLevel$, this.appStateService.applicationIsReady$)
      .pipe(
        // halt the sequence if the project is loading
        filter(([geos, analysisLevel, isReady]) => isReady),
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
    const queryableGeos = geos.filter(g => g.impGeofootprintGeoAttribs.length < layerAttributes.length); // HACK: This is to detect anyone who hasn't gone through this particular query
    if (queryableGeos.length === 0) return;
    const geocodes = new Set(queryableGeos.map(g => g.geocode));
    const portalId = this.config.getLayerIdForAnalysisLevel(analysisLevel);
    const sub = this.queryService.queryAttributeIn(portalId, 'geocode', Array.from(geocodes), false, layerAttributes).subscribe(
      graphics => {
        const attributesForUpdate = graphics.map(g => g.attributes);
        this.updateGeoAttributes(attributesForUpdate);
      },
      err => {
        console.error(err);
        this.store$.dispatch(new ErrorNotification({ message: 'There was an error during geo selection' }));
      },
      () => {
        if (sub) sub.unsubscribe();
      });
  }

  private partitionLocations(locations: ImpGeofootprintLocation[]) : ImpGeofootprintLocation[][] {
    const quadTree = new LocationQuadTree(locations);
    const result = quadTree.partition(this.config.esriAppSettings.maxPointsPerBufferQuery, 500);
    this.logger.debug('QuadTree partitions', quadTree);
    return result.filter(chunk => chunk && chunk.length > 0);
  }

  private selectAndPersistRadiusGeos(tradeAreas: ImpGeofootprintTradeArea[]) : void {
    const attributesToRetrieve = ['geocode', 'owner_group_primary', 'cov_frequency', 'is_pob_only', 'latitude', 'longitude', 'geometry_type'];
    const layerId = this.config.getLayerIdForAnalysisLevel(this.appStateService.analysisLevel$.getValue(), false);
    this.logger.debug('Select and Persist Radius Geos', tradeAreas);
    const key = 'selectAndPersistRadiusGeos';
    const allLocations = tradeAreas.map(ta => ta.impGeofootprintLocation);
    const locationChunks = this.partitionLocations(allLocations);
    const queries: Observable<Map<ImpGeofootprintLocation, AttributeDistance[]>>[] = [];
    const tradeAreaSet = new Set(tradeAreas);
    const locationDistanceMap = new Map<ImpGeofootprintLocation, AttributeDistance[]>();
    this.store$.dispatch(new StartBusyIndicator({ key, message: 'Calculating Trade Areas...' }));
    this.logger.debug('Total number of location slices to process', locationChunks.length);
    for (const currentChunk of locationChunks) {
      const currentTas = simpleFlatten(currentChunk.map(l => l.impGeofootprintTradeAreas)).filter(ta => tradeAreaSet.has(ta));
      const maxRadius = Math.max(...currentTas.map(ta => ta.taRadius));
      queries.push(
        this.queryService.queryPointWithBuffer(layerId, toUniversalCoordinates(currentChunk), maxRadius, false, attributesToRetrieve)
          .pipe(map(selections => this.calculateDistances(currentChunk, tradeAreaSet, selections)))
      );
    }
    merge(...queries, 4)
      .subscribe(
        currentMap => currentMap.forEach((v, k) => {
          let newValues = v;
          if (locationDistanceMap.has(k)) {
            newValues = [...locationDistanceMap.get(k), ...v];
          }
          locationDistanceMap.set(k, newValues);
        }),
        err => {
          console.error(err);
          this.store$.dispatch(new StopBusyIndicator({ key }));
        },
        () => {
            const geosToPersist = this.createGeosToPersist(locationDistanceMap, tradeAreaSet);

            // Add the must covers to geosToPersist
            this.ensureMustCoversObs(Array.from(locationDistanceMap.keys()), tradeAreaSet, geosToPersist).subscribe(results=> {
               results.forEach(result => {
                  console.log("Added ", results.length, " must cover geos");
                  geosToPersist.push(result);
               });
            }
            ,err => {console.log("ERROR occurred ensuring must covers: ", err);}
            ,() => {
               this.filterGeosImpl(geosToPersist);
               this.finalizeTradeAreas(tradeAreas);
               this.impGeoService.add(geosToPersist);
               this.store$.dispatch(new StopBusyIndicator({ key }));
            });
        });
  }

  private selectAndPersistHomeGeos(locations: ImpGeofootprintLocation[]) : void {
    console.log('Firing home geo selection', locations.map(loc => loc.impGeofootprintTradeAreas.map(ta => JSON.stringify(ta))));
    const layerId = this.config.getLayerIdForAnalysisLevel(this.appStateService.analysisLevel$.getValue(), false);
    const allSelectedData: __esri.Graphic[] = [];
    const key = 'selectAndPersistHomeGeos';
    const allHomeGeos = locations.map(loc => loc.homeGeocode);
    this.store$.dispatch(new StartBusyIndicator({ key, message: 'Calculating Trade Areas...' }));
    this.queryService.queryAttributeIn(layerId, 'geocode', allHomeGeos, false, ['geocode', 'owner_group_primary', 'cov_frequency', 'is_pob_only', 'latitude', 'longitude'])
      .subscribe(
        selections => allSelectedData.push(...selections),
        err => {
          console.error(err);
          this.store$.dispatch(new StopBusyIndicator({ key }));
        },
        () => {
          const geosToPersist: ImpGeofootprintGeo[] = [];
          const homeGeocodes = this.createHomeGeos(allSelectedData, locations);
          if (homeGeocodes.length > 0) {
            geosToPersist.push(...homeGeocodes);
          }
          this.impGeoService.add(geosToPersist);
          this.store$.dispatch(new StopBusyIndicator({ key }));
        });
  }

  public clearAllGeos(keepRadiusGeos: boolean, keepAudienceGeos: boolean, keepCustomGeos: boolean, keepForcedHomeGeos: boolean) {
    // also removes all vars and trade areas (except Radius and Audience)
    const allTradeAreas = this.tradeAreaService.get();
    const radiusTradeAreas = allTradeAreas.filter(ta => ta.taType === 'RADIUS');
    const audienceTradeAreas = allTradeAreas.filter(ta => ta.taType === 'AUDIENCE');
    const customTradeAreas = allTradeAreas.filter(ta => ta.taType === 'CUSTOM');
    const forcedTradeAreas = allTradeAreas.filter(ta => ta.taType === 'HOMEGEO');
    const otherTradeAreas = allTradeAreas.filter(ta => !['RADIUS', 'AUDIENCE', 'CUSTOM', 'HOMEGEO'].includes(ta.taType));
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
    const centroidAttributes = centroids.map(c => c.attributes);
    locations.forEach(loc => {
      const currentTas = loc.impGeofootprintTradeAreas.filter(ta => tradeAreaSet.has(ta));
      const maxRadiusForLocation = Math.max(...currentTas.map(ta => ta.taRadius));
      centroidAttributes.forEach(attributes => {
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
    this.updateGeoAttributes(allAttributes, geosToSave);
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
    }
    if (newTradeAreas.length > 0) this.tradeAreaService.add(newTradeAreas);
    return homeGeosToAdd;
  }

  /**
   * Will check a list of geos against the must cover geographies.  When geographies from the
   * must cover list are not in the provided geos parameter, they will be created and assigned 
   * to the closest location.  If that location does not yet have a Must Cover trade area, one will
   * be created.
   * The observable will return an array of ImpGeofootprintGeos.
   * 
   * @param locations Array of locations that must cover geos can get assigned to
   * @param tradeAreaSet Set of trade areas, which new must cover TAs can get added to
   * @param geos Array of existing geos to be compared against the must cover list
   */
   public ensureMustCoversObs(locations: ImpGeofootprintLocation[], tradeAreaSet: Set<ImpGeofootprintTradeArea>, geos: ImpGeofootprintGeo[]) : Observable<ImpGeofootprintGeo[]> {
      // Determine which must covers are not in the list of geos
      let diff = this.impGeoService.mustCovers.filter(x => !geos.map(geo => geo.geocode).includes(x));

      let queryResult = new Map<string, {geocode: string, attributes: Map<string,any>}>();

      return Observable.create(async observer => {
         try {
          if (this.impGeoService.mustCovers == null || this.impGeoService.mustCovers.length === 0)
             observer.complete();
          else
            this.getGeoAttributesObs(diff).subscribe(
               results => {
                  queryResult = results;
                  // console.log("### ensureMustCoversObs.getGeoAttributesObs subscription is finished. queryResult.size: ", queryResult.size);

                  let impGeofootprintGeos: ImpGeofootprintGeo[] = [];
                  const newTradeAreas: ImpGeofootprintTradeArea[] = [];

                  results.forEach(geoAttrib => {
                     // console.log("### ensureMustCoversObs creating ImpGeo for " + geoAttrib.geocode + ", x: ", geoAttrib["longitude"], ", y: ", geoAttrib["latitude"]);

                     // Assign to the nearest location
                     let closestLocation: ImpGeofootprintLocation;
                     let minDistance: number = 999999;
                     locations.forEach(loc => {
                        let distanceToSite = EsriUtils.getDistance(geoAttrib["longitude"], geoAttrib["latitude"], loc.xcoord, loc.ycoord);
                        if (distanceToSite < minDistance) {
                           minDistance = distanceToSite;                      
                           closestLocation = loc;
                        }
                        // console.log("### location: ", loc.locationName + ", loc x: ", loc.xcoord, ", loc y: ", loc.ycoord, ", geo x: ", result.xcoord, ", geo y: ", result.ycoord, ", distance: ", distanceToSite);
                     });
                     // console.log("### ensureMustCoversObs - closest location to ", geoAttrib.geocode, " is ", closestLocation.locationName, " at ", minDistance);

                     // Assign to a new or existing MUSTCOVER trade area
                     const mustCoverTA: ImpGeofootprintTradeArea[] = closestLocation.impGeofootprintTradeAreas.filter(ta => ta.taType === 'MUSTCOVER');
                     if (mustCoverTA.length === 0) {
                        const newTA = this.domainFactory.createTradeArea(closestLocation, TradeAreaTypeCodes.MustCover);
                        newTA.taName = "Must cover geographies not in an existing trade area";
                        mustCoverTA.push(newTA);
                        newTradeAreas.push(newTA);
                     }
                     
                     // Initialize the TA list of geos if necessary
                     if (mustCoverTA[0].impGeofootprintGeos == null)
                        mustCoverTA[0].impGeofootprintGeos = [];

                     // Create the geo that must be covered
                     const newGeo = new ImpGeofootprintGeo({geocode: geoAttrib.geocode,
                                                            xcoord:  geoAttrib["longitude"],
                                                            ycoord:  geoAttrib["latitude"],
                                                            impGeofootprintLocation: closestLocation,
                                                            impGeofootprintTradeArea: mustCoverTA[0],
                                                            distance: minDistance,
                                                            isActive: true});

                     // Add the geo to the trade area and list of geos
                     mustCoverTA[0].impGeofootprintGeos.push(newGeo);
                     impGeofootprintGeos.push(newGeo);
                  });

                  // Add any new trade areas created for must covers
                  if (newTradeAreas.length > 0)
                     this.tradeAreaService.add(newTradeAreas);

                  observer.next(impGeofootprintGeos);
               }
               ,err => {
                     console.log('There was an error querying the ArcGIS layer for must covers', err)
                     observer.error(err);
                  }
               ,() => {
                     // queryResult.forEach(geoAttrib => console.log ("### geoAttrib: ", geoAttrib));
                     observer.complete();
                  }
            );
         }
         catch (err) {
            observer.error(err);
         }
      });
   }

   /** WIP - want this to be a replacement getGeoCoordsObs, instead of returning just lat / lon, return a map of any attributes
    * Returns an observable for the retrieval of attributes for an array of geocodes
    * @param geocodes Array of geocodes to retrieve attributes for
    * @param attributesNames Array of attributes to retrieve, if not specified, a default set will be returned
    */
   public getGeoAttributesObs(geocodes: string[], attributesNames: string[] = ['geocode', 'owner_group_primary', 'cov_frequency', 'latitude', 'longitude']) : Observable<Map<string, {geocode: string, attributes: Map<string, any>}>> {
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
            ,err => {
               console.log('There was an error querying the ArcGIS layer for geo attributes', err);
            }
            ,() => {
               observer.complete();
            });
         }
         catch (err) {
           observer.error(err);
         }
      });
   }


  private filterGeosImpl(geos: ImpGeofootprintGeo[]) {
    console.log('Filtering Geos Based on Flags');
    const currentProject = this.appStateService.currentProject$.getValue();
    if (currentProject == null || geos == null || geos.length === 0) return;

    const includeValassis = currentProject.isIncludeValassis;
    const includeAnne = currentProject.isIncludeAnne;
    const includeSolo = currentProject.isIncludeSolo;
    const includePob = !currentProject.isExcludePob;
    const ownerGroupGeosMap: Map<string, ImpGeofootprintGeo[]> = groupBy(simpleFlatten(geos.map(g => g.impGeofootprintGeoAttribs.filter(a => a.attributeCode === 'owner_group_primary'))), 'attributeValue', attrib => attrib.impGeofootprintGeo);
    const soloGeosMap: Map<string, ImpGeofootprintGeo[]> = groupBy(simpleFlatten(geos.map(g => g.impGeofootprintGeoAttribs.filter(a => a.attributeCode === 'cov_frequency'))), 'attributeValue', attrib => attrib.impGeofootprintGeo);
    const pobGeosMap: Map<any, ImpGeofootprintGeo[]> = groupByExtended(simpleFlatten(geos.map(g => g.impGeofootprintGeoAttribs.filter(a => a.attributeCode === 'is_pob_only' || a.attributeCode === 'pob'))), attrib => attrib.attributeValue, attrib => attrib.impGeofootprintGeo);

    if (includePob) {
      // If POB is turned on just care about the owner_group geos
      if (ownerGroupGeosMap.has('VALASSIS')) {
        ownerGroupGeosMap.get('VALASSIS').forEach(geo => {
          geo.isActive = includeValassis;
          if (geo.isActive === false) {
            geo['filterReasons'] = 'Filtered because: VALASSIS';
          } else geo['filterReasons'] = null;
        });
      }
      if (ownerGroupGeosMap.has('ANNE')) {
        ownerGroupGeosMap.get('ANNE').forEach(geo => {
          geo.isActive = includeAnne;
          if (geo.isActive === false) {
            geo['filterReasons'] = 'Filtered because: ANNE';
          } else geo['filterReasons'] = null;
        });
      }
      if (soloGeosMap.has('Solo')) {
        soloGeosMap.get('Solo').forEach(geo => {
          geo.isActive = includeSolo;
          if (geo.isActive === false) {
            geo['filterReasons'] = 'Filtered because: SOLO';
          } else geo['filterReasons'] = null;
        });
      }
    } else {
      // If POB is turned off care about the owner_group geos and the pob geos
      if (ownerGroupGeosMap.has('VALASSIS')) {
        ownerGroupGeosMap.get('VALASSIS').forEach(geo => {
          geo.isActive = includeValassis;
          if (geo.isActive === false) {
            geo['filterReasons'] = 'Filtered because: VALASSIS';
          } else geo['filterReasons'] = null;
        });
      }
      if (ownerGroupGeosMap.has('ANNE')) {
        ownerGroupGeosMap.get('ANNE').forEach(geo => {
          geo.isActive = includeAnne;
          if (geo.isActive === false) {
            geo['filterReasons'] = 'Filtered because: ANNE';
          } else geo['filterReasons'] = null;
        });
      }
      if (soloGeosMap.has('Solo')) {
        soloGeosMap.get('Solo').forEach(geo => {
          geo.isActive = includeSolo;
          if (geo.isActive === false) {
            geo['filterReasons'] = 'Filtered because: SOLO';
          } else geo['filterReasons'] = null;
        });
      }
      if (pobGeosMap.has(1) || pobGeosMap.has('B')) {

        const centroidPobs = pobGeosMap.get(1) || [];
        const topVarPobs = pobGeosMap.get('B') || [];
        const allPobs = [...centroidPobs, ...topVarPobs];

        allPobs.forEach(geo => {
          geo.isActive = includePob;
          if (geo.isActive === false) {
            geo['filterReasons'] = 'Filtered because: POB';
          } else geo['filterReasons'] = null;
        });

      }
    }
  }

  public filterGeosOnFlags(geos: ImpGeofootprintGeo[]) {
    this.filterGeosImpl(geos);
    this.impGeoService.makeDirty();
    this.impAttributeService.makeDirty();

  }

  private updateGeoAttributes(layerAttribute: any[], geos?: ImpGeofootprintGeo[]) {
    const currentGeos = geos || this.impGeoService.get();
    const isSummer = this.appStateService.season$.getValue() === Season.Summer;
    const geoMap: Map<string, ImpGeofootprintGeo[]> = groupBy(currentGeos, 'geocode');
    const newAttributes: ImpGeofootprintGeoAttrib[] = [];
    for (const attribute of layerAttribute) {
      if (attribute.geocode && geoMap.has(attribute.geocode)) {
        geoMap.get(attribute.geocode).forEach(geo => {
          geo.hhc = Number(isSummer ? attribute.hhld_s : attribute.hhld_w);
          Object.entries(attribute).forEach(([k, v]: [string, any]) => {
            try {
              const newAttribute = this.domainFactory.createGeoAttribute(geo, k, v);
              newAttributes.push(newAttribute);
            } catch (err) {
              console.error('Error creating geo attribute: ', { err, geo, attribute });
            }
          });
        });
      }
    }
    if (newAttributes.length > 0)
       this.impAttributeService.add(newAttributes);
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
    const valassisFlag$ = this.appStateService.currentProject$.pipe(
      filter(project => project != null),
      map(project => project.isIncludeValassis),
      distinctUntilChanged()
    );
    const anneFlag$ = this.appStateService.currentProject$.pipe(
      filter(project => project != null),
      map(project => project.isIncludeAnne),
      distinctUntilChanged()
    );
    const soloFlag$ = this.appStateService.currentProject$.pipe(
      filter(project => project != null),
      map(project => project.isIncludeSolo),
      distinctUntilChanged()
    );
    const pobFlag$ = this.appStateService.currentProject$.pipe(
      filter(project => project != null),
      map(project => project.isExcludePob),
      distinctUntilChanged()
    );
    combineLatest(valassisFlag$, anneFlag$, soloFlag$, pobFlag$)
      // .pipe(tap(([v, a, s, p]) => console.log('Valassis, Anne, Solo, POB: ', v, a, s, p)))
      .subscribe(() => this.filterGeosOnFlags(this.impGeoService.get()));

  }
}
