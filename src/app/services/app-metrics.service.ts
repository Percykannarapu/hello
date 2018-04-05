import { Injectable, OnDestroy } from '@angular/core';
import { AppConfig } from '../app.config';
import { ImpGeofootprintGeoAttribService } from '../val-modules/targeting/services/ImpGeofootprintGeoAttribService';
import { Subscription } from 'rxjs/Subscription';
import { ImpGeofootprintGeoAttrib } from '../val-modules/targeting/models/ImpGeofootprintGeoAttrib';
import { MetricService } from '../val-modules/common/services/metric.service';
import { Observable } from 'rxjs/Observable';
import { map} from 'rxjs/operators';
import { ImpDiscoveryService } from './ImpDiscoveryUI.service';
import { ImpDiscoveryUI } from '../models/ImpDiscoveryUI';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { isNumber } from '../app.utils';

export interface MetricDefinition {
  metricValue: number;
  metricDefault: number;
  metricCode: () => string;
  metricFriendlyName: string;
  metricCategory: string;
  metricAccumulator: (prevValue: number, currentValue: number) => number;
  metricFormatter: (value: number) => string;
}

@Injectable()
export class ValMetricsService implements OnDestroy {
  private metricSub: Subscription;
  private metricDefinitions: MetricDefinition[] = [];
  private currentDiscoveryVar: ImpDiscoveryUI;
  private isWinter: boolean;
  private useCircBudget: boolean;
  private useTotalBudget: boolean;

  // private currentHH: string;
  // private temp: number;

  public metrics$: Observable<MetricDefinition[]>;

  constructor(private config: AppConfig, private attributeService: ImpGeofootprintGeoAttribService,
              private metricService: MetricService, private discoveryService: ImpDiscoveryService) {
    this.registerMetrics();
    this.metrics$ = this.getMetricObservable();
    this.metricSub = this.metrics$.subscribe(
      metrics => this.onMetricsChanged(metrics)
    );
  }

  ngOnDestroy() : void {
    if (this.metricSub) this.metricSub.unsubscribe();

  }

  private onMetricsChanged(metrics: MetricDefinition[]) {
    if (metrics == null) return;
    for (const metric of metrics) {
      this.metricService.add(metric.metricCategory, metric.metricFriendlyName, metric.metricFormatter(metric.metricValue));
    }
  }

  private onDiscoveryChange(discovery: ImpDiscoveryUI) : void {
    console.log('inside discovery');

    // if (discovery[0].selectedSeason != null && discovery[0].selectedSeason === 'WINTER'){
    //   this.currentHH = 'hhld_w';
    //   console.log('currentHH:::', this.currentHH);
    // }
    // else{
    //   this.currentHH = 'hhld_s';
    // }
    // if (discovery && discovery[0] && discovery[0].circBudget != null && (discovery[0].totalBudget == 0 || discovery[0].totalBudget == null)){
    //   this.temp = discovery[0].circBudget;
    // }
    // if (discovery && discovery[0] && discovery[0].totalBudget != null && discovery[0].totalBudget != 0 && (discovery[0].circBudget == 0 || this.currentDiscoveryVar.circBudget == null) ){
    //     this.temp = discovery[0].totalBudget;
    // }
    // // if both Circ Budget and dollar budget were provided, calculate based on the dollar budget
    // if (discovery && discovery[0] && discovery[0].circBudget && discovery[0].totalBudget != null && discovery[0].circBudget != 0 && discovery[0].totalBudget != 0){
    //     this.temp = discovery[0].totalBudget;
    // }

  }

  private registerMetrics() : void {
    //TODO: this will be deprecated when user's can specify their own metrics
    const householdCount: MetricDefinition = {
      metricValue: 0,
      metricDefault: 0,
      metricCode: () => this.isWinter ? 'hhld_w' : 'hhld_s',
      metricCategory: 'CAMPAIGN',
      metricFriendlyName: 'Household Count',
      metricAccumulator: (p, c) => p + c,
      metricFormatter: v => v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    };
    this.metricDefinitions.push(householdCount);

    const ipCount: MetricDefinition = {
      metricValue: 0,
      metricDefault: 0,
      metricCode: () => 'num_ip_addrs',
      metricCategory: 'CAMPAIGN',
      metricFriendlyName: 'IP Address Count',
      metricAccumulator: (p, c) => p + c,
      metricFormatter: v => v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    };
    this.metricDefinitions.push(ipCount);

    const totalInvestment: MetricDefinition = {
      metricValue: 0,
      metricDefault: 0,
      metricCode: () => this.isWinter ? 'hhld_w' : 'hhld_s',
      metricCategory: 'CAMPAIGN',
      metricFriendlyName: 'Total Investment',
      metricAccumulator: (p, c) => p + (c * this.currentDiscoveryVar.cpm / 1000),
      metricFormatter: v => {
        if (v != null && v != 0) {
          return '$' + (Math.round(v)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        } else {
          return 'N/A';
        }
      }
    };
    this.metricDefinitions.push(totalInvestment);

    const progressToBudget: MetricDefinition = {
      metricValue: 0,
      metricDefault: 0,
      metricCode: () => this.isWinter ? 'hhld_w' : 'hhld_s',
      metricCategory: 'CAMPAIGN',
      metricFriendlyName: 'Progress to Budget',
      metricAccumulator: (p, c) => {
        if (this.useTotalBudget) {
          return p + ((c * this.currentDiscoveryVar.cpm / 1000) / this.currentDiscoveryVar.totalBudget * 100);
        } else if (this.useCircBudget) {
          return p + (c / this.currentDiscoveryVar.circBudget * 100);
        } else {
          return null;
        }
      },
      metricFormatter: v => {
        if (v != null && v !== 0) {
          return (Math.round(v)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' %';
        } else {
            return 'N/A';
        }
      }
    };
    this.metricDefinitions.push(progressToBudget);
  }

  private getMetricObservable() : Observable<MetricDefinition[]> {
    const attribute$ = this.attributeService.storeObservable.pipe(
      map(attributes => attributes.filter(a => a.isActive === 1))
    );
    const discovery$ = this.discoveryService.storeObservable.pipe(
      map(disco => disco != null && disco.length > 0 ? disco[0] : null)
    );
    return combineLatest(attribute$, discovery$).pipe(
      map(([attributes, discovery]) => this.updateDefinitions(attributes, discovery))
    );
  }

  private updateDefinitions(attributes: ImpGeofootprintGeoAttrib[], discovery: ImpDiscoveryUI) : MetricDefinition[] {
    if (discovery == null || attributes == null) return;
    this.currentDiscoveryVar = discovery;
    this.isWinter = (this.currentDiscoveryVar.selectedSeason.toUpperCase() === 'WINTER');
    this.useCircBudget = (isNumber(this.currentDiscoveryVar.circBudget) && this.currentDiscoveryVar.circBudget !== 0);
    this.useTotalBudget = (isNumber(this.currentDiscoveryVar.totalBudget) && this.currentDiscoveryVar.totalBudget !== 0);

    for (const definition of this.metricDefinitions) {
      const usedGeocodes = new Set();
      const values: number[] = [];
      definition.metricValue = definition.metricDefault;
      attributes.filter(a => a.attributeCode === definition.metricCode()).forEach(attribute => {
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
  public getCentroidLayerAttributes() : string[]{
    return ['geocode', 'is_pob_only', 'owner_group_primary', 'cov_frequency'];
  }
}
