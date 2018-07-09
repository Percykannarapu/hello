import { Injectable, OnDestroy } from '@angular/core';
import { AppConfig } from '../app.config';
import { ImpGeofootprintGeoAttribService } from '../val-modules/targeting/services/ImpGeofootprintGeoAttribService';
import { Subscription, Observable, combineLatest, zip } from 'rxjs';
import { ImpGeofootprintGeoAttrib } from '../val-modules/targeting/models/ImpGeofootprintGeoAttrib';
import { MetricService } from '../val-modules/common/services/metric.service';
import { filter, map } from 'rxjs/operators';
import { isNumber } from '../app.utils';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { AppStateService, Season } from './app-state.service';

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
  private currentProject: ImpProject;
  private isWinter: boolean;
  private geoCpmMismatch: boolean;
  private currentGeoAttributes: ImpGeofootprintGeoAttrib[] = [];

  public metrics$: Observable<MetricDefinition<any>[]>;
  public mismatch$: Observable<boolean>;

  constructor(private config: AppConfig, private attributeService: ImpGeofootprintGeoAttribService,
    private metricService: MetricService, private stateService: AppStateService) {
    this.registerMetrics();
    this.metrics$ = this.getMetricObservable();
    this.mismatch$ = this.getMismatchObservable();
    this.metricSub = combineLatest(this.mismatch$, this.metrics$).subscribe(
      ([mismatch, metrics]) => {
        this.geoCpmMismatch = mismatch;
        this.onMetricsChanged(metrics);
      });
    this.stateService.currentProject$.subscribe(project => this.currentProject = project);
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
      metricCode: () => this.isWinter ? ['cl2i00', 'hhld_w'] : ['cl2i00', 'hhld_s'],
      metricCategory: 'CAMPAIGN',
      metricFriendlyName: 'Household Count',
      compositePreCalc: t => {
        if (t.length > 1 && t[0].attributeValue != null)
            return Number(t[1].attributeValue);
      },
      metricAccumulator: (p, c) => {
        return c != null ? p + c : p;
      },
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
        const season = this.isWinter ? 'hhld_w' : 'hhld_s';
        const currentHH = Number(attributesMap.get(season)) || 0;
        return currentHH * this.getCpmForGeo(attributesMap.get('owner_group_primary'), attributesMap.get('cov_frequency'));
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
        const season = this.isWinter ? 'hhld_w' : 'hhld_s';
        const currentHH = Number(attributesMap.get(season)) || 0;
        if (this.currentProject.isDollarBudget) {
               return currentHH * this.getCpmForGeo(attributesMap.get('owner_group_primary'), attributesMap.get('cov_frequency'));
        }
        if (this.currentProject.isCircBudget) {
          return currentHH;
        }
      },
      metricAccumulator: (p, c) => {
        if (this.currentProject.isDollarBudget && this.currentProject.totalBudget !== 0) {
            return p + (c / (1000 * this.currentProject.totalBudget));
        } else if (this.currentProject.isCircBudget && this.currentProject.totalBudget !== 0) {
            return p + (c / (this.currentProject.totalBudget));
        } else {
            return null;
        }
      },
      metricFormatter: v => {
        if (v != null && v != 0) {
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
        if (t.length > 1 && t[0].attributeValue != null)
            return { income: Number(t[0].attributeValue) * Number(t[1].attributeValue) , hhc: Number(t[1].attributeValue) };
      },
      metricAccumulator: (p, c) => {
        const result = Object.assign({}, p);
        result.hhc += c != null ? c.hhc : 0;
        result.income += c != null ? c.income : 0;
        return result;
      },
      metricFormatter: v => {
        if (v != null && v.hhc != 0 && v.income != 0){
          const result = v.income / v.hhc;
          return '$' + result.toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }else 
          return 'N/A';
       
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
        if (t.length > 1 && t[0].attributeValue != null)
            return { income: Number(t[0].attributeValue) * Number(t[1].attributeValue) , hhc: Number(t[1].attributeValue) };
      },
      metricAccumulator: (p, c) => {
        const result = Object.assign({}, p);
        result.hhc += c != null ? c.hhc : 0;
        result.income += c != null ? c.income : 0;
        return result;
      },
      metricFormatter: v => {
        if (v != null && v.hhc != 0 && v.income != 0){
          const result = v.income / v.hhc;
          return result.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '%';
        }
        else return 'N/A';
        
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
        if (t.length > 1 && t[0].attributeValue)
            return { income: Number(t[0].attributeValue) * Number(t[1].attributeValue) , hhc: Number(t[1].attributeValue) };
      },
      metricAccumulator: (p, c) =>  {
        const result = Object.assign({}, p);
        result.hhc += c != null ? c.hhc : 0;
        result.income += c != null ? c.income : 0;
        return result;
      },
      metricFormatter: v => {
        if (v != null && v.hhc != 0 && v.income != 0){
        const result = v.income / v.hhc;
        return result.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '%';
       }else return 'N/A';
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
        if (t.length > 1 && t[0].attributeValue)
        return { income: Number(t[0].attributeValue) * Number(t[1].attributeValue) , hhc: Number(t[1].attributeValue) };
      },
      metricAccumulator: (p, c) =>  {
        const result = Object.assign({}, p);
        result.hhc += c != null ? c.hhc : 0;
        result.income += c != null ? c.income : 0;
        return result;
      },
      metricFormatter: v => {
        if (v != null && v.hhc != 0 && v.income != 0){
          const result = v.income / v.hhc;
          return result.toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }
        else return 'N/A';
      }
    };
    this.metricDefinitions.push(casualDining);
  }

  private getMetricObservable() : Observable<MetricDefinition<any>[]> {
    const attribute$ = this.attributeService.storeObservable.pipe(
      map(attributes => attributes.filter(a => a.isActive && a.impGeofootprintGeo.isActive))
    );
    return combineLatest(attribute$, this.stateService.currentProject$, this.stateService.projectIsLoading$).pipe(
      filter(([attributes, discovery, isLoading]) => !isLoading),
      map(([attributes, discovery]) => this.updateDefinitions(attributes, discovery))
    );
  }

  private getMismatchObservable() : Observable<boolean> {
    const geoOwnerTypes$ = this.attributeService.storeObservable.pipe(
      map(attributes => attributes.filter(a => a.isActive && (a.attributeCode === 'owner_group_primary' || a.attributeCode === 'cov_frequency'))),
      map(attributes => {
        return {
          valExists: attributes.filter(a => a.attributeCode === 'owner_group_primary' && a.attributeValue === 'VALASSIS').length > 0,
          anneExists: attributes.filter(a => a.attributeCode === 'owner_group_primary' && a.attributeValue === 'ANNE').length > 0,
          soloExists: attributes.filter(a => a.attributeCode === 'cov_frequency' && a.attributeValue === 'Solo').length > 0
        };
      })
    );

    const validProject$ = this.stateService.currentProject$.pipe(filter(p => p != null));
    return combineLatest(geoOwnerTypes$, validProject$).pipe(
      map(([attributes, project]) => {
        if (isNumber(project.estimatedBlendedCpm)) {
          return false;
        } else {
          return (!isNumber(project.smAnneCpm) && attributes.anneExists) ||
                 (!isNumber(project.smValassisCpm) && attributes.valExists) ||
                 (!isNumber(project.smSoloCpm) && attributes.soloExists);
        }
      })
    );
  }

  private updateDefinitions(attributes: ImpGeofootprintGeoAttrib[], project: ImpProject) : MetricDefinition<any>[] {
    if (project == null || attributes == null) return;
    console.log('Season observable value', this.stateService.season$.getValue());
    this.isWinter = this.stateService.season$.getValue() === Season.Winter;
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

  private getCpmForGeo(ownerGroupPrimary: string, coverageFrequency: string) : number {
    if (isNumber(this.currentProject.estimatedBlendedCpm)) {
      return this.currentProject.estimatedBlendedCpm;
    } else {
      if (ownerGroupPrimary != null && ownerGroupPrimary.toUpperCase() === 'VALASSIS' && this.currentProject.isIncludeValassis && isNumber(this.currentProject.smValassisCpm)) {
        return this.currentProject.smValassisCpm;
      } else if (ownerGroupPrimary != null && ownerGroupPrimary.toUpperCase() === 'ANNE' && this.currentProject.isIncludeAnne && isNumber(this.currentProject.smAnneCpm)) {
        return this.currentProject.smAnneCpm;
      } else if (coverageFrequency != null && coverageFrequency.toUpperCase() === 'SOLO' && this.currentProject.isIncludeSolo && isNumber(this.currentProject.smSoloCpm)) {
        return this.currentProject.smSoloCpm;
      } else {
        return 0;
      }
    }
  }
}
