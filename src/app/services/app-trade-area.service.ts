import { Injectable, OnDestroy } from '@angular/core';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { Subscription, BehaviorSubject } from 'rxjs';
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

  private readonly locationSubscription: Subscription;
  private readonly tradeAreaSubscription: Subscription;

  private currentDefaults = new Map<string, RadialTradeAreaDefaults>();
  private currentLocations: ImpGeofootprintLocation[];
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
    if (this.tradeAreaSubscription) this.tradeAreaSubscription.unsubscribe();
  }

  private onLocationChange(locations: ImpGeofootprintLocation[]) {
    // I only want to apply radial defaults to brand new sites after the defaults have been set
    const previousLocations = new Set(this.currentLocations);
    // Only interested in locations that are truely new.  Having a glId that is from the database tells us its not new
    const adds = locations.filter(l => !previousLocations.has(l) && (l.glId == null || l.glId < 1000));
    const availableSiteTypes = Array.from(this.currentDefaults.keys());
    for (const siteType of availableSiteTypes) {
      const currentLocations = adds.filter(l => l.clientLocationTypeCode === siteType);
      this.applyRadialDefaults(this.currentDefaults.get(siteType), siteType, currentLocations);
    }
    this.currentLocations = Array.from(locations);
  }

  private drawTradeAreaBuffers(tradeAreas: ImpGeofootprintTradeArea[]) {
    const tradeAreasWithBuffer = tradeAreas.filter(ta => ta.taType === 'RADIUS');
    const taMap: Map<ImpGeofootprintLocation, ImpGeofootprintTradeArea[]> = ValTradeAreaService.createLocationTradeAreaMap(tradeAreasWithBuffer);
    const clientBufferMap = new Map<ImpGeofootprintLocation, number[]>();
    const competitorBufferMap = new Map<ImpGeofootprintLocation, number[]>();
    for (const [k, v] of Array.from(taMap.entries())) {
      if (k != null) {
         if (k.clientLocationTypeCode === 'Site') {
         clientBufferMap.set(k, v.filter(ta => ta.isActive === 1).map(ta => ta.taRadius));
         } else {
         competitorBufferMap.set(k, v.filter(ta => ta.isActive === 1).map(ta => ta.taRadius));
         }
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
    if (siteType === 'Site'){
    this.calculateHomegeocodeBuffer(this.tradeAreasForInsert, siteType, currentLocations);
    }
    this.tradeAreaService.remove(removals);
    this.tradeAreaService.add(this.tradeAreasForInsert);
    console.log('Inserting Trade Areas', this.tradeAreasForInsert);
  }

  public calculateHomegeocodeBuffer(tradeAreasForInsert: ImpGeofootprintTradeArea[], siteType: string, currentLocations: ImpGeofootprintLocation[]) {
    if (siteType === 'Competitor') return;
    const impDiscoveryUI: ImpDiscoveryUI[] = this.impDiscoveryService.get();
    const analysisLevel = impDiscoveryUI[0].analysisLevel;
    const portalLayerId = this.appConfig.getLayerIdForAnalysisLevel(analysisLevel, false);
    const geocodesList = currentLocations.map(impGeoLocation => impGeoLocation['homeGeocode']);    
    //console.log('length of home geocodes::', geocodesList);
    const geocodesSet = new Set(geocodesList);
    const geocodes = Array.from(geocodesSet);
    if (geocodes[0] == undefined) {
      console.warn('Attempted to define a trade area for a site without a home geocode');
      return; // TODO: Is this correct behavior for DE1765? It seems to work
    }
    //console.log('length of home geocodes filtered::', geocodes);
    let customIndex: number = tradeAreasForInsert.length + 1; // 0;
    const tas = tradeAreasForInsert.map(ta => ta.taRadius);
    const maxRadius = Math.max(...tas);
    const sub = this.esriQueryService.queryAttributeIn(portalLayerId, 'geocode', geocodes, true).subscribe(graphics => {
      const geosToAdd: ImpGeofootprintGeo[] = [];
      graphics.forEach(graphic => {
         currentLocations.forEach(loc => {
          if (loc.homeGeocode === graphic.attributes['geocode'] && EsriUtils.geometryIsPoint(graphic.geometry)){
            const geocodeDistance =  EsriUtils.getDistance(graphic.geometry, loc.xcoord, loc.ycoord);
            if (geocodeDistance > maxRadius) {
              customIndex++;
              const ta: ImpGeofootprintTradeArea = ValTradeAreaService.createCustomTradeArea(customIndex, loc, true, 'HOMEGEO CUSTOM');
              geosToAdd.push(this.createGeo(geocodeDistance, graphic.geometry, loc, ta));
              tradeAreasForInsert.push(ta);
            }
          }
//        console.log (customIndex, ') Custom Trade Areas: ', tradeAreasForInsert.filter(ta => ta.taType === 'HOMEGEO CUSTOM'));
         });
      });
      this.impGeoService.add(geosToAdd.filter(g => g.impGeofootprintTradeArea.taType === 'HOMEGEO CUSTOM'));
//      console.log('tradeAreasForInsert = ', tradeAreasForInsert)
   }, null, () => {
      this.tradeAreaService.add(tradeAreasForInsert.filter(ta => ta.taType === 'HOMEGEO CUSTOM'));
      sub.unsubscribe();
      });
  }

  public  createGeo(distance: number, point: __esri.Point, loc: ImpGeofootprintLocation, ta?: ImpGeofootprintTradeArea) : ImpGeofootprintGeo {
    const impGeofootprintGeo: ImpGeofootprintGeo = new ImpGeofootprintGeo();
    impGeofootprintGeo.geocode = loc.homeGeocode;
    impGeofootprintGeo.isActive = true;
    impGeofootprintGeo.impGeofootprintLocation = loc;
    impGeofootprintGeo.distance = distance;
    impGeofootprintGeo.xcoord = point.x;
    impGeofootprintGeo.ycoord = point.y;
    if (ta != null)
       impGeofootprintGeo.impGeofootprintTradeArea = ta;
    return impGeofootprintGeo;
  }
}
