import { Injectable, OnDestroy } from '@angular/core';
import { AppConfig } from '../app.config';
import { ImpGeofootprintGeoAttribService } from '../val-modules/targeting/services/ImpGeofootprintGeoAttribService';
import { Subscription, Observable, combineLatest, zip } from 'rxjs';
import { ImpGeofootprintGeoAttrib } from '../val-modules/targeting/models/ImpGeofootprintGeoAttrib';
import { MetricService } from '../val-modules/common/services/metric.service';
import { map, filter } from 'rxjs/operators';
import { ImpDiscoveryService } from './ImpDiscoveryUI.service';
import { ImpDiscoveryUI } from '../models/ImpDiscoveryUI';
import { isNumber } from '../app.utils';
import { MessageService } from 'primeng/components/common/messageservice';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';

export interface MetricDefinition<T> {
  metricValue: T;
  metricDefault: T;
  metricCode: () => string | string[];
  metricFriendlyName: string;
  metricCategory: string;
  compositePreCalc?: (attributes: ImpGeofootprintGeoAttrib[]) => T;
  metricAccumulator: (prevValue: T, currentValue: T) => T;
  metricFormatter: (value: T) => string;
  metricFlag?: boolean;
  calcFlagState?: () => boolean;
}

@Injectable()
export class ValMetricsService implements OnDestroy {
  private readonly metricSub: Subscription;
  private metricDefinitions: MetricDefinition<any>[] = [];
  private currentDiscoveryVar: ImpDiscoveryUI;
  private isWinter: boolean;
  private useCircBudget: boolean;
  private useTotalBudget: boolean;
  private geoCpmMismatch: boolean;
  private currentGeoAttributes: ImpGeofootprintGeoAttrib[] = [];

  public metrics$: Observable<MetricDefinition<any>[]>;
  public mismatch$: Observable<boolean>;

  constructor(private config: AppConfig, private attributeService: ImpGeofootprintGeoAttribService,
    private metricService: MetricService, private discoveryService: ImpDiscoveryService, private messageService: MessageService) {
    this.registerMetrics();
    this.metrics$ = this.getMetricObservable();
    this.mismatch$ = this.getMismatchObservable();
    this.metricSub = combineLatest(this.mismatch$, this.metrics$).subscribe(
      ([mismatch, metrics]) => {
        this.geoCpmMismatch = mismatch;
        this.onMetricsChanged(metrics);
      });
  }

  public ngOnDestroy() : void {
    if (this.metricSub) this.metricSub.unsubscribe();
  }

  private onMetricsChanged(metrics: MetricDefinition<any>[]) {
    if (metrics == null) return;
    for (const metric of metrics) {
      this.metricService.add(metric.metricCategory, metric.metricFriendlyName, metric.metricFormatter(metric.metricValue), metric.metricFlag);
    }
  }

  private registerMetrics()   : void {
    //TODO: this will be deprecated when user's can specify their own metrics
    const householdCount: MetricDefinition<number> = {
      metricValue: 0,
      metricDefault: 0,
      metricCode: () => this.isWinter ? 'hhld_w' : 'hhld_s',
      metricCategory: 'CAMPAIGN',
      metricFriendlyName: 'Household Count',
      metricAccumulator: (p, c) => p + c,
      metricFormatter: v => v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    };
    this.metricDefinitions.push(householdCount);

    const ipCount: MetricDefinition<number> = {
      metricValue: 0,
      metricDefault: 0,
      metricCode: () => 'num_ip_addrs',
      metricCategory: 'CAMPAIGN',
      metricFriendlyName: 'IP Address Count',
      metricAccumulator: (p, c) => p + c,
      metricFormatter: v => v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    };
    this.metricDefinitions.push(ipCount);

    const totalInvestment: MetricDefinition<number> = {
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

      calcFlagState: () => {
        return this.geoCpmMismatch;
      }
    };
    this.metricDefinitions.push(totalInvestment);

    const progressToBudget: MetricDefinition<number> = {
      metricValue: 0,
      metricDefault: 0,
      metricCode: () => this.isWinter ? ['hhld_w', 'owner_group_primary', 'cov_frequency'] : ['hhld_s', 'owner_group_primary', 'cov_frequency'],
      metricCategory: 'CAMPAIGN',
      metricFriendlyName: 'Progress to Budget',
      compositePreCalc: t => {
        const attributesMap: Map<string, string> = new Map<string, string>();
        t.forEach(attribute => attributesMap.set(attribute.attributeCode, attribute.attributeValue));
        const season = this.currentDiscoveryVar.selectedSeason === 'WINTER' ? 'hhld_w' : 'hhld_s';
        const currentHH = Number(attributesMap.get(season)) || 0;
        if (this.useTotalBudget) {
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
      } 
      if (this.useCircBudget) {
        return currentHH;
      }
      },
      metricAccumulator: (p, c) => {
        if (this.useTotalBudget) {
          return p + (c / (1000 * this.currentDiscoveryVar.totalBudget));
        } else if (this.useCircBudget) {
          return p + (c / this.currentDiscoveryVar.circBudget);
        } else {
          return null;
        }
      },
      metricFormatter: v => {
        if (v != null && v !== 0) {
          return (Math.round(v * 100)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' %';
        } else {
          return 'N/A';
        }
      },
      calcFlagState: () => {
        return this.geoCpmMismatch;
      }
    };
    this.metricDefinitions.push(progressToBudget);

    const medianHhIncome: MetricDefinition<{ income: number, hhc: number }> = {
      metricValue: { income: 0, hhc: 0 },
      metricDefault: { income: 0, hhc: 0 },
      metricCode: () => this.isWinter ? ['cl2i00', 'hhld_w'] : ['cl2i00', 'hhld_s'],
      metricCategory: 'AUDIENCE',
      metricFriendlyName: 'Median Household Income',
      compositePreCalc: t => {
        if (t.length > 1)
            return { income: Number(t[0].attributeValue) * Number(t[1].attributeValue) , hhc: Number(t[1].attributeValue) };
      },
      metricAccumulator: (p, c) => {
        const result = Object.assign({}, p);
        result.hhc += c.hhc;
        result.income += c.income;
        return result;
      },
      metricFormatter: v => {
        const result = v.income / v.hhc;
        return result.toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      }
    };
    this.metricDefinitions.push(medianHhIncome);

    const familiesRelatedChild: MetricDefinition<{ income: number, hhc: number }> = {
      metricValue: { income: 0, hhc: 0 },
      metricDefault: { income: 0, hhc: 0 },
      metricCode: () => this.isWinter ? ['cl0c00', 'hhld_w'] : ['cl0c00', 'hhld_s'],
      metricCategory: 'AUDIENCE',
      metricFriendlyName: '% \'17 HHs Families with Related Children < 18 Yrs',
      compositePreCalc: t => {
        if (t.length > 1)
            return { income: Number(t[0].attributeValue) * Number(t[1].attributeValue) , hhc: Number(t[1].attributeValue) };      
      },
      metricAccumulator: (p, c) => {
        const result = Object.assign({}, p);
        result.hhc += c.hhc;
        result.income += c.income;
        return result;
      },
      metricFormatter: v => {
        const result = v.income / v.hhc;
        return result.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '%';
      }
    };
    this.metricDefinitions.push(familiesRelatedChild);

    const popHispanicLatino: MetricDefinition<{ income: number, hhc: number }> = {
      metricValue: { income: 0, hhc: 0 },
      metricDefault: { income: 0, hhc: 0 },
      metricCode: () => this.isWinter ? ['cl2prh', 'hhld_w'] : ['cl2prh', 'hhld_s'],
      metricCategory: 'AUDIENCE',
      metricFriendlyName: '% \'17 Pop Hispanic or Latino',
      compositePreCalc: t => {
        if (t.length > 1)
            return { income: Number(t[0].attributeValue) * Number(t[1].attributeValue) , hhc: Number(t[1].attributeValue) };        
      },
      metricAccumulator: (p, c) =>  {
        const result = Object.assign({}, p);
        result.hhc += c.hhc;
        result.income += c.income;
        return result;
      },
      metricFormatter: v => {
        const result = v.income / v.hhc;
        return result.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '%';
      }
    };
    this.metricDefinitions.push(popHispanicLatino);

    const casualDining: MetricDefinition<{ income: number, hhc: number }> = {
      metricValue: { income: 0, hhc: 0 },
      metricDefault: { income: 0, hhc: 0 },
      metricCode: () => this.isWinter ? ['tap049', 'hhld_w'] : ['tap049', 'hhld_s'],
      metricCategory: 'AUDIENCE',
      metricFriendlyName: 'Casual Dining: 10+ Times Past 30 Days',
      compositePreCalc: t => {
        if (t.length > 1)
        return { income: Number(t[0].attributeValue) * Number(t[1].attributeValue) , hhc: Number(t[1].attributeValue) };       
      },
      metricAccumulator: (p, c) =>  {
        const result = Object.assign({}, p);
        result.hhc += c.hhc;
        result.income += c.income;
        return result;
      },
      metricFormatter: v => {
        const result = v.income / v.hhc;
        return result.toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      }
    };
    this.metricDefinitions.push(casualDining);
  }

  private getMetricObservable() : Observable<MetricDefinition<any>[]> {
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

  private getMismatchObservable() : Observable<boolean> {
    const geoOwnerTypes$ = this.attributeService.storeObservable.pipe(
      map(attributes => attributes.filter(a => a.isActive === 1 && (a.attributeCode === 'owner_group_primary' || a.attributeCode === 'cov_frequency'))),
      map(attributes => {
        return {
          valExists: attributes.filter(a => a.attributeCode === 'owner_group_primary' && a.attributeValue === 'VALASSIS').length > 0,
          anneExists: attributes.filter(a => a.attributeCode === 'owner_group_primary' && a.attributeValue === 'ANNE').length > 0,
          soloExists: attributes.filter(a => a.attributeCode === 'cov_frequency' && a.attributeValue === 'Solo').length > 0
        };
      })
    );
    const discovery$ = this.discoveryService.storeObservable.pipe(
      filter(disco => disco != null && disco.length > 0),
      map(disco => disco[0])
    );

    return combineLatest(geoOwnerTypes$, discovery$).pipe(
      map(([attributes, discovery]) => {
        if (!discovery.isDefinedbyOwnerGroup) {
          return false;
        } else {
          return (!isNumber(discovery.anneCPM) && attributes.anneExists) || 
          (!isNumber(discovery.valassisCPM) && attributes.valExists) || 
          (!isNumber(discovery.soloCPM) && attributes.soloExists);
        }
      })
    );
  }

  private updateDefinitions(attributes: ImpGeofootprintGeoAttrib[], discovery: ImpDiscoveryUI) : MetricDefinition<any>[] {
    if (discovery == null || attributes == null || attributes.length === 0) return;
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
      const values: any[] = [];
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
            values.push(definition.compositePreCalc(uniqueAttributes));
            this.currentGeoAttributes = [...uniqueAttributes];
          });
      } else {
        attributesUniqueByGeo
          .filter(a => a.attributeCode === code)
          .forEach(attribute => values.push(attribute.attributeValue));
      }
      if (definition.calcFlagState != null) definition.metricFlag = definition.calcFlagState();
      definition.metricValue = values.reduce(definition.metricAccumulator, definition.metricDefault);
    }
    return this.metricDefinitions;
  }

  public getLayerAttributes() : string[] {
    return ['cl2i00', 'cl0c00', 'cl2prh', 'tap049', 'hhld_w', 'hhld_s', 'num_ip_addrs', 'geocode', 'pob', 'owner_group_primary', 'cov_frequency', 'dma_name', 'cov_desc'];
  }

}
