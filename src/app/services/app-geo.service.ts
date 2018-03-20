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
import { ValLayerService } from './app-layer.service';
import { ImpGeofootprintGeoAttrib } from '../val-modules/targeting/models/ImpGeofootprintGeoAttrib';

class QuerySelection {
  x: number;
  y: number;
  geocode: string;
  constructor(graphic: __esri.Graphic) {
    let point: __esri.Point = null;
    if (EsriUtils.geometryIsPoint(graphic.geometry)) {
      point = graphic.geometry;
    }
    if (EsriUtils.geometryIsPolygon(graphic.geometry)) {
      point = graphic.geometry.centroid;
    }
    if (point == null) throw new Error('Invalid geometry type in QuerySelection constructor');
    this.x = point.x;
    this.y = point.y;
    this.geocode = graphic.attributes['geocode'];
  }
}

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
              private queryService: EsriQueryService, private layerService: ValLayerService) {
    this.currentTradeAreas = [];
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
    const newTradeAres = tradeAreas || [];
    const currentSet = new Set(this.currentTradeAreas);
    const newSet = new Set(newTradeAres);
    const adds: ImpGeofootprintTradeArea[] = [];
    const updates: ImpGeofootprintTradeArea[] = [];
    const deletes: ImpGeofootprintTradeArea[] = this.currentTradeAreas.filter(ta => !newSet.has(ta));
    newTradeAres.forEach(ta => {
      if (currentSet.has(ta)) {
        updates.push(ta);
      } else {
        adds.push(ta);
      }
    });

    this.selectAndPersistGeos(adds, updates, deletes, this.currentAnalysisLevel);
    this.currentTradeAreas = Array.from(newTradeAres);
  }

  private onDiscoveryChange(discovery: ImpDiscoveryUI[]) : void {
    if (discovery[0].analysisLevel !== this.currentAnalysisLevel) {
      this.geoService.clearAll();
      this.selectAndPersistGeos(this.currentTradeAreas, null, null, discovery[0].analysisLevel);
      this.currentAnalysisLevel = discovery[0].analysisLevel;
    }
  }

  private onGeoChange(geos: ImpGeofootprintGeo[]) {
    const uniqueGeos: Set<string> = new Set(geos.map(g => g.geocode));
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
      const layerId = this.layerService.getLayerIdForAnalysisLevel(analysisLevel, false);
      const queryMap = this.createTradeAreaQueryMap(adds);
      const radii = Array.from(queryMap.keys());
      radii.forEach(radius => {
        const query$ = this.queryService.queryPointWithBuffer({ portalLayerId: layerId }, queryMap.get(radius), radius, true, ['geocode'], g => new QuerySelection(g));
        const sub = query$.subscribe(selections => {
          this.persistGeos(radius, queryMap.get(radius), selections);
        }, err => console.error(err), () => sub.unsubscribe());
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

  private persistGeos(radius: number, locations: ImpGeofootprintLocation[], selections: QuerySelection[]) : void {
    const locationSet = new Set(locations);
    const tradeAreas = this.tradeAreaService.get().filter(ta => ta.taRadius === radius && locationSet.has(ta.impGeofootprintLocation));
    const tradeAreaMap = ValTradeAreaService.createLocationTradeAreaMap(tradeAreas);
    const geosToSave: ImpGeofootprintGeo[] = [];
    selections.forEach(selection => {
      locations.forEach(loc => {
        const currentDistance = EsriUtils.getDistance(selection.x, selection.y, loc.xcoord, loc.ycoord);
        if (currentDistance <= radius) {
          const currentTradeAreas = tradeAreaMap.get(loc);
          if (currentTradeAreas.length > 1) throw new Error('Multiple trade areas defined for the same radius');
          if (currentTradeAreas.length === 1) {
            geosToSave.push(new ImpGeofootprintGeo({
              xCoord: selection.x,
              yCoord: selection.y,
              geocode: selection.geocode,
              distance: currentDistance,
              impGeofootprintTradeArea: currentTradeAreas[0],
              impGeofootprintLocation: loc
            }));
          }
        }
      });
    });
    this.geoService.add(geosToSave);
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
}
