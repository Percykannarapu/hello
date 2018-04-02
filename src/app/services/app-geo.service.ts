import { Injectable, OnDestroy } from '@angular/core';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { Subscription } from 'rxjs/Subscription';
import { ImpDiscoveryService } from './ImpDiscoveryUI.service';
import { ImpDiscoveryUI } from '../models/ImpDiscoveryUI';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintGeoAttribService } from '../val-modules/targeting/services/ImpGeofootprintGeoAttribService';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ValTradeAreaService } from './app-trade-area.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { EsriUtils } from '../esri-modules/core/esri-utils.service';
import { EsriQueryService } from '../esri-modules/layers/esri-query.service';
import { ImpGeofootprintGeoAttrib } from '../val-modules/targeting/models/ImpGeofootprintGeoAttrib';
import { AppConfig } from '../app.config';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { AppMessagingService } from './app-messaging.service';

@Injectable()
export class ValGeoService implements OnDestroy {
  private tradeAreaSubscription: Subscription;
  private discoverySubscription: Subscription;
  private geoSubscription: Subscription;

  private uniqueSelectedGeocodes: BehaviorSubject<string[]>;
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
    const newTradeAreas = tradeAreas.filter(ta => ta.isActive === 1 && ta.taType === 'RADIUS') || [];
    const currentSet = new Set(this.currentTradeAreas);
    const newSet = new Set(newTradeAreas);
    const adds: ImpGeofootprintTradeArea[] = [];
    const updates: ImpGeofootprintTradeArea[] = [];
    const deletes: ImpGeofootprintTradeArea[] = this.currentTradeAreas.filter(ta => !newSet.has(ta));
    newTradeAreas.forEach(ta => {
      if (currentSet.has(ta)) {
        updates.push(ta);
      } else {
        adds.push(ta);
      }
    });

    this.selectAndPersistGeos(adds, updates, deletes, this.currentAnalysisLevel);
    this.currentTradeAreas = Array.from(newTradeAreas);
  }

  private onDiscoveryChange(discovery: ImpDiscoveryUI[]) : void {
    if (discovery && discovery[0] && discovery[0].analysisLevel && discovery[0].analysisLevel !== this.currentAnalysisLevel) {
      this.geoService.clearAll();
      this.selectAndPersistGeos(this.currentTradeAreas, null, null, discovery[0].analysisLevel);
      this.currentAnalysisLevel = discovery[0].analysisLevel;
    }
  }

  private onGeoChange(geos: ImpGeofootprintGeo[]) {
    console.log('Geo Service onGeoChange. Creating unique list of geocodes...');
    const uniqueGeos: Set<string> = new Set(geos.filter(g => g.isActive === 1).map(g => g.geocode));
    this.uniqueSelectedGeocodes.next(Array.from(uniqueGeos));
  }

  private selectAndPersistGeos(adds: ImpGeofootprintTradeArea[], updates: ImpGeofootprintTradeArea[], deletes: ImpGeofootprintTradeArea[], analysisLevel: string) : void {
    const allGeos: ImpGeofootprintGeo[] = this.geoService.get();

    if (deletes != null && deletes.length > 0) {
      const deletedSet: Set<ImpGeofootprintTradeArea> = new Set(deletes);
      const deletedGeos = allGeos.filter(g => deletedSet.has(g.impGeofootprintTradeArea));
      this.geoService.remove(deletedGeos);
    }
    if (adds != null && adds.length > 0) {
      const layerId = this.config.getLayerIdForAnalysisLevel(analysisLevel, false);
      const queryMap = this.createTradeAreaQueryMap(adds);
      const radii = Array.from(queryMap.keys());
      const maxRadius = Math.max(...radii);
      let allSelectedData: __esri.Graphic[] = [];
      const spinnerKey = 'selectAndPersistGeos';
      this.messagingService.startSpinnerDialog(spinnerKey, 'Calculating Trade Areas...');
      const query$ = this.queryService.queryPointWithBuffer({ portalLayerId: layerId }, queryMap.get(maxRadius), maxRadius, true, ['geocode']);
      const sub = query$.subscribe(
        selections => {
          allSelectedData = allSelectedData.concat(selections);
        },
        err => console.error(err),
        () => {
          let geosToPersist: ImpGeofootprintGeo[] = [];
          radii.forEach(radius => {
            geosToPersist = geosToPersist.concat(this.createGeosToPersist(radius, queryMap.get(radius), allSelectedData));
          });
          this.geoService.add(geosToPersist);
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

  private createGeosToPersist(radius: number, locations: ImpGeofootprintLocation[], centroids: __esri.Graphic[]) : ImpGeofootprintGeo[] {
    const locationSet = new Set(locations);
    const tradeAreas = this.tradeAreaService.get().filter(ta => ta.taRadius === radius && locationSet.has(ta.impGeofootprintLocation));
    const tradeAreaMap = ValTradeAreaService.createLocationTradeAreaMap(tradeAreas);
    const geosToSave: ImpGeofootprintGeo[] = [];
    const centroidMap = new Map(centroids.map<[string, __esri.Geometry]>(g => [g.attributes.geocode, g.geometry]));
    centroidMap.forEach((geometry, geocode) => {
      locations.forEach(loc => {
        if (EsriUtils.geometryIsPoint(geometry)) {
          const currentDistance = EsriUtils.getDistance(geometry, loc.xcoord, loc.ycoord);
          if (currentDistance <= radius) {
            const currentTradeAreas = tradeAreaMap.get(loc);
            if (currentTradeAreas.length > 1) throw new Error('Multiple trade areas defined for the same radius');
            if (currentTradeAreas.length === 1) {
              geosToSave.push(new ImpGeofootprintGeo({
                xCoord: geometry.x,
                yCoord: geometry.y,
                geocode: geocode,
                distance: currentDistance,
                impGeofootprintTradeArea: currentTradeAreas[0],
                impGeofootprintLocation: loc,
                isActive: 1
              }));
            }
          }
        }
      });
    });
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

  public addGeoToCustomTradeArea(geocode: string, geometry: { x: number; y: number }) : void {
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
    const tradeAreas = this.tradeAreaService.get().filter(ta => ta.taType === 'CUSTOM' && ta.impGeofootprintLocation === closestLocation && ta.isActive === 1);
    if (tradeAreas.length === 0) {
      tradeArea = new ImpGeofootprintTradeArea({
        impGeofootprintLocation: closestLocation,
        taType: 'CUSTOM',
        taName: 'Custom Trade Area',
        taNumber: 0,
        isActive: 1
      });
      this.tradeAreaService.add([tradeArea]);
    } else {
      tradeArea = tradeAreas[0];
    }
    const newGeo = new ImpGeofootprintGeo({
      geocode: geocode,
      xCoord: geometry.x,
      yCoord: geometry.y,
      distance: minDistance,
      impGeofootprintLocation: closestLocation,
      impGeofootprintTradeArea: tradeArea,
      isActive: 1
    });
    this.geoService.add([newGeo]);
  }

  public geoSelected(geocode: string, geometry: { x: number, y: number }) {
    const geoSet = new Set(this.uniqueSelectedGeocodes.getValue());
    if (geoSet.has(geocode)) {
      this.deleteGeosByGeocode(geocode);
    } else {
      this.addGeoToCustomTradeArea(geocode, geometry);
    }
  }

  public clearCache(){
    //const
    this.currentTradeAreas = [];
  }
}
