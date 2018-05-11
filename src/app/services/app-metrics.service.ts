import { Injectable, OnDestroy } from '@angular/core';
import { AppConfig } from '../app.config';
import { ImpGeofootprintGeoAttribService } from '../val-modules/targeting/services/ImpGeofootprintGeoAttribService';
import { Subscription, Observable, combineLatest } from 'rxjs';
import { ImpGeofootprintGeoAttrib } from '../val-modules/targeting/models/ImpGeofootprintGeoAttrib';
import { MetricService } from '../val-modules/common/services/metric.service';
import { map } from 'rxjs/operators';
import { ImpDiscoveryService } from './ImpDiscoveryUI.service';
import { ImpDiscoveryUI } from '../models/ImpDiscoveryUI';
import { isNumber } from '../app.utils';
import { MessageService } from 'primeng/components/common/messageservice';

export interface MetricDefinition {
  metricValue: number;
  metricDefault: number;
  metricCode: () => string | string[];
  metricFriendlyName: string;
  metricCategory: string;
  compositePreCalc?: (attributes: ImpGeofootprintGeoAttrib[]) => number;
  metricAccumulator: (prevValue: number, currentValue: number) => number;
  metricFormatter: (value: number) => string;
  metricFlag?: boolean;
  calcFlagState?: (d: ImpDiscoveryUI) => boolean;
}

@Injectable()
export class ValMetricsService implements OnDestroy {
  private readonly metricSub: Subscription;
  private metricDefinitions: MetricDefinition[] = [];
  private currentDiscoveryVar: ImpDiscoveryUI;
  private isWinter: boolean;
  private useCircBudget: boolean;
  private useTotalBudget: boolean;

  public metrics$: Observable<MetricDefinition[]>;

  constructor(private config: AppConfig, private attributeService: ImpGeofootprintGeoAttribService,
    private metricService: MetricService, private discoveryService: ImpDiscoveryService, private messageService: MessageService) {
    this.registerMetrics();
    this.metrics$ = this.getMetricObservable();
    this.metricSub = this.metrics$.subscribe(
      metrics => this.onMetricsChanged(metrics)
    );
  }

  public ngOnDestroy(): void {
    if (this.metricSub) this.metricSub.unsubscribe();
  }

  private onMetricsChanged(metrics: MetricDefinition[]) {
    if (metrics == null) return;
    for (const metric of metrics) {
      this.metricService.add(metric.metricCategory, metric.metricFriendlyName, metric.metricFormatter(metric.metricValue), metric.metricFlag);
    }
  }

  private registerMetrics(): void {
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
      metricCode: () => this.isWinter ? ['hhld_w', 'owner_group_primary', 'cov_frequency'] : ['hhld_s', 'owner_group_primary', 'cov_frequency'],
      metricCategory: 'CAMPAIGN',
      metricFriendlyName: 'Est. Total Investment',
      compositePreCalc: t => {
        const attributesMap: Map<string, string> = new Map<string, string>();
        t.forEach(attribute => attributesMap.set(attribute.attributeCode, attribute.attributeValue));
        const season = this.currentDiscoveryVar.selectedSeason === 'WINTER' ? 'hhld_w' : 'hhld_s';
        const currentHH = Number(attributesMap.get(season)) || 0;

        if (attributesMap.has(season)) {
          if (this.currentDiscoveryVar.isBlended && isNumber(this.currentDiscoveryVar.cpm)) {
            return (currentHH * this.currentDiscoveryVar.cpm);
          }
          if (this.currentDiscoveryVar.isDefinedbyOwnerGroup) {
            if (attributesMap.get('owner_group_primary') === 'VALASSIS' && this.currentDiscoveryVar.includeValassis && isNumber(this.currentDiscoveryVar.valassisCPM)) {
              return (currentHH * this.currentDiscoveryVar.valassisCPM);
            } else if (attributesMap.get('owner_group_primary') === 'ANNE' && this.currentDiscoveryVar.includeAnne && isNumber(this.currentDiscoveryVar.anneCPM)) {
              return (currentHH * this.currentDiscoveryVar.anneCPM);
            } else if (attributesMap.get('cov_frequency').toUpperCase() === 'SOLO' && this.currentDiscoveryVar.includeSolo && isNumber(this.currentDiscoveryVar.soloCPM)) {
              return (currentHH * this.currentDiscoveryVar.soloCPM);
            } else return 0;
          } else return 0;
        } else return 0;
      },
      metricAccumulator: (p, c) => p + c,
      metricFormatter: v => {
        if (v != null && v != 0) {
          return '$' + ((Math.round(v / 1000)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
        } else {
          return 'N/A';
        }
      },
      // calcFlagState: d => {
      //   return (d.includeValassis && d.valassisCPM == null) || (d.includeAnne && d.anneCPM == null) || (d.includeSolo && d.soloCPM == null);
      // }
    };
    this.metricDefinitions.push(totalInvestment);

    // const totalInvestment: MetricDefinition = {
    //   metricValue: 0,
    //   metricDefault: 0,
    //   metricCode: () => this.isWinter ? 'hhld_w' : 'hhld_s',
    //   metricCategory: 'CAMPAIGN',
    //   metricFriendlyName: 'Total Investment',
    //   metricAccumulator: (p, c) => p + (c * this.currentDiscoveryVar.cpm / 1000),
    //   metricFormatter: v => {
    //     if (v != null && v != 0) {
    //       return '$' + (Math.round(v)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    //     } else {
    //       return 'N/A';
    //     }
    //   }
    // };
    // this.metricDefinitions.push(totalInvestment);

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
        },
        // calcFlagState: d => {
        //   return (d.includeValassis && d.valassisCPM == null) || (d.includeAnne && d.anneCPM == null) || (d.includeSolo && d.soloCPM == null);
        // }
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

  private updateDefinitions(attributes: ImpGeofootprintGeoAttrib[], discovery: ImpDiscoveryUI): MetricDefinition[] {
    if (discovery == null || attributes == null) return;
    this.currentDiscoveryVar = discovery;
    this.isWinter = (this.currentDiscoveryVar.selectedSeason.toUpperCase() === 'WINTER');
    this.useCircBudget = (isNumber(this.currentDiscoveryVar.circBudget) && this.currentDiscoveryVar.circBudget !== 0);
    this.useTotalBudget = (isNumber(this.currentDiscoveryVar.totalBudget) && this.currentDiscoveryVar.totalBudget !== 0);
    const uniqueGeoAttrCombo = new Set();
    const attributesUniqueByGeo = attributes.reduce((prev, curr) => {
      if (!uniqueGeoAttrCombo.has(curr.impGeofootprintGeo.geocode + curr.attributeCode)) {
        uniqueGeoAttrCombo.add(curr.impGeofootprintGeo.geocode + curr.attributeCode);
        prev.push(curr);
      }
      return prev;
    }, [] as ImpGeofootprintGeoAttrib[]);
    for (const definition of this.metricDefinitions) {
      const values: number[] = [];
      definition.metricValue = definition.metricDefault;
      const code: string | string[] = definition.metricCode();
      if (Array.isArray(code)) {
        if (definition.compositePreCalc == null) throw new Error(`The metric '${definition.metricFriendlyName}' has multiple attributes identified, but no pre-calculator.`);
        const codeSet = new Set(code);
        attributesUniqueByGeo
          .filter(a => codeSet.has(a.attributeCode))
          .reduce((previous, current) => {
            if (previous.has(current.impGeofootprintGeo.geocode)) {
              previous.get(current.impGeofootprintGeo.geocode).push(current);
            } else {
              previous.set(current.impGeofootprintGeo.geocode, [current]);
            }
            return previous;
          }, new Map<string, ImpGeofootprintGeoAttrib[]>())
          .forEach(uniqueAttributes => {
            values.push(Number(definition.compositePreCalc(uniqueAttributes)));
          });
      } else {
        attributesUniqueByGeo
          .filter(a => a.attributeCode === code)
          .forEach(attribute => values.push(Number(attribute.attributeValue)));
      }
      if (definition.calcFlagState != null) definition.metricFlag = definition.calcFlagState(discovery);
      definition.metricValue = values.reduce(definition.metricAccumulator, definition.metricDefault);
    }
    return this.metricDefinitions;
  }

  public getLayerAttributes(): string[] {
    return ['cl2i00', 'cl0c00', 'cl2prh', 'tap049', 'hhld_w', 'hhld_s', 'num_ip_addrs', 'geocode', 'pob', 'owner_group_primary', 'cov_frequency'];
  }

}
