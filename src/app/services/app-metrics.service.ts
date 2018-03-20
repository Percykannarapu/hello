import { Injectable, OnDestroy } from '@angular/core';
import { AppConfig } from '../app.config';
import { ImpGeofootprintGeoAttribService } from '../val-modules/targeting/services/ImpGeofootprintGeoAttribService';
import { Subscription } from 'rxjs/Subscription';
import { ImpGeofootprintGeoAttrib } from '../val-modules/targeting/models/ImpGeofootprintGeoAttrib';
import { MetricService } from '../val-modules/common/services/metric.service';
import { ImpDiscoveryService } from './ImpDiscoveryUI.service';

@Injectable()
export class ValMetricsService implements OnDestroy {
  private attributeSub: Subscription;

  private currentAttributes: ImpGeofootprintGeoAttrib[] = [];

  private metricMap: Map<string, number> = new Map<string, number>();

  constructor(private config: AppConfig, private attributeService: ImpGeofootprintGeoAttribService,
              private metricService: MetricService, private discoveryService: ImpDiscoveryService) {
    this.attributeSub = this.attributeService.storeObservable.subscribe(attributes => this.onAttributeChanges(attributes));
  }

  ngOnDestroy() : void {
    if (this.attributeSub) this.attributeSub.unsubscribe();
  }

  private onAttributeChanges(attributes: ImpGeofootprintGeoAttrib[]) {
    if (attributes == null) return;

    const currentSet = new Set(this.currentAttributes);
    const newSet = new Set(attributes);
    const adds = attributes.filter(a => !currentSet.has(a));
    const deletes = this.currentAttributes.filter(a => !newSet.has(a));
    this.calculateMetrics(adds, deletes);
    this.currentAttributes = Array.from(attributes);
  }

  private calculateMetrics(adds: ImpGeofootprintGeoAttrib[], deletes: ImpGeofootprintGeoAttrib[]) {
    if (adds.length > 0) {
      const addMap = {};
      adds.forEach(a => {
        if (!addMap[a.impGeofootprintGeo.geocode]) {
          addMap[a.impGeofootprintGeo.geocode] = {};
        }
        addMap[a.impGeofootprintGeo.geocode][a.attributeCode] = a.attributeValue;
      });

      for (const attributes of Object.values(addMap)) {
        for (const key of this.getLayerAttributes()) {
          this.metricMap.set(key, (this.metricMap.get(key) || 0) + Number(attributes[key]));
        }
      }
    }
    if (deletes.length > 0) {
      const deleteMap = {};
      deletes.forEach(a => {
        if (!deleteMap[a.impGeofootprintGeo.geocode]) {
          deleteMap[a.impGeofootprintGeo.geocode] = {};
        }
        deleteMap[a.impGeofootprintGeo.geocode][a.attributeCode] = a.attributeValue;
      });

      for (const attributes of Object.values(deletes)) {
        for (const key of this.getLayerAttributes()) {
          this.metricMap.set(key, (this.metricMap.get(key) || 0) - Number(attributes[key]));
        }
      }
    }

    const isSummer = this.discoveryService.get()[0].selectedSeason.toLowerCase() === 'summer';
    const hhldCount = (isSummer ? this.metricMap.get('hhld_s') : this.metricMap.get('hhld_w')) || 0;
    const ipCount = this.metricMap.get('num_ip_addrs') || 0;

    this.metricService.add('CAMPAIGN', 'Household Count', hhldCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
    this.metricService.add('CAMPAIGN', 'IP Address Count', ipCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
  }

  public getLayerAttributes() : string[] {
    if (this.config.maxPointsPerGeometryQuery < 0) return []; // noop to force Angular into injecting this. will go away when the class has more code to it
    return ['cl2i00', 'cl0c00', 'cl2prh', 'tap049', 'hhld_w', 'hhld_s', 'num_ip_addrs', 'geocode'];
  }

}
