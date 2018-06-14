import { Injectable, OnDestroy } from '@angular/core';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { Subscription, BehaviorSubject, Observable } from 'rxjs';
import { ImpDiscoveryService } from './ImpDiscoveryUI.service';
import { ImpDiscoveryUI } from '../models/ImpDiscoveryUI';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintGeoAttribService } from '../val-modules/targeting/services/ImpGeofootprintGeoAttribService';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ValTradeAreaService } from './app-trade-area.service';
import { EsriUtils } from '../esri-modules/core/esri-utils.service';
import { EsriQueryService } from '../esri-modules/layers/esri-query.service';
import { ImpGeofootprintGeoAttrib } from '../val-modules/targeting/models/ImpGeofootprintGeoAttrib';
import { AppConfig } from '../app.config';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { AppMessagingService } from './app-messaging.service';
import { toUniversalCoordinates } from '../app.utils';

@Injectable()
export class ValGeoService implements OnDestroy {
  private tradeAreaSubscription: Subscription;
  private discoverySubscription: Subscription;
  private geoSubscription: Subscription;

  public uniqueSelectedGeocodes: BehaviorSubject<string[]>;
  private currentTradeAreas: ImpGeofootprintTradeArea[];
  private currentAnalysisLevel: string;

  public uniqueSelectedGeocodes$: Observable<string[]>;

  constructor(private tradeAreaService: ImpGeofootprintTradeAreaService, private discoveryService: ImpDiscoveryService,
              private geoService: ImpGeofootprintGeoService, private attributeService: ImpGeofootprintGeoAttribService,
              private locationService: ImpGeofootprintLocationService, private messagingService: AppMessagingService,
              private queryService: EsriQueryService, private config: AppConfig) {
    this.currentTradeAreas = [];
    this.currentAnalysisLevel = '';
    this.uniqueSelectedGeocodes = new BehaviorSubject<string[]>([]);
    this.uniqueSelectedGeocodes$ = this.uniqueSelectedGeocodes.asObservable();
    this.tradeAreaSubscription = this.tradeAreaService.storeObservable.subscribe(tradeAreas => this.onTradeAreaChange(tradeAreas));
    this.discoverySubscription = this.discoveryService.storeObservable.subscribe(discovery => this.onDiscoveryChange(discovery));
    this.geoSubscription = this.geoService.storeObservable.subscribe(geos => this.onGeoChange(geos));
  }

  ngOnDestroy() : void {
    if (this.tradeAreaSubscription) this.tradeAreaSubscription.unsubscribe();
    if (this.discoverySubscription) this.discoverySubscription.unsubscribe();
    if (this.geoSubscription) this.geoSubscription.unsubscribe();
  }

  private onTradeAreaChange(tradeAreas: ImpGeofootprintTradeArea[]) : void {
    // newTradeAreas are the subset of trade areas from the data store that we are interested in
    const newTradeAreas = tradeAreas.filter(ta => ta.isActive === 1 && ta.taType === 'RADIUS' && ta.impGeofootprintLocation.clientLocationTypeCode === 'Site') || [];
    const currentSet = new Set(this.currentTradeAreas);
    const newSet = new Set(newTradeAreas);
    const adds: ImpGeofootprintTradeArea[] = [];
    const updates: ImpGeofootprintTradeArea[] = [];
    const deletes: ImpGeofootprintTradeArea[] = this.currentTradeAreas.filter(ta => !newSet.has(ta));
    newTradeAreas.forEach(ta => {
       // Trade areas are considered new if they do not have a gtaId or the id is a surrogate id (< 1000; assigned when creating new unsaved trade areas)
      if (currentSet.has(ta) || (ta.gtaId != null && ta.gtaId > 1000)) {
        updates.push(ta);
      } else {
        adds.push(ta);
      }
    });
    console.log('New Trade Area count: ' + adds.length);
    console.log('Updated Trade Area count: ' + updates.length);
    console.log('Removed Trade Area count: ' + deletes.length);
    this.clearTradeAreas(deletes);
    this.selectAndPersistGeos(adds);
    this.currentTradeAreas = Array.from(newTradeAreas);
  }

  private onDiscoveryChange(discovery: ImpDiscoveryUI[]) : void {
     if (discovery == null || discovery.length == 0 || discovery[0] == null)
        return;
    console.log('app-geo.service.onDiscoveryChange - discovery analysisLevel', (discovery != null && discovery.length > 0) ? discovery[0].analysisLevel : null, ' currentAnalysisLevel: ', this.currentAnalysisLevel);
    if (discovery && discovery[0] && discovery[0].analysisLevel && discovery[0].analysisLevel !== this.currentAnalysisLevel) {
       console.log('Clearing all attributes');
      this.attributeService.clearAll();
      this.currentAnalysisLevel = discovery[0].analysisLevel;
    }
    console.log('this.discoveryService.needsGeoRefresh: ', this.discoveryService.needsGeoRefresh);
    console.log('discovery[0].analysisLevel: ', discovery[0].analysisLevel);
    if (this.discoveryService.needsGeoRefresh && discovery && discovery[0] && discovery[0].analysisLevel != null && discovery[0].analysisLevel !== '') {
       console.log('REFRESHING GEOS');
      this.geoService.clearAll();
      this.currentTradeAreas = this.tradeAreaService.get();
      this.selectAndPersistGeos(this.currentTradeAreas);
      this.discoveryService.needsGeoRefresh = false;
    }
   }

  private onGeoChange(geos: ImpGeofootprintGeo[]) {
    console.log('Geo Service onGeoChange. Creating unique list of geocodes from ', (geos != null) ? geos.length : 0, ' geos');
    const uniqueGeos: Set<string> = new Set();
    const length = geos.length;
    for (let i = 0; i < length; ++i) {
//    console.log('app-geo.service.onGeoChange - processing geo: ', geos[i], ' isActive: ', geos[i].isActive);
      if (geos[i].isActive) {
        uniqueGeos.add(geos[i].geocode);
      }
    }
    console.log('app-geo.service.onGeoChange - # unique geos: ', (uniqueGeos != null) ? uniqueGeos.size : null);
    this.uniqueSelectedGeocodes.next(Array.from(uniqueGeos));
  }

  private selectAndPersistGeos(tradeAreas: ImpGeofootprintTradeArea[]) : void {
     console.log("app-geo.service.selectAndPersistGeos - fired - tradeAreas: ", tradeAreas.length);
     
    if (tradeAreas != null && tradeAreas.length > 0) {
      const layerId = this.config.getLayerIdForAnalysisLevel(this.currentAnalysisLevel, false);
      const queryMap = this.createTradeAreaQueryMap(tradeAreas);
      const radii = Array.from(queryMap.keys());
      const maxRadius = Math.max(...radii);
      let allSelectedData: __esri.Graphic[] = [];
      const spinnerKey = 'selectAndPersistGeos';
      this.messagingService.startSpinnerDialog(spinnerKey, 'Calculating Trade Areas...');
      const query$ = this.queryService.queryPointWithBuffer(layerId, toUniversalCoordinates(queryMap.get(maxRadius)), maxRadius, false, ['geocode', 'owner_group_primary', 'cov_frequency', 'is_pob_only', 'latitude', 'longitude']);
      const sub = query$.subscribe(
        selections => {
          allSelectedData = allSelectedData.concat(selections);
        },
        err => console.error(err),
        () => {
           console.log('Selecting geos to persist');
           
          let geosToPersist: ImpGeofootprintGeo[] = [];
          let count: number = 0;
          radii.forEach(radius => {
            if (radii.length > 1 && count > 0) {
              geosToPersist = geosToPersist.concat(this.createGeosToPersist(radius, queryMap.get(radius), allSelectedData, radii[count - 1]));
            } else {
              geosToPersist = geosToPersist.concat(this.createGeosToPersist(radius, queryMap.get(radius), allSelectedData));
            }
            count++;
          });
          //console.log ('geoService size before: ', this.geoService.storeLength);
          //console.log ('app-geo.service.selectAndPersistGeos: ', (geosToPersist != null) ? geosToPersist.length : 0);
          this.geoService.add(geosToPersist);
          //console.log ('geoService size after: ', this.geoService.storeLength);
          sub.unsubscribe();
          this.messagingService.stopSpinnerDialog(spinnerKey);
        });
    }
  }

  private createTradeAreaQueryMap(tradeAreas: ImpGeofootprintTradeArea[]) : Map<number, ImpGeofootprintLocation[]> {
    const result = new Map<number, ImpGeofootprintLocation[]>();
    tradeAreas.forEach(ta => {
      if (result.has(ta.taRadius)) {
        result.get(ta.taRadius).push(ta.impGeofootprintLocation);
      } else {
        result.set(ta.taRadius, [ta.impGeofootprintLocation]);
      }
    });
    return result;
  }

  private clearTradeAreas(tradeAreas: ImpGeofootprintTradeArea[]) : void {
    const deletedSet: Set<ImpGeofootprintTradeArea> = new Set(tradeAreas);
    const deletedGeos = this.geoService.get().filter(g => deletedSet.has(g.impGeofootprintTradeArea));
    const deletedGeoSet = new Set(deletedGeos);
    const deletedAttributes = this.attributeService.get().filter(att => deletedGeoSet.has(att.impGeofootprintGeo));
    this.geoService.remove(deletedGeos);
    this.attributeService.remove(deletedAttributes);
  }

   private createGeosToPersist(radius: number, locations: ImpGeofootprintLocation[], centroids: __esri.Graphic[], previousRadius?: number) : ImpGeofootprintGeo[] {
      // console.log("app-geo.service.createGeosToPersist - fired: locations: ", locations.length, ", centroids: ", centroids.length);
      if (!previousRadius) previousRadius = 0;
      const locationSet = new Set(locations);
      const tradeAreas = this.tradeAreaService.get().filter(ta => ta.taRadius === radius && locationSet.has(ta.impGeofootprintLocation));
      const tradeAreaMap = ValTradeAreaService.createLocationTradeAreaMap(tradeAreas);
      const geosToSave: ImpGeofootprintGeo[] = [];
      const latestDiscovery = this.discoveryService.get();
      const includeValassis = latestDiscovery[0].includeValassis;
      const includeAnne = latestDiscovery[0].includeAnne;
      const includeSolo = latestDiscovery[0].includeSolo;
      const includePob = latestDiscovery[0].includePob;
      const filteredCentroids = centroids.filter(c => {
         return (c.attributes.is_pob_only !== 1 || (c.attributes.is_pob_only === 1 && includePob)) && (
                (c.attributes.owner_group_primary == null)
                ? (includeSolo) 
                : ((c.attributes.owner_group_primary.toUpperCase() !== 'ANNE'     || (c.attributes.owner_group_primary.toUpperCase() === 'ANNE' && includeAnne))
                && (c.attributes.owner_group_primary.toUpperCase() !== 'VALASSIS' || (c.attributes.owner_group_primary.toUpperCase() === 'VALASSIS' && includeValassis))
                && (c.attributes.cov_frequency == null || c.attributes.cov_frequency.toUpperCase() !== 'SOLO' || (c.attributes.cov_frequency != null && c.attributes.cov_frequency.toUpperCase() === 'SOLO' && includeSolo))
                  ));

            // return (c.attributes.is_pob_only === 1 && includePob)
            // ||  (c.attributes.owner_group_primary != null && c.attributes.owner_group_primary.toUpperCase() === 'ANNE'     && includeAnne)
            // ||  (c.attributes.owner_group_primary != null && c.attributes.owner_group_primary.toUpperCase() === 'VALASSIS' && includeValassis)
            // ||  (c.attributes.cov_frequency       != null && c.attributes.cov_frequency.toUpperCase()       === 'SOLO'     && includeSolo)
            // ||  ((c.attributes.owner_group_primary == null || c.attributes.owner_group_primary == '') && includeSolo);
            
      });
      // Collect filtered out centroids in another list
      const inActiveCentroids = centroids.filter(c => !filteredCentroids.includes(c));

      console.log("=========================================================================");
      console.log('# Centroids:          ', (centroids         != null) ? centroids.length.toString() : "0");
      console.log('# filtered centroids: ', (filteredCentroids != null) ? filteredCentroids.length.toString() : "0");
      console.log('# InActive centroids: ', (inActiveCentroids != null) ? inActiveCentroids.length.toString() : "0");
      console.log("=========================================================================");    

      // I could add the filtered and unfiltered geos in one pass, but would have to check if the current geo
      // is in one list or the other.  Going to process them seperately as it seems like it would be faster
      const centroidMap = new Map(filteredCentroids.map<[string, __esri.Graphic]>(g => [g.attributes.geocode, g]));
      //console.log('centroidMap.size: ', centroidMap.size.toString());

      centroidMap.forEach((graphic, geocode) => {
         locations.forEach(loc => {
            const currentDistance = EsriUtils.getDistance(graphic.attributes.longitude, graphic.attributes.latitude, loc.xcoord, loc.ycoord);
            if (currentDistance <= radius && currentDistance > previousRadius) {
               const currentTradeAreas = tradeAreaMap.get(loc);
               if (currentTradeAreas.length > 1) throw new Error('Multiple trade areas defined for the same radius');
               if (currentTradeAreas.length === 1) {
                  geosToSave.push(new ImpGeofootprintGeo({
                     xcoord: graphic.attributes.longitude,
                     ycoord: graphic.attributes.latitude,
                     geocode: geocode,
                     distance: currentDistance,
                     impGeofootprintTradeArea: currentTradeAreas[0],
                     impGeofootprintLocation: loc,
                     isActive: true
                  }));
               }
            }
         });
      });
      console.log('createGeosToPersist - geosToSave filtered: ', (geosToSave != null) ? geosToSave.length.toString() : "0");
      
      // Process filtered out geos
      const inActiveCentroidMap = new Map(inActiveCentroids.map<[string, __esri.Graphic]>(g => [g.attributes.geocode, g]));
      inActiveCentroidMap.forEach((graphic, geocode) => {
         locations.forEach(loc => {
            const currentDistance = EsriUtils.getDistance(graphic.attributes.longitude, graphic.attributes.latitude, loc.xcoord, loc.ycoord);            
            if (currentDistance <= radius && currentDistance > previousRadius) {
               const currentTradeAreas = tradeAreaMap.get(loc);
               if (currentTradeAreas.length > 1) throw new Error('Multiple trade areas defined for the same radius');
               if (currentTradeAreas.length === 1) {
                  let newGeo = new ImpGeofootprintGeo({
                     xcoord: graphic.attributes.longitude,
                     ycoord: graphic.attributes.latitude,
                     geocode: geocode,
                     distance: currentDistance,
                     impGeofootprintTradeArea: currentTradeAreas[0],
                     impGeofootprintLocation: loc,
                     isActive: false
                  });
                  newGeo['filterReasons']="";

                  // Set Transitory Properties on the geo
                  //console.log('setting transitory properties on the geo')
                  if (graphic != null && graphic.attributes != null)
                  {
                     if (graphic.attributes.is_pob_only === 1 && !includePob){
                        newGeo['filterReasons'] += ((newGeo['filterReasons'] === "") ? "" : ", ") + 'POB';
                     }                        
                     if (graphic.attributes.owner_group_primary != null && graphic.attributes.owner_group_primary.toUpperCase() === 'ANNE' && !includeAnne){
                        newGeo['filterReasons'] += ((newGeo['filterReasons'] === "") ? "" : ", ") + 'ANNE';
                     }
                     if (graphic.attributes.owner_group_primary != null && graphic.attributes.owner_group_primary.toUpperCase() === 'VALASSIS' && !includeValassis){
                        newGeo['filterReasons'] += ((newGeo['filterReasons'] === "") ? "" : ", ") + 'Valassis';
                     }
                     if (graphic.attributes.owner_group_primary == null && !includeSolo ||
                        graphic.attributes.cov_frequency        != null && graphic.attributes.cov_frequency.toUpperCase() === 'SOLO' && !includeSolo){
                        newGeo['filterReasons'] += ((newGeo['filterReasons'] === "") ? "" : ", ") + 'Solo';
                     }

                     // If there were filter reasons, create the text for the tooltip
                     if (newGeo['filterReasons'] !== '')
                        newGeo['filterReasons']="Filtered because: " + newGeo['filterReasons'];
                  }
                  
                  geosToSave.push(newGeo);
               }
            }
         //}
         });
      });
      console.log('createGeosToPersist - geosToSave filtered & unfiltered: ', (geosToSave != null) ? geosToSave.length.toString() : "0");
      return geosToSave;
  }

  public updatedGeoAttributes(attributesForUpdate: any[]) {
    const currentGeos = this.geoService.get();
    const isSummer = this.discoveryService.get()[0].selectedSeason.toLowerCase() === 'summer';
    const geoMap = new Map<string, ImpGeofootprintGeo[]>();
    currentGeos.forEach(g => {
      if (geoMap.has(g.geocode)) {
        geoMap.get(g.geocode).push(g);
      } else {
        geoMap.set(g.geocode, [g]);
      }
    });
    const newAttributes: ImpGeofootprintGeoAttrib[] = [];
    for (const attribute of attributesForUpdate) {
      if (attribute.geocode && geoMap.has(attribute.geocode)) {
        geoMap.get(attribute.geocode).forEach(geo => {
          geo.hhc = Number(isSummer ? attribute.hhld_s : attribute.hhld_w);
          Object.entries(attribute).forEach(([k, v]) => {
            const newAtt = new ImpGeofootprintGeoAttrib({
              attributeCode: k,
              attributeValue: v,
              isActive: 1,
              impGeofootprintGeo: geo
            });
            newAttributes.push(newAtt);
          });
        });
      }
    }
    this.attributeService.add(newAttributes);
  }

  public createAttributesForGeos(geocode: string, attribute: ImpGeofootprintGeoAttrib) : ImpGeofootprintGeoAttrib[] {
    const geos = this.geoService.get().filter(geo => geo.geocode === geocode);
    const result = [];
    for (const geo of geos) {
      const newAttribute = Object.assign({}, attribute);
      newAttribute.impGeofootprintGeo = geo;
      result.push(newAttribute);
    }
    return result;
  }

  public deleteGeosByGeocode(geocode: string) : void {
    const geosToDelete = this.geoService.get().filter(geo => geo.geocode === geocode);
    const deleteSet = new Set(geosToDelete);
    const attribsToDelete = this.attributeService.get().filter(att => deleteSet.has(att.impGeofootprintGeo));
    this.attributeService.remove(attribsToDelete);
    this.geoService.remove(geosToDelete);
  }

  public addGeoToManualTradeArea(geocode: string, geometry: { x: number; y: number }) : void {
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
      .filter(ta => ta.taType === 'CUSTOM' && ta.taName === tradeAreaName && ta.impGeofootprintLocation === closestLocation && ta.isActive === 1);
    if (tradeAreas.length === 0) {
      tradeArea = new ImpGeofootprintTradeArea({
        impGeofootprintLocation: closestLocation,
        taType: 'CUSTOM',
        taName: tradeAreaName,
        taNumber: 0,
        isActive: 1
      });
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
    this.geoService.add([newGeo]);
  }

  public toggleGeoSelection(geocode: string, geometry: { x: number, y: number }) {
    const geoSet = new Set(this.uniqueSelectedGeocodes.getValue());
    if (geoSet.has(geocode)) {
      this.deleteGeosByGeocode(geocode);
    } else {
      this.addGeoToManualTradeArea(geocode, geometry);
    }
  }

  public clearCache(){
    //const
    this.currentTradeAreas = [];
  }
}
