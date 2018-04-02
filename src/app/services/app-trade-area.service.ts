import { Injectable, OnDestroy } from '@angular/core';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { Subscription } from 'rxjs/Subscription';
import { ValMapService } from './app-map.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ValGeoService } from './app-geo.service';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpDiscoveryService } from './ImpDiscoveryUI.service';
import { ImpDiscoveryUI } from '../models/ImpDiscoveryUI';
import { AppConfig } from '../app.config';
import { EsriQueryService } from '../esri-modules/layers/esri-query.service';
import { EsriUtils } from '../esri-modules/core/esri-utils.service';

export class RadialTradeAreaDefaults {
  radials: { radius: number, displayed: boolean }[];
  merge: boolean;
  constructor(radii: number[], mergeType: string) {
    const maxRadius = Math.max(...radii);
    const isMergeAll = (mergeType === 'Merge All');
    const isNoMerge = (mergeType === 'No Merge');
    this.radials = [];
    for (const radius of radii) {
      this.radials.push({ radius: radius, displayed: !isMergeAll || (isMergeAll && radius === maxRadius) });
    }
    this.merge = !isNoMerge;
  }
}


@Injectable()
export class ValTradeAreaService implements OnDestroy {

  private static id: number = 0;

  private currentDefaults = new Map<string, RadialTradeAreaDefaults>();
  private currentLocations: ImpGeofootprintLocation[];
  private locationSubscription: Subscription;
  private tradeAreaSubscription: Subscription;
  private tradeAreasForInsert: ImpGeofootprintTradeArea[] = [];

  private clientBuffers = new BehaviorSubject<Map<ImpGeofootprintLocation, number[]>>(new Map<ImpGeofootprintLocation, number[]>());
  private competitorBuffers = new BehaviorSubject<Map<ImpGeofootprintLocation, number[]>>(new Map<ImpGeofootprintLocation, number[]>());

  public clientBuffer$ = this.clientBuffers.asObservable();
  public competitorBuffer$ = this.competitorBuffers.asObservable();

  // TODO: These are hacks and I want to be rid of them as soon as possible.
  public clientMergeFlag: boolean = false;
  public competitorMergeFlag: boolean = false;

  constructor(private tradeAreaService: ImpGeofootprintTradeAreaService,
              private locationService: ImpGeofootprintLocationService,
              private impGeoService:  ImpGeofootprintGeoService,
              private impDiscoveryService: ImpDiscoveryService,
              private appConfig: AppConfig,
              private esriQueryService: EsriQueryService) {
    this.currentLocations = [];
    this.locationSubscription = this.locationService.storeObservable.subscribe(locations => {
      this.onLocationChange(locations);
    });
    this.tradeAreaSubscription = this.tradeAreaService.storeObservable.subscribe(allTradeAreas => this.drawTradeAreaBuffers(allTradeAreas));
  }

  private static createTradeArea(radius: number, index: number, location: ImpGeofootprintLocation, isActive: boolean) : ImpGeofootprintTradeArea {
    return new ImpGeofootprintTradeArea({
      gtaId: ValTradeAreaService.id++,
      taNumber: index + 1,
      taName: `${location.clientLocationTypeCode} Radius ${index + 1}`,
      taRadius: radius,
      taType: 'RADIUS',
      impGeofootprintLocation: location,
      isActive: (isActive ? 1 : 0)
    });
  }

  public static createCustomTradeArea(index: number, location: ImpGeofootprintLocation, isActive: boolean,  taType: string, radius?: number) : ImpGeofootprintTradeArea {
    return new ImpGeofootprintTradeArea({
      gtaId: ValTradeAreaService.id++,
      taNumber: index + 1,
      taName: `${location.clientLocationTypeCode} CUSTOM ${index + 1}`,
      taRadius: (radius !== null ? radius : 0),
      taType: taType,
      impGeofootprintLocation: location,
      isActive: (isActive ? 1 : 0)
    });
  }

  public static createLocationTradeAreaMap(tradeAreas: ImpGeofootprintTradeArea[], tradeAreaType: string = 'RADIUS') : Map<ImpGeofootprintLocation, ImpGeofootprintTradeArea[]> {
    const matchingTradeAreas = tradeAreas.filter(ta => ta.taType === tradeAreaType);
    const result = new Map<ImpGeofootprintLocation, ImpGeofootprintTradeArea[]>();
    matchingTradeAreas.forEach(ta => {
      if (!result.has(ta.impGeofootprintLocation)) {
        result.set(ta.impGeofootprintLocation, [ta]);
      } else {
        result.get(ta.impGeofootprintLocation).push(ta);
      }
    });
    return result;
  }

  ngOnDestroy() : void {
    if (this.locationSubscription) this.locationSubscription.unsubscribe();
  }

  private onLocationChange(locations: ImpGeofootprintLocation[]) {
    // I only want to apply radial defaults to brand new sites after the defaults have been set
    const previousLocations = new Set(this.currentLocations);
    const adds = locations.filter(l => !previousLocations.has(l));
    const availableSiteTypes = Array.from(this.currentDefaults.keys());
    for (const siteType of availableSiteTypes) {
      const currentLocations = adds.filter(l => l.clientLocationTypeCode === siteType);
      this.applyRadialDefaults(this.currentDefaults.get(siteType), siteType, currentLocations);
    }
    this.currentLocations = Array.from(locations);
  }

  private drawTradeAreaBuffers(tradeAreas: ImpGeofootprintTradeArea[]) {
    if (tradeAreas.length === 0) return;
    const tradeAreasWithBuffer = tradeAreas.filter(ta => ta.taType === 'RADIUS');
    const taMap: Map<ImpGeofootprintLocation, ImpGeofootprintTradeArea[]> = ValTradeAreaService.createLocationTradeAreaMap(tradeAreasWithBuffer);
    const clientBufferMap = new Map<ImpGeofootprintLocation, number[]>();
    const competitorBufferMap = new Map<ImpGeofootprintLocation, number[]>();
    for (const [k, v] of Array.from(taMap.entries())) {
      if (k.clientLocationTypeCode === 'Site') {
        clientBufferMap.set(k, v.filter(ta => ta.isActive === 1).map(ta => ta.taRadius));
      } else {
        competitorBufferMap.set(k, v.filter(ta => ta.isActive === 1).map(ta => ta.taRadius));
      }
    }
    this.clientMergeFlag = this.currentDefaults.has('Site') && this.currentDefaults.get('Site').merge;
    this.competitorMergeFlag = this.currentDefaults.has('Competitor') && this.currentDefaults.get('Competitor').merge;
    this.clientBuffers.next(clientBufferMap);
    this.competitorBuffers.next(competitorBufferMap);
  }

  public applyRadialDefaults(tradeAreaDefinition: RadialTradeAreaDefaults, siteType: string, locations?: ImpGeofootprintLocation[]) : void {
    if (tradeAreaDefinition == null) return; // catch startup scenarios when subs fire before we have any real data
    this.currentDefaults.set(siteType, tradeAreaDefinition);

    const locs = (locations == null) ? this.locationService.get() : locations;
    const currentLocations = locs.filter(l => l.clientLocationTypeCode === siteType);
    const locationSet = new Set(currentLocations);
    const removals = this.tradeAreaService.get().filter(ta => locationSet.has(ta.impGeofootprintLocation));
    this.tradeAreasForInsert = [];

    for (const loc of currentLocations) {
      tradeAreaDefinition.radials.forEach((radial, i) => {
        this.tradeAreasForInsert.push(ValTradeAreaService.createTradeArea(radial.radius, i, loc, radial.displayed));
      });
    }

    this.calculateHomegeocodeBuffer(this.tradeAreasForInsert, siteType, currentLocations);

    this.tradeAreaService.remove(removals);
    this.tradeAreaService.add(this.tradeAreasForInsert);
    console.log('Inserting Trade Areas', this.tradeAreasForInsert);
  }

  public calculateHomegeocodeBuffer(tradeAreasForInsert: ImpGeofootprintTradeArea[], siteType: string, currentLocations: ImpGeofootprintLocation[]){
    const impDiscoveryUI: ImpDiscoveryUI[] = this.impDiscoveryService.get();
    const analysisLevel = impDiscoveryUI[0].analysisLevel;
    const portalLayerId = this.appConfig.getLayerIdForAnalysisLevel(analysisLevel, false);
    const geocodesList = currentLocations.map(impGeoLocation => impGeoLocation['homeGeocode']);
    //console.log('length of home geocodes::', geocodesList);
    const geocodesSet = new Set(geocodesList);
    const geocodes = Array.from(geocodesSet);
    //console.log('length of home geocodes filtered::', geocodes);
    let customIndex: number = 0;
    const tas = tradeAreasForInsert.map(ta => ta.taRadius);
    const maxRadius = Math.max(...tas);
    const sub = this.esriQueryService.queryAttributeIn({ portalLayerId: portalLayerId }, 'geocode', geocodes, true).subscribe(graphics => {
      const geosToAdd: ImpGeofootprintGeo[] = [];
      graphics.forEach(graphic => {
         currentLocations.forEach(loc => {
          if (loc.homeGeocode === graphic.attributes['geocode'] && EsriUtils.geometryIsPoint(graphic.geometry)){
            const geocodeDistance =  EsriUtils.getDistance(graphic.geometry, loc.xcoord, loc.ycoord);
            if (geocodeDistance > maxRadius) {
              customIndex++;
              geosToAdd.push(this.createGeo(geocodeDistance, graphic.geometry, loc));
              tradeAreasForInsert.push(ValTradeAreaService.createCustomTradeArea(customIndex, loc, true, 'HOMEGEO CUSTOM'));
            }
          }
        });
      });
      this.impGeoService.add(geosToAdd);
    }, null, () => sub.unsubscribe());
  }

  public  createGeo(distance: number, point: __esri.Point, loc: ImpGeofootprintLocation) : ImpGeofootprintGeo {
    const impGeofootprintGeo: ImpGeofootprintGeo = new ImpGeofootprintGeo();
    impGeofootprintGeo.geocode = loc.homeGeocode;
    impGeofootprintGeo.isActive = 1;
    impGeofootprintGeo.impGeofootprintLocation = loc;
    impGeofootprintGeo.distance = distance;
    impGeofootprintGeo.xCoord = point.x;
    impGeofootprintGeo.yCoord = point.y;
    return impGeofootprintGeo;
  }
}
