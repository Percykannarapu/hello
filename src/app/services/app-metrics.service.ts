import { Injectable, OnDestroy } from '@angular/core';
import { AppConfig } from '../app.config';
import { ImpGeofootprintGeoAttribService } from '../val-modules/targeting/services/ImpGeofootprintGeoAttribService';
import { Subscription } from 'rxjs/Subscription';
import { ImpGeofootprintGeoAttrib } from '../val-modules/targeting/models/ImpGeofootprintGeoAttrib';
import { MetricService } from '../val-modules/common/services/metric.service';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';
import { ImpDiscoveryService } from './ImpDiscoveryUI.service';
import { ImpDiscoveryUI } from '../models/ImpDiscoveryUI';

export interface MetricDefinition {
  metricValue: number;
  metricDefault: number;
  metricCode: string;
  metricFriendlyName: string;
  metricCategory: string;
  metricAccumulator: (prevValue: number, currentValue: number) => number;
  metricFormatter: (value: number) => string;
}

@Injectable()
export class ValMetricsService implements OnDestroy {
  private metricSub: Subscription;
  private discoverySub: Subscription;
  private metricDefinitions: MetricDefinition[] = [];
  private currentDiscoveryVar: ImpDiscoveryUI;

  public metrics$: Observable<MetricDefinition[]>;

  constructor(private config: AppConfig, private attributeService: ImpGeofootprintGeoAttribService,
              private metricService: MetricService, private discoveryService: ImpDiscoveryService) {
    this.registerMetrics();
    this.generateMetricObservable();

    this.metricSub = this.metrics$.subscribe(metrics => this.onMetricsChanged(metrics));
    this.discoverySub = this.discoveryService.storeObservable.subscribe(d => this.currentDiscoveryVar = d[0]);
  }

  ngOnDestroy() : void {
    if (this.metricSub) this.metricSub.unsubscribe();
    if (this.discoverySub) this.discoverySub.unsubscribe();
  }

  private onMetricsChanged(metrics: MetricDefinition[]) {
    for (const metric of metrics) {
      this.metricService.add(metric.metricCategory, metric.metricFriendlyName, metric.metricFormatter(metric.metricValue));
    }
  }

  private registerMetrics() : void {
    //TODO: this will be deprecated when user's can specify their own metrics
    const householdCount: MetricDefinition = {
      metricValue: 0,
      metricDefault: 0,
      metricCode: 'hhld_s',
      metricCategory: 'CAMPAIGN',
      metricFriendlyName: 'Household Count',
      metricAccumulator: (p, c) => p + c,
      metricFormatter: v => v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    };
    this.metricDefinitions.push(householdCount);
    const ipCount: MetricDefinition = {
      metricValue: 0,
      metricDefault: 0,
      metricCode: 'num_ip_addrs',
      metricCategory: 'CAMPAIGN',
      metricFriendlyName: 'IP Address Count',
      metricAccumulator: (p, c) => p + c,
      metricFormatter: v => v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    };
    this.metricDefinitions.push(ipCount);
    const totalInvestment: MetricDefinition = {
      metricValue: 0,
      metricDefault: 0,
      metricCode: 'hhld_s',
      metricCategory: 'CAMPAIGN',
      metricFriendlyName: 'Total Investment',
      metricAccumulator: (p, c) => p + (c * this.currentDiscoveryVar.cpm / 1000),
      metricFormatter: v => {
        if (v != null) {
          return '$' + (Math.round(v)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        } else {
          return 'N/A';
        }
      }
    };
    this.metricDefinitions.push(totalInvestment);
  }

  private generateMetricObservable() : void {
    this.metrics$ = this.attributeService.storeObservable.pipe(
      map(attributes => attributes.filter(a => a.isActive === 1)),
      map(attributes => this.generateDefinitions(attributes))
    );
  }

  private generateDefinitions(attributes: ImpGeofootprintGeoAttrib[]) : MetricDefinition[] {
    for (const definition of this.metricDefinitions) {
      const usedGeocodes = new Set();
      const values: number[] = [];
      definition.metricValue = definition.metricDefault;
      attributes.filter(a => a.attributeCode === definition.metricCode).forEach(attribute => {
        if (!usedGeocodes.has(attribute.impGeofootprintGeo.geocode)) {
          values.push(Number(attribute.attributeValue));
          usedGeocodes.add(attribute.impGeofootprintGeo.geocode);
        }
      });
      definition.metricValue = values.reduce(definition.metricAccumulator, definition.metricDefault);
    }
    return this.metricDefinitions;
  }

  public getLayerAttributes() : string[] {
    if (this.config.maxPointsPerBufferQuery < 0) return []; // noop to force Angular into injecting this. will go away when the class has more code to it
    return ['cl2i00', 'cl0c00', 'cl2prh', 'tap049', 'hhld_w', 'hhld_s', 'num_ip_addrs', 'geocode'];
  }
}
