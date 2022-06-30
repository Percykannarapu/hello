import { Injectable } from '@angular/core';
import { union } from '@arcgis/core/geometry/geometryEngine';
import Point from '@arcgis/core/geometry/Point';
import { CommonSort, groupByExtended, isEmpty, isNil, isNotNil, toNullOrNumber, toUniversalCoordinates } from '@val/common';
import { EsriService, EsriUtils } from '@val/esri';
import { merge, Observable } from 'rxjs';
import { map, withLatestFrom } from 'rxjs/operators';
import { TradeAreaTypeCodes } from '../../worker-shared/data-model/impower.data-model.enums';
import { geoPassesFilter } from '../common/complex-rules';
import { DialogConfigData } from '../components/dialogs/manual-geo-dialog/manual-geo-dialog.component';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { ImpDomainFactoryService } from '../val-modules/targeting/services/imp-domain-factory.service';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { AppLoggingService } from './app-logging.service';
import { AppMapService } from './app-map.service';

export interface LocationDistance {
  location: ImpGeofootprintLocation;
  distance: number;
}

@Injectable({
  providedIn: 'root'
})
export class ManualGeoService {

  constructor(private domainFactory: ImpDomainFactoryService,
              private esriService: EsriService,
              private geoService: ImpGeofootprintGeoService,
              private logger: AppLoggingService,
              private mapService: AppMapService,
              private tradeAreaService: ImpGeofootprintTradeAreaService) { }

  allAllowedByFilter(features: __esri.Graphic[], currentProject: ImpProject) : boolean | null {
    const result = features.map(f => geoPassesFilter(f.attributes, currentProject));
    return result.every(b => b) ? true : result.every(b => !b) ? false : null;
  }

  calculateLocationDistances(features: __esri.Graphic[], currentLocations: ImpGeofootprintLocation[]) : LocationDistance[] {
    const result = [];
    const isPopupFeature = features.length === 1 && isNil(features[0].geometry);
    const centroid = isPopupFeature
      ? new Point({ longitude: features[0].attributes['longitude'], latitude: features[0].attributes['latitude'] })
      : union(features.map(f => f.geometry)).extent.center;
    currentLocations.forEach(loc => {
      const coords = toUniversalCoordinates(loc);
      result.push({
        location: loc,
        distance: EsriUtils.getDistance(coords, centroid.longitude, centroid.latitude)
      });
    });
    result.sort((a, b) => CommonSort.NullableNumber(a?.distance, b?.distance));
    return result.slice(0, 10); // top ten (or fewer) closest locations
  }

  public addGeosToLocation(features: __esri.Graphic[], selectedLocation: ImpGeofootprintLocation, allLocations: ImpGeofootprintLocation[], currentProject: ImpProject, alwaysActive: boolean) : void {
    const geoLocationMap = new Map<ImpGeofootprintLocation, __esri.Graphic[]>();
    if (isNotNil(selectedLocation)) {
      geoLocationMap.set(selectedLocation, features);
    } else {
      features.forEach(f => {
        const closestSite = EsriUtils.getClosestItem(f.attributes, allLocations);
        geoLocationMap.set(closestSite, (geoLocationMap.get(closestSite) ?? []).concat([f]));
      });
    }
    const newGeos = this.addGeosToManualTradeArea(geoLocationMap, currentProject);         // this will ignore existing features
    this.setExistingGeoActiveFlag(features, currentProject, alwaysActive, newGeos);       // this will ignore new features
  }

  public setExistingGeoActiveFlag(features: __esri.Graphic[], currentProject: ImpProject, isSelect: boolean, newGeos?: string[]) : void {
    const geocodesToUse = features.filter(f => geoPassesFilter(f, currentProject)).map(f => f.attributes['geocode'] as string);
    const geoMap = groupByExtended(this.geoService.get(), g => g.geocode);
    if (isNil(isSelect)) {
      this.logger.debug.log(`Toggling ${geocodesToUse.length} geo isActive flags.`);
       if(isEmpty(newGeos)){    // deselecting geos from Add/Remove Single geo tool
          geocodesToUse.forEach(gc => {
              geoMap.get(gc)?.forEach(geo => geo.isActive = !geo.isActive);
          });
       }
    } else {
      this.logger.debug.log(`Setting ${geocodesToUse.length} geo isActive flags to ${isSelect ? 'true' : 'false'}.`);
      geocodesToUse.forEach(gc => {
        geoMap.get(gc)?.forEach(geo => geo.isActive = isSelect);
      });
    }
    this.geoService.makeDirty();
  }

  private addGeosToManualTradeArea(geoLocations: Map<ImpGeofootprintLocation, __esri.Graphic[]>, currentProject: ImpProject) : string[] {
    const hhcField = `hhld_${currentProject.impGeofootprintMasters[0].methSeason?.toLowerCase() ?? 's'}`;
    const tradeAreasToAdd: ImpGeofootprintTradeArea[] = [];
    const geosToAdd: ImpGeofootprintGeo[] = [];
    const newlyAddedGeos: string[] = [];
    geoLocations.forEach((features, closestLocation) => {
      if (closestLocation != null) {
        const currentGeos = new Set(closestLocation.getImpGeofootprintGeos().map(geo => geo.geocode));
        let tradeArea = closestLocation.impGeofootprintTradeAreas.filter(ta => TradeAreaTypeCodes.parse(ta.taType).toUpperCase() === TradeAreaTypeCodes.Manual.toUpperCase())[0];
        if (tradeArea == null) {
          tradeArea = this.domainFactory.createTradeArea(closestLocation, TradeAreaTypeCodes.Manual);
          tradeAreasToAdd.push(tradeArea);
        }
        features.forEach(feature => {
          if (!currentGeos.has(feature.attributes['geocode'])) {
            const isAllowed = geoPassesFilter(feature, currentProject);
            const featurePoint = toUniversalCoordinates(feature.attributes);
            const distance = EsriUtils.getDistance(featurePoint, toUniversalCoordinates(closestLocation));
            const newGeo = this.domainFactory.createGeo(tradeArea, feature.attributes['geocode'], featurePoint.x, featurePoint.y, distance, isAllowed);
            newGeo.hhc = toNullOrNumber(feature.attributes[hhcField]);
            geosToAdd.push(newGeo);
            newlyAddedGeos.push(newGeo.geocode);
          }
        });
      }
    });
    if (!isEmpty(tradeAreasToAdd)) this.tradeAreaService.add(tradeAreasToAdd);
    if (!isEmpty(geosToAdd)) {
      this.logger.debug.log(`Adding ${geosToAdd.length} geos to manual trade area.`);
      this.geoService.add(geosToAdd);
    }
    return newlyAddedGeos;
  }

  public setupManualGeoSelections(project$: Observable<ImpProject>, activeClients$: Observable<ImpGeofootprintLocation[]>, geos$: Observable<ImpGeofootprintGeo[]>) : Observable<DialogConfigData> {
    const popupSelection$ = this.mapService.popupSelection$.pipe(
      withLatestFrom(project$, activeClients$, geos$),
      map(([features, project, locations, geos]) => ({
        clickTarget: features,
        currentProject: project,
        currentClientLocations: locations,
        currentGeos: geos,
        isToggle: true
      } as DialogConfigData)),
    );
    const featuresToggled$ = this.esriService.featuresToggled$.pipe(
      withLatestFrom(project$, activeClients$, geos$),
      map(([features, project, locations, geos]) => ({
        clickTarget: features,
        currentProject: project,
        currentClientLocations: locations,
        currentGeos: geos,
        isToggle: true
      } as DialogConfigData)),
    );
    const featuresSelected$ = this.esriService.featuresSelected$.pipe(
      withLatestFrom(project$, activeClients$, geos$),
      map(([features, project, locations, geos]) => ({
        clickTarget: features,
        currentProject: project,
        currentClientLocations: locations,
        currentGeos: geos,
        isToggle: false,
        isSelect: true
      } as DialogConfigData)),
    );
    const featuresUnselected$ = this.esriService.featuresUnselected$.pipe(
      withLatestFrom(project$, activeClients$, geos$),
      map(([features, project, locations, geos]) => ({
        clickTarget: features,
        currentProject: project,
        currentClientLocations: locations,
        currentGeos: geos,
        isToggle: false,
        isSelect: false
      } as DialogConfigData)),
    );
    return merge(popupSelection$, featuresToggled$, featuresSelected$, featuresUnselected$);
  }
}
