import { Injectable, OnDestroy } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { AppConfig } from '../app.config';
import { GeoAttribute } from '../impower-datastore/state/geo-attributes/geo-attributes.model';
import { selectGeoAttributeEntities, selectGeoAttributes } from '../impower-datastore/state/impower-datastore.selectors';
import { FullAppState } from '../state/app.interfaces';
import { Subscription, Observable, combineLatest } from 'rxjs';
import { MetricService } from '../val-modules/common/services/metric.service';
import { filter, map, take, withLatestFrom } from 'rxjs/operators';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { AppStateService, Season } from './app-state.service';
import { isNumber } from '@val/common';

export interface MetricDefinition<T> {
  metricValue: T;
  metricDefault: T;
  metricFriendlyName: string;
  metricCategory: string;
  valueCalc: (attributes: { [code: string] : any }) => T;
  metricAccumulator: (prevValue: T, currentValue: T) => T;
  metricFormatter: (value: T) => string;
  metricFlag?: boolean;
  calcFlagState?: () => boolean;
}

@Injectable()
export class ValMetricsService implements OnDestroy {
  private metricSub: Subscription;
  private metricDefinitions: MetricDefinition<any>[] = [];
  private currentProject: ImpProject;
  private isWinter: boolean;
  private geoCpmMismatch: boolean;
  private mismatch$: Observable<boolean>;

  constructor(private config: AppConfig,
              private metricService: MetricService,
              private stateService: AppStateService,
              private store$: Store<FullAppState>) {
    this.registerMetrics();
    this.stateService.applicationIsReady$.pipe(
      filter(isReady => isReady),
      take(1)
    ).subscribe(() => {
      this.stateService.currentProject$.subscribe(project => this.currentProject = project);
      this.mismatch$ = this.getMismatchObservable();
      this.mismatch$.subscribe(mismatch => this.geoCpmMismatch = mismatch);
    });
  }

  public ngOnDestroy() : void {
    if (this.metricSub) this.metricSub.unsubscribe();
  }

  public onMetricsChanged(metrics: MetricDefinition<any>[]) {
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
      metricCategory: 'CAMPAIGN',
      metricFriendlyName: 'Household Count',
      valueCalc: t => {
        return this.isWinter ? t['hhld_w'] : t['hhld_s'];
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
      metricCategory: 'CAMPAIGN',
      metricFriendlyName: 'IP Address Count',
      valueCalc: t => t['num_ip_addrs'],
      metricAccumulator: (p, c) => p + c,
      metricFormatter: v => v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    };
    this.metricDefinitions.push(ipCount);

    const totalInvestment: MetricDefinition<number> = {
      metricValue: 0,
      metricDefault: 0,
      metricCategory: 'CAMPAIGN',
      metricFriendlyName: 'Est. Total Investment',
      valueCalc: t => {
        const season = this.isWinter ? 'hhld_w' : 'hhld_s';
        const currentHH = Number(t[season]) || 0;
        const cpm = this.getCpmForGeo(t['owner_group_primary'], t['cov_frequency']);
        return currentHH * cpm;
      },
      metricAccumulator: (p, c) => p + c,
      metricFormatter: v => {
        if (v != null && v !== 0) {
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
      metricCategory: 'CAMPAIGN',
      metricFriendlyName: 'Progress to Budget',
      valueCalc: t => {
        const season = this.isWinter ? 'hhld_w' : 'hhld_s';
        const currentHH = Number(t[season]) || 0;
        const cpm = this.getCpmForGeo(t['owner_group_primary'], t['cov_frequency']);
        if (this.currentProject.isDollarBudget) {
          return currentHH * cpm;
        } else {
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
      metricCategory: 'AUDIENCE',
      metricFriendlyName: 'Median Household Income',
      valueCalc: t => {
        const hh = this.isWinter ? 'hhld_w' : 'hhld_s';
        if (t['cl2i00'] != null) {
          return {
            income: Number(t['cl2i00']) * Number(t[hh]),
            hhc: Number(t[hh])
          };
        } else {
          return null;
        }
      },
      metricAccumulator: (p, c) => {
        const result = Object.assign({}, p);
        result.hhc += c != null ? c.hhc : 0;
        result.income += c != null ? c.income : 0;
        return result;
      },
      metricFormatter: v => {
        if (v != null && v.hhc !== 0 && v.income !== 0){
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
      metricCategory: 'AUDIENCE',
      metricFriendlyName: '% \'17 HHs Families with Related Children < 18 Yrs',
      valueCalc: t => {
        const hh = this.isWinter ? 'hhld_w' : 'hhld_s';
        if (t['cl0c00'] != null) {
          return {
            income: Number(t['cl0c00']) * Number(t[hh]),
            hhc: Number(t[hh])
          };
        } else {
          return null;
        }
      },
      metricAccumulator: (p, c) => {
        const result = Object.assign({}, p);
        result.hhc += c != null ? c.hhc : 0;
        result.income += c != null ? c.income : 0;
        return result;
      },
      metricFormatter: v => {
        if (v != null && v.hhc !== 0 && v.income !== 0){
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
      metricCategory: 'AUDIENCE',
      metricFriendlyName: '% \'17 Pop Hispanic or Latino',
      valueCalc: t => {
        const hh = this.isWinter ? 'hhld_w' : 'hhld_s';
        if (t['cl2prh'] != null) {
          return {
            income: Number(t['cl2prh']) * Number(t[hh]),
            hhc: Number(t[hh])
          };
        } else {
          return null;
        }
      },
      metricAccumulator: (p, c) =>  {
        const result = Object.assign({}, p);
        result.hhc += c != null ? c.hhc : 0;
        result.income += c != null ? c.income : 0;
        return result;
      },
      metricFormatter: v => {
        if (v != null && v.hhc !== 0 && v.income !== 0){
        const result = v.income / v.hhc;
        return result.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '%';
       }else return 'N/A';
      }
    };
    this.metricDefinitions.push(popHispanicLatino);

    const casualDining: MetricDefinition<{ income: number, hhc: number }> = {
      metricValue: { income: 0, hhc: 0 },
      metricDefault: { income: 0, hhc: 0 },
      metricCategory: 'AUDIENCE',
      metricFriendlyName: 'Casual Dining: 10+ Times Past 30 Days',
      valueCalc: t => {
        const hh = this.isWinter ? 'hhld_w' : 'hhld_s';
        if (t['tap049'] != null) {
          return {
            income: Number(t['tap049']) * Number(t[hh]),
            hhc: Number(t[hh])
          };
        } else {
          return null;
        }
      },
      metricAccumulator: (p, c) =>  {
        const result = Object.assign({}, p);
        result.hhc += c != null ? c.hhc : 0;
        result.income += c != null ? c.income : 0;
        return result;
      },
      metricFormatter: v => {
        if (v != null && v.hhc !== 0 && v.income !== 0){
          const result = v.income / v.hhc;
          return result.toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }
        else return 'N/A';
      }
    };
    this.metricDefinitions.push(casualDining);
  }

  private getMetricObservable() : Observable<MetricDefinition<any>[]> {
    const storeAttributes$ = this.store$.pipe(select(selectGeoAttributeEntities));
    return this.stateService.uniqueSelectedGeocodes$.pipe(
      withLatestFrom(this.stateService.currentProject$, storeAttributes$),
      map(([geos, project, attrs]) => this.updateDefinitions(attrs, geos, project))
    );
  }

  private getMismatchObservable() : Observable<boolean> {
    const geoOwnerTypes$ = this.store$.pipe(
      select(selectGeoAttributes),
      withLatestFrom(this.stateService.uniqueSelectedGeocodes$),
      map(([attributes, geocodes]) => [attributes, new Set(geocodes)]),
      map(([attributes, geoSet]: [GeoAttribute[], Set<string>]) => attributes.filter(a => geoSet.has(a.geocode))),
      map(attributes => {
        return {
          valExists: attributes.some(a => a['owner_group_primary'] === 'VALASSIS'),
          anneExists: attributes.some(a => a['owner_group_primary'] === 'ANNE'),
          soloExists: attributes.some(a => a['cov_frequency'] === 'Solo')
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

  public updateDefinitions(attributes: { [geocode: string] : GeoAttribute }, geocodes: string[], project: ImpProject) : MetricDefinition<any>[] {
    if (project == null || attributes == null) return;
    this.isWinter = this.stateService.season$.getValue() === Season.Winter;

    for (const definition of this.metricDefinitions) {
      const values: any[] = [];
      definition.metricValue = definition.metricDefault;
      for (const geo of geocodes) {
        const currentAttribute: GeoAttribute = attributes[geo];
        if (currentAttribute != null) {
          values.push(definition.valueCalc(currentAttribute));
        }
      }
      if (definition.calcFlagState != null) definition.metricFlag = definition.calcFlagState();
      definition.metricValue = values.reduce(definition.metricAccumulator, definition.metricDefault);
    }
    return Array.from(this.metricDefinitions);
  }

  public getCpmForGeo(ownerGroupPrimary: string, coverageFrequency: string) : number {
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
