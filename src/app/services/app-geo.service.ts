import { Injectable } from '@angular/core';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { combineLatest, Observable } from 'rxjs';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintGeoAttribService } from '../val-modules/targeting/services/ImpGeofootprintGeoAttribService';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { EsriUtils } from '../esri-modules/core/esri-utils.service';
import { EsriQueryService } from '../esri-modules/layers/esri-query.service';
import { ImpGeofootprintGeoAttrib } from '../val-modules/targeting/models/ImpGeofootprintGeoAttrib';
import { AppConfig } from '../app.config';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { AppMessagingService } from './app-messaging.service';
import { toUniversalCoordinates } from '../app.utils';
import { AppStateService, Season } from './app-state.service';
import { filter, map, tap } from 'rxjs/operators';
import { groupBy, simpleFlatten } from '../val-modules/common/common.utils';
import { AppTradeAreaService } from './app-trade-area.service';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';

const layerAttributes = ['cl2i00', 'cl0c00', 'cl2prh', 'tap049', 'hhld_w', 'hhld_s', 'num_ip_addrs', 'geocode', 'pob', 'owner_group_primary', 'cov_frequency', 'dma_name', 'cov_desc', 'city_name'];

@Injectable({
  providedIn: 'root'
})
export class AppGeoService {

  private validAnalysisLevel$: Observable<string>;

  constructor(private tradeAreaService: ImpGeofootprintTradeAreaService, private appStateService: AppStateService,
              private geoService: ImpGeofootprintGeoService, private attributeService: ImpGeofootprintGeoAttribService,
              private locationService: ImpGeofootprintLocationService, private messagingService: AppMessagingService,
              private queryService: EsriQueryService, private config: AppConfig) {

    this.validAnalysisLevel$ = this.appStateService.analysisLevel$.pipe(filter(al => al != null && al.length > 0));
    this.setupRadiusSelectionObservable();
    this.setupHomeGeoSelectionObservable();
    this.setupGeoAttributeUpdateObservable();
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
      // remove any trade areas that already have geos
      map(tradeAreas => tradeAreas.filter(ta => ta.impGeofootprintGeos.length === 0)),
      // halt the sequence if there are no trade areas remaining at this point
      filter(tradeAreas => tradeAreas.length > 0)
    ).subscribe(tradeAreas => this.selectAndPersistRadiusGeos(tradeAreas));
  }

  /**
   * Sets up an observable sequence that fires when a location is missing its home geo in any trade area
   */
  private setupHomeGeoSelectionObservable() : void {
    // The root sequence is locations, but I also want to fire when geos change, though I never use them directly
    combineLatest(this.locationService.storeObservable,
                  this.geoService.storeObservable,
                  this.appStateService.projectIsLoading$).pipe(
      // halt the sequence if the project is still loading
      filter(([locations, geos, isLoading]) => !isLoading),
      // remove competitors from the sequence
      map(([locations]) => locations.filter(loc => loc.clientLocationTypeCode === 'Site')),
      // remove sites that don't have home geocodes yet
      map(locations => locations.filter(loc => loc.homeGeocode != null && loc.homeGeocode.length > 0)),
      // remove sites that don't have any trade areas yet
      map(locations => locations.filter(loc => loc.impGeofootprintTradeAreas.length > 0)),
      // remove sites that don't haven't finished trade area processing
      map(locations => locations.filter(loc => loc.getImpGeofootprintGeos().length > 0 || loc.impGeofootprintTradeAreas.some(ta => ta['isComplete'] === true))),
      // remove sites that already have their home geo selected
      map(locations => locations.filter(loc => loc.getImpGeofootprintGeos().filter(geo => geo.geocode === loc.homeGeocode).length === 0)),
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

  private updateAttributesFromLayer(geocodes: string[], analysisLevel: string) {
    const portalId = this.config.getLayerIdForAnalysisLevel(analysisLevel);
    const sub = this.queryService.queryAttributeIn(portalId, 'geocode', geocodes, false, layerAttributes).subscribe(
      graphics => {
        const attributesForUpdate = graphics.map(g => g.attributes);
        this.updateGeoAttributes(attributesForUpdate);
      },
      err => {
        console.error(err);
        this.messagingService.showGrowlError('Error', 'There was an error during geo selection');
      },
      () => {
        if (sub) sub.unsubscribe();
      });
  }

  private selectAndPersistRadiusGeos(tradeAreas: ImpGeofootprintTradeArea[]) : void {
    const layerId = this.config.getLayerIdForAnalysisLevel(this.appStateService.analysisLevel$.getValue(), false);
    const radiusToTradeAreaMap: Map<number, ImpGeofootprintTradeArea[]> = groupBy(tradeAreas, 'taRadius');
    const radii = Array.from(radiusToTradeAreaMap.keys());
    const maxRadius = Math.max(...radii);
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
          for (let i = 0; i < radii.length; ++i) {
            const previousRadius = i > 0 ? radii[i - 1] : -0.1;
            geosToPersist.push(...this.createGeosToPersist(radii[i], radiusToTradeAreaMap.get(radii[i]), allSelectedData, previousRadius));
          }
          this.geoService.add(geosToPersist);
          this.messagingService.stopSpinnerDialog(spinnerKey);
        });
  }

  private selectAndPersistHomeGeos(locations: ImpGeofootprintLocation[]) : void {
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
        if (homeGeocodes.length > 0){
          geosToPersist.push(...homeGeocodes);
        }
        this.geoService.add(geosToPersist);
        this.messagingService.stopSpinnerDialog(spinnerKey);
      });
  }

  private createGeosToPersist(radius: number, tradeAreas: ImpGeofootprintTradeArea[], centroids: __esri.Graphic[], previousRadius: number = 0) : ImpGeofootprintGeo[] {
    const geosToSave: ImpGeofootprintGeo[] = [];
    const centroidAttributes: any = centroids.map(c => c.attributes);
    centroidAttributes.forEach(attributes => {
      tradeAreas.filter(ta => ta.impGeofootprintLocation != null).forEach(ta => {
        const currentDistance = EsriUtils.getDistance(attributes.longitude, attributes.latitude, ta.impGeofootprintLocation.xcoord, ta.impGeofootprintLocation.ycoord);
        if (currentDistance <= radius && currentDistance > previousRadius) {
            const newGeo = new ImpGeofootprintGeo({
              xcoord: attributes.longitude,
              ycoord: attributes.latitude,
              geocode: attributes.geocode,
              distance: currentDistance,
              impGeofootprintLocation: ta.impGeofootprintLocation,
              impGeofootprintTradeArea: ta,
              isActive: ta.isActive
            });
            ta.impGeofootprintGeos.push(newGeo);
            geosToSave.push(newGeo);
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
    this.filterGeos(geosToSave, centroids);
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
            const geocodeDistance: number = EsriUtils.getDistance(centroid.attributes.longitude, centroid.attributes.latitude, loc.xcoord, loc.ycoord);
            const homeGeoTA: ImpGeofootprintTradeArea[] = loc.impGeofootprintTradeAreas.filter(ta => ta.taType === 'HOMEGEO');
            if (homeGeoTA.length === 0) {
              const newTA = AppTradeAreaService.createCustomTradeArea(0, loc, true, 'HOMEGEO');
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
          });
        }
      });
    }
    if (newTradeAreas.length > 0) this.tradeAreaService.add(newTradeAreas);
    return homeGeosToAdd;
  }

  private filterGeos(geos: ImpGeofootprintGeo[], centroids: __esri.Graphic[]) {
    const currentProject = this.appStateService.currentProject$.getValue();
    const includeValassis = currentProject.isIncludeValassis;
    const includeAnne = currentProject.isIncludeAnne;
    const includeSolo = currentProject.isIncludeSolo;
    const includePob = !currentProject.isExcludePob;
    const activeGeocodes = new Set<string>(centroids.filter(c => {
      return (c.attributes.is_pob_only !== 1 || (c.attributes.is_pob_only === 1 && includePob)) && (
        (c.attributes.owner_group_primary == null )
          ? (includeSolo)
          : ((c.attributes.owner_group_primary.toUpperCase() !== 'ANNE'     || ( c.attributes.owner_group_primary.toUpperCase() === 'ANNE' && includeAnne))
            && (c.attributes.owner_group_primary .toUpperCase() !== 'VALASSIS' || ( c.attributes.owner_group_primary.toUpperCase() === 'VALASSIS' && includeValassis))
            && (c.attributes.cov_frequency == null || c.attributes.cov_frequency.toUpperCase() !== 'SOLO' || (c.attributes.cov_frequency != null && c.attributes.cov_frequency.toUpperCase() === 'SOLO' && includeSolo))
          ));
    }).map(c => c.attributes.geocode));
    const inActiveCentroids = new Map<string, __esri.Graphic>(centroids.filter(c => !activeGeocodes.has(c.attributes.geocode)).map<[string, __esri.Graphic]>(c => [c.attributes.geocode, c]));
    geos.filter(geo => inActiveCentroids.has(geo.geocode))
      .forEach(geo => {
        geo['filterReasons'] = '';
        geo.isActive = false;
        const graphic = inActiveCentroids.get(geo.geocode);
        // Set Transitory Properties on the geo
        const filterReasons: string[] = [];
        if (graphic != null && graphic.attributes != null) {
          if (graphic.attributes.is_pob_only === 1 && !includePob) {
            filterReasons.push('POB');
          }
          if (graphic.attributes.owner_group_primary != null && graphic.attributes.owner_group_primary.toUpperCase() === 'ANNE' && !includeAnne) {
            filterReasons.push('ANNE');
          }
          if (graphic.attributes.owner_group_primary != null && graphic.attributes.owner_group_primary.toUpperCase() === 'VALASSIS' && !includeValassis){
            filterReasons.push('Valassis');
          }
          if (graphic.attributes.owner_group_primary == null && !includeSolo ||
            graphic.attributes.cov_frequency != null && graphic.attributes.cov_frequency.toUpperCase() === 'SOLO' && !includeSolo){
            filterReasons.push('Solo');
          }

          // If there were filter reasons, create the text for the tooltip
          if (filterReasons.length > 0)
            geo['filterReasons'] = 'Filtered because: ' + filterReasons.join(', ');
        }
      });
  }

  private updateGeoAttributes(layerAttribute: any[]) {
    const currentGeos = this.geoService.get();
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
    this.attributeService.add(newAttributes);
  }

  private deselectGeosByGeocode(geocode: string) : void {
    const taTypesToDeactivate = new Set<string>(['RADIUS', 'AUDIENCE', 'HOMEGEO', 'CUSTOM']);
    const geosToRemove = this.geoService.get().filter(geo => geo.geocode === geocode);
    const geosToDeactivate = geosToRemove.filter(geo => taTypesToDeactivate.has(geo.impGeofootprintTradeArea.taType));
    const geosToDelete = geosToRemove.filter(geo => geo.impGeofootprintTradeArea.taType === 'MANUAL');
    const attribsToDelete = simpleFlatten(geosToDelete.map(geo => geo.impGeofootprintGeoAttribs));
    if (geosToDeactivate.length > 0) {
      geosToDeactivate.forEach(geo => geo.isActive = false);
      if (geosToDelete.length === 0) {
        this.attributeService.update(null, null);
        this.geoService.update(null, null);
      }
    }
    if (geosToDelete.length > 0) {
      this.attributeService.remove(attribsToDelete);
      this.attributeService.addDbRemove(attribsToDelete);
      this.geoService.remove(geosToDelete);
      this.geoService.addDbRemove(geosToDelete);
    }
  }

  private reactivateGeosByGeocode(geocode: string) : void {
    this.geoService.get()
      .filter(geo => geo.geocode === geocode)
      .forEach(geo => {
        geo.impGeofootprintGeoAttribs.forEach(a => a.isActive = true);
        geo.isActive = true;
      });
    this.geoService.update(null, null);
  }

  private addGeoToManualTradeArea(geocode: string, geometry: { x: number; y: number }) : void {
    const tradeAreaName = 'Manual Selection';
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
    let tradeArea: ImpGeofootprintTradeArea;
    const tradeAreas = this.tradeAreaService.get()
      .filter(ta => ta.taType === 'MANUAL' && ta.taName === tradeAreaName && ta.impGeofootprintLocation === closestLocation && ta.isActive);
    if (tradeAreas.length === 0) {
      tradeArea = new ImpGeofootprintTradeArea({
        impGeofootprintLocation: closestLocation,
        taType: 'MANUAL',
        taName: tradeAreaName,
        taNumber: 0,
        isActive: true
      });
      closestLocation.impGeofootprintTradeAreas.push(tradeArea);
      this.tradeAreaService.add([tradeArea]);
    } else {
      tradeArea = tradeAreas[0];
    }
    const newGeo = new ImpGeofootprintGeo({
      geocode: geocode,
      xcoord: geometry.x,
      ycoord: geometry.y,
      distance: minDistance,
      impGeofootprintLocation: closestLocation,
      impGeofootprintTradeArea: tradeArea,
      isActive: true
    });
    tradeArea.impGeofootprintGeos.push(newGeo);
    this.geoService.add([newGeo]);
  }
}
