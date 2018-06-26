import { Injectable } from '@angular/core';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { combineLatest, concat } from 'rxjs';
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
import { filter, map } from 'rxjs/operators';
import { groupBy, simpleFlatten } from '../val-modules/common/common.utils';
import { AppTradeAreaService } from './app-trade-area.service';

const layerAttributes = ['cl2i00', 'cl0c00', 'cl2prh', 'tap049', 'hhld_w', 'hhld_s', 'num_ip_addrs', 'geocode', 'pob', 'owner_group_primary', 'cov_frequency', 'dma_name', 'cov_desc', 'city_name'];

@Injectable({
  providedIn: 'root'
})
export class AppGeoService {

  constructor(private tradeAreaService: ImpGeofootprintTradeAreaService, private appStateService: AppStateService,
              private geoService: ImpGeofootprintGeoService, private attributeService: ImpGeofootprintGeoAttribService,
              private locationService: ImpGeofootprintLocationService, private messagingService: AppMessagingService,
              private queryService: EsriQueryService, private config: AppConfig) {
    combineLatest(this.appStateService.siteTradeAreas$, this.appStateService.projectIsLoading$).pipe(
      filter(([tradeAreaMap, isLoading]) => !isLoading),
      map(([tradeAreaMap]) => tradeAreaMap),
      map(tradeAreaMap => simpleFlatten(Array.from(tradeAreaMap.values()))),
      map(tradeAreas => tradeAreas.filter(ta => ta.impGeofootprintGeos.length === 0)),
      filter(tradeAreas => tradeAreas.length > 0)
    ).subscribe(tradeAreas => this.selectAndPersistGeos(tradeAreas));

    const validAnalysis$ = this.appStateService.analysisLevel$.pipe(filter(al => al != null && al.length > 0));

    combineLatest(this.appStateService.uniqueIdentifiedGeocodes$, validAnalysis$, this.appStateService.projectIsLoading$)
      .pipe(
        filter(([geocodes, analysisLevel, isLoading]) => !isLoading),
        map(([geocodes, analysisLevel]) => [geocodes, analysisLevel] as [string[], string])
      )
      .subscribe(
      ([geocodes, analysisLevel]) => this.updateGeoAttribsFromLayer(geocodes, analysisLevel)
    );
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

  public updateGeoAttribsFromLayer(geocodes: string[], analysisLevel: string) {
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

  private selectAndPersistGeos(tradeAreas: ImpGeofootprintTradeArea[]) : void {
    const layerId = this.config.getLayerIdForAnalysisLevel(this.appStateService.analysisLevel$.getValue(), false);
    const radiusToTradeAreaMap: Map<number, ImpGeofootprintTradeArea[]> = groupBy(tradeAreas, 'taRadius');
    const radii = Array.from(radiusToTradeAreaMap.keys());
    const maxRadius = Math.max(...radii);
    const allSelectedData: __esri.Graphic[] = [];
    const spinnerKey = 'selectAndPersistGeos';
    this.messagingService.startSpinnerDialog(spinnerKey, 'Calculating Trade Areas...');
    const allLocations = tradeAreas.map(ta => ta.impGeofootprintLocation);
    const allHomeGeos = allLocations.map(loc => loc.homeGeocode);
    const distanceQuery$ = this.queryService.queryPointWithBuffer(layerId, toUniversalCoordinates(allLocations), maxRadius, false, ['geocode', 'owner_group_primary', 'cov_frequency', 'is_pob_only', 'latitude', 'longitude', 'geometry_type']);
    const homeGeoQuery$ = this.queryService.queryAttributeIn(layerId, 'geocode', allHomeGeos, false, ['geocode', 'owner_group_primary', 'cov_frequency', 'is_pob_only', 'latitude', 'longitude']);
    concat(distanceQuery$, homeGeoQuery$).subscribe(
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
        const homeCentroids = allSelectedData.filter(g => !g.attributes.hasOwnProperty('geometry_type'));

        const homeGeocodes = this.createHomeGeos(homeCentroids, geosToPersist);
        if (homeGeocodes.length > 0){
          geosToPersist.push(...homeGeocodes);
        }

        this.geoService.add(geosToPersist);
        console.log ('geoService size after: ', this.geoService.storeLength);
        this.messagingService.stopSpinnerDialog(spinnerKey);
      });
  }

  private createGeosToPersist(radius: number, tradeAreas: ImpGeofootprintTradeArea[], centroids: __esri.Graphic[], previousRadius: number = 0) : ImpGeofootprintGeo[] {
    const geosToSave: ImpGeofootprintGeo[] = [];
    // home geos won't have lat/long returned (on purpose - so i can detect and filter them out here)
    const centroidMap = new Map(centroids.filter(g => g.attributes.latitude != null).map<[string, __esri.Graphic]>(g => [g.attributes.geocode, g]));
    centroidMap.forEach((graphic, geocode) => {
      tradeAreas.filter(ta => ta.impGeofootprintLocation != null).forEach(ta => {
        const currentDistance = EsriUtils.getDistance(graphic.attributes.longitude, graphic.attributes.latitude, ta.impGeofootprintLocation.xcoord, ta.impGeofootprintLocation.ycoord);
        if (currentDistance <= radius && currentDistance > previousRadius) {
            const newGeo = new ImpGeofootprintGeo({
              xcoord: graphic.attributes.longitude,
              ycoord: graphic.attributes.latitude,
              geocode: geocode,
              distance: currentDistance,
              impGeofootprintTradeArea: ta,
              isActive: ta.isActive
            });
            ta.impGeofootprintGeos.push(newGeo);
            geosToSave.push(newGeo);
          }
      });
    });
    this.filterGeos(geosToSave, centroids);
    console.log('createGeosToPersist - geosToSave filtered & unfiltered: ', geosToSave.length);
    return geosToSave;
  }

  private createHomeGeos(homeCentroids: __esri.Graphic[],  geosToPersist: ImpGeofootprintGeo[]) : ImpGeofootprintGeo[] {
    const geocodes: any[] = [];
    const existingGeos = new Set(geosToPersist.map(g => g.geocode));
    const locations = this.locationService.get();
    const homeGeosToAdd: ImpGeofootprintGeo[] = [];
    const newTradeAreas: ImpGeofootprintTradeArea[] = [];
    homeCentroids.forEach(g => {
      if (!existingGeos.has(g.attributes.geocode)){
          geocodes.push(g);
      }
    });
    let customIndex: number = 0;
    if (geocodes.length > 0 ) {
      geocodes.forEach(geo => {
         locations.filter(loc => {
            if (loc.homeGeocode === geo.attributes.geocode){
              const geocodeDistance: number = EsriUtils.getDistance(geo.attributes.longitude, geo.attributes.latitude, loc.xcoord, loc.ycoord);
              customIndex++;
              const homeGeoTA: ImpGeofootprintTradeArea[] = loc.impGeofootprintTradeAreas.filter(ta => ta.taType === 'HOMEGEO');
              if (homeGeoTA.length === 0) {
                const newTA = AppTradeAreaService.createCustomTradeArea(customIndex, loc, true, 'HOMEGEO');
                homeGeoTA.push(newTA);
                newTradeAreas.push(newTA);
              }
              const newGeo = new ImpGeofootprintGeo({
                xcoord: geo.attributes.longitude,
                ycoord: geo.attributes.latitude,
                geocode: geo.attributes.geocode,
                distance: geocodeDistance,
                impGeofootprintTradeArea: homeGeoTA[0],
                isActive: true
              });
              homeGeoTA[0].impGeofootprintGeos.push(newGeo);
              homeGeosToAdd.push(newGeo);
            }
         });
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
