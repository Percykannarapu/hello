import { Injectable } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, tap, withLatestFrom, debounceTime } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { toUniversalCoordinates } from '../app.utils';
import { EsriUtils } from '../esri/core/esri-utils';
import { EsriQueryService } from '../esri/services/esri-query.service';
import { groupBy, simpleFlatten, groupByExtended, mapByExtended } from '../val-modules/common/common.utils';
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
import { AppMessagingService } from './app-messaging.service';
import { AppStateService, Season } from './app-state.service';
import { AppLoggingService } from './app-logging.service';
import { filterArray } from '../val-modules/common/common.rxjs';

const layerAttributes = ['cl2i00', 'cl0c00', 'cl2prh', 'tap049', 'hhld_w', 'hhld_s', 'num_ip_addrs', 'geocode', 'pob', 'owner_group_primary', 'cov_frequency', 'dma_name', 'cov_desc', 'city_name'];

@Injectable({
  providedIn: 'root'
})
export class AppGeoService {

  private validAnalysisLevel$: Observable<string>;

  constructor(private appStateService: AppStateService,
    private messagingService: AppMessagingService,
    private appMapService: AppMapService,
    private locationService: ImpGeofootprintLocationService,
    private tradeAreaService: ImpGeofootprintTradeAreaService,
    private varService: ImpGeofootprintVarService,
    private impGeoService: ImpGeofootprintGeoService,
    private impAttributeService: ImpGeofootprintGeoAttribService,
    private queryService: EsriQueryService,
    private config: AppConfig,
    private domainFactory: ImpDomainFactoryService,
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
    if (allSelectedGeos.has(geocode)) {
      this.deselectGeosByGeocode(geocode);
    } else if (allIdentifiedGeos.has(geocode)) {
      this.reactivateGeosByGeocode(geocode);
    } else {
      this.addGeoToManualTradeArea(geocode, geometry);
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
    combineLatest(this.appStateService.siteTradeAreas$, this.appStateService.projectIsLoading$).pipe(
      // halt the sequence if the project is still loading
      filter(([tradeAreaMap, isLoading]) => !isLoading),
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
      this.appStateService.projectIsLoading$).pipe(
      // halt the sequence if the project is still loading
      filter(([locations, geos, isLoading]) => !isLoading),
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
    combineLatest(this.appStateService.uniqueIdentifiedGeocodes$, this.validAnalysisLevel$, this.appStateService.projectIsLoading$)
      .pipe(
        // halt the sequence if the project is loading
        filter(([geocodes, analysisLevel, isLoading]) => !isLoading))
      .subscribe(
        ([geocodes, analysisLevel]) => this.updateAttributesFromLayer(geocodes, analysisLevel));
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

  private updateAttributesFromLayer(geocodes: string[], analysisLevel: string) {
    const portalId = this.config.getLayerIdForAnalysisLevel(analysisLevel);
    const sub = this.queryService.queryAttributeIn(portalId, 'geocode', geocodes, false, layerAttributes).subscribe(
      graphics => {
        const attributesForUpdate = graphics.map(g => g.attributes);
        this.updateGeoAttributes(attributesForUpdate);
      },
      err => {
        console.error(err);
        this.messagingService.showErrorNotification('Error', 'There was an error during geo selection');
      },
      () => {
        if (sub) sub.unsubscribe();
      });
  }

  private selectAndPersistRadiusGeos(tradeAreas: ImpGeofootprintTradeArea[]) : void {
    const layerId = this.config.getLayerIdForAnalysisLevel(this.appStateService.analysisLevel$.getValue(), false);
    const radiiArray: number[] = [];
    this.logger.debug('Select and Persist Radius Geos', tradeAreas);
    tradeAreas.forEach(ta => {
      if (ta.taRadius != null && ta.taRadius !== 0) {
        radiiArray.push(ta.taRadius);
      }
    });
    const maxRadius = Math.max(...radiiArray);
    const allSelectedData: __esri.Graphic[] = [];
    const spinnerKey = 'selectAndPersistRadiusGeos';
    const allLocations = tradeAreas.map(ta => ta.impGeofootprintLocation);
    this.messagingService.startSpinnerDialog(spinnerKey, 'Calculating Trade Areas...');
    this.queryService.queryPointWithBuffer(layerId, toUniversalCoordinates(allLocations), maxRadius, false, ['geocode', 'owner_group_primary', 'cov_frequency', 'is_pob_only', 'latitude', 'longitude', 'geometry_type'])
      .subscribe(
        selections => allSelectedData.push(...selections),
        err => {
          console.error(err);
          this.messagingService.stopSpinnerDialog(spinnerKey);
        },
        () => {
          const geosToPersist: ImpGeofootprintGeo[] = [];
          this.logger.debug('Select and Persist Radius Geos query results', allSelectedData);
          geosToPersist.push(...this.createGeosToPersist(tradeAreas, allSelectedData));
          this.impGeoService.add(geosToPersist);
          this.messagingService.stopSpinnerDialog(spinnerKey);
        });
  }

  private selectAndPersistHomeGeos(locations: ImpGeofootprintLocation[]) : void {
    console.log('Firing home geo selection', locations.map(loc => loc.impGeofootprintTradeAreas.map(ta => JSON.stringify(ta))));
    const layerId = this.config.getLayerIdForAnalysisLevel(this.appStateService.analysisLevel$.getValue(), false);
    const allSelectedData: __esri.Graphic[] = [];
    const spinnerKey = 'selectAndPersistHomeGeos';
    const allHomeGeos = locations.map(loc => loc.homeGeocode);

    this.messagingService.startSpinnerDialog(spinnerKey, 'Calculating Trade Areas...');
    this.queryService.queryAttributeIn(layerId, 'geocode', allHomeGeos, false, ['geocode', 'owner_group_primary', 'cov_frequency', 'is_pob_only', 'latitude', 'longitude'])
      .subscribe(
        selections => allSelectedData.push(...selections),
        err => {
          console.error(err);
          this.messagingService.stopSpinnerDialog(spinnerKey);
        },
        () => {
          const geosToPersist: ImpGeofootprintGeo[] = [];
          const homeGeocodes = this.createHomeGeos(allSelectedData, locations);
          if (homeGeocodes.length > 0) {
            geosToPersist.push(...homeGeocodes);
          }
          this.impGeoService.add(geosToPersist);
          this.messagingService.stopSpinnerDialog(spinnerKey);
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

  private createGeosToPersist(tradeAreas: ImpGeofootprintTradeArea[], centroids: __esri.Graphic[]) : ImpGeofootprintGeo[] {
    const geosToSave: ImpGeofootprintGeo[] = [];
    const centroidAttributes: any = centroids.map(c => c.attributes);
    const tradeAreaSet = new Set<ImpGeofootprintTradeArea>(tradeAreas);
    const locations = tradeAreas.filter(ta => ta.impGeofootprintLocation != null).map(ta => ta.impGeofootprintLocation);
    centroidAttributes.forEach(attributes => {
      locations.forEach(l => {
        const currentTas = l.impGeofootprintTradeAreas.filter(ta => tradeAreaSet.has(ta));
        currentTas.sort((a, b) => a.taNumber - b.taNumber);
        for (let i = 0; i < currentTas.length; ++i) {
          const currentDistance = EsriUtils.getDistance(attributes.longitude, attributes.latitude, l.xcoord, l.ycoord);
          const min = i === 0 ? -1 : currentTas[i - 1].taRadius;
          if (currentDistance <= currentTas[i].taRadius && currentDistance > min) {
            if (currentTas[i].impGeofootprintGeos.filter(geo => geo.geocode === attributes.geocode).length === 0) {
              const newGeo = this.domainFactory.createGeo(currentTas[i], attributes.geocode, attributes.longitude, attributes.latitude, currentDistance);
              geosToSave.push(newGeo);
            }
          }
        }
      });
    });
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
    this.updateGeoAttributes(centroids.map(g => g.attributes), geosToSave);
    this.filterGeosImpl(geosToSave);
    console.log('createGeosToPersist - geosToSave filtered & unfiltered: ', geosToSave.length);
    return geosToSave;
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
          Object.entries(attribute).forEach(([k, v]) => {
            const newAtt = new ImpGeofootprintGeoAttrib({
              attributeCode: k,
              attributeValue: v,
              isActive: true,
              impGeofootprintGeo: geo
            });
            if (geo.impGeofootprintGeoAttribs == null) geo.impGeofootprintGeoAttribs = [];
            if (geo.impGeofootprintGeoAttribs.filter(a => a.attributeCode === k).length === 0) {
              geo.impGeofootprintGeoAttribs.push(newAtt);
              newAttributes.push(newAtt);
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
