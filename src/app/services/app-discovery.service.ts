
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ImpMetricName } from '../val-modules/metrics/models/ImpMetricName';
import { filter, map, take, tap } from 'rxjs/operators';
import { AppStateService } from './app-state.service';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { ImpRadLookupService } from '../val-modules/targeting/services/ImpRadLookup.service';
import { ImpRadLookup } from '../val-modules/targeting/models/ImpRadLookup';
import { filterByFields, mapBy } from '../val-modules/common/common.utils';
import { mapArray } from '../val-modules/common/common.rxjs';
import { AppMessagingService } from './app-messaging.service';
import { AppLoggingService } from './app-logging.service';

export class RadLookupUIModel extends ImpRadLookup {
  get display() : string {
    return `${this.category} - ${this.product}`;
  }
}

export class ProjectTrackerUIModel {
  projectId: number;
  projectName: string;
  targetor: string;
  clientName: string;
  accountNumber: string;
  get display() : string {
    const targetor = this.targetor == null || this.targetor === '' ? 'Unassigned' : this.targetor;
    return `${this.projectId}  ${this.projectName} (${targetor})`;
  }
  constructor(data: Partial<ProjectTrackerUIModel>) {
    Object.assign(this, data);
  }
}

export class CounterMetrics {
  constructor(public usageMetricName: ImpMetricName, public metricText: string, public metricValue: number
  ) { }
}

@Injectable()
export class AppDiscoveryService {
  private radCacheRetrieved: boolean = false;
  private radCache: RadLookupUIModel[] = [];
  private currentRadSuggestions = new BehaviorSubject<RadLookupUIModel[]>([]);
  private selectedRadLookup = new BehaviorSubject<RadLookupUIModel>(null);
  public radSearchSuggestions$: Observable<RadLookupUIModel[]> = this.currentRadSuggestions.asObservable();
  public selectedRadLookup$: Observable<RadLookupUIModel> = this.selectedRadLookup.asObservable();

  private currentTrackerSuggestions = new BehaviorSubject<ProjectTrackerUIModel[]>([]);
  private selectedProjectTracker = new BehaviorSubject<ProjectTrackerUIModel>(null);
  public trackerSearchSuggestions$: Observable<ProjectTrackerUIModel[]> = this.currentTrackerSuggestions.asObservable();
  public selectedProjectTracker$: Observable<ProjectTrackerUIModel> = this.selectedProjectTracker.asObservable();

  private readonly radCategoryCodes: { name: string, code: string }[];
  public radCategoryCodeByName: Map<string, string>;
  public radCategoryNameByCode: Map<string, string>;

  constructor(private restDataService: RestDataService,
               private appStateService: AppStateService,
               private impRadService: ImpRadLookupService,
               private appMessagingService: AppMessagingService,
               private logger: AppLoggingService) {
    this.radCategoryCodes = [
      { name: 'N/A',                            code: 'NA'},
      { name: 'Auto Service/Parts',             code: 'AS03'},
      { name: 'Discounts Stores',               code: 'DS01'},
      { name: 'Education',                      code: 'ED01'},
      { name: 'Financial Services',             code: 'FS01'},
      { name: 'Full Service Restaurants',       code: 'FSR03'},
      { name: 'Hardware_Home Improvement Ctrs', code: 'HI03'},
      { name: 'Health and Beauty',              code: 'HB01'},
      { name: 'Healthcare',                     code: 'HC01'},
      { name: 'Healthcare_Optical',             code: 'OP01'},
      { name: 'Home Furnishing_Mattress',       code: 'HF01'},
      { name: 'Home Services',                  code: 'HS01'},
      { name: 'Non-profit',                     code: 'NP01'},
      { name: 'Professional',                   code: 'PF01'},
      { name: 'QSR Pizza',                      code: 'QSR01'},
      { name: 'Quick Service Restaurants',      code: 'FSR01'},
      { name: 'Reminder',                       code: 'REM'},
      { name: 'Research',                       code: 'RES'},
      { name: 'Ritual',                         code: 'RIT'},
      { name: 'Specialty Stores',               code: 'SP01'},
      { name: 'Telecommunications',             code: 'TE03'},
    ];
    this.radCategoryCodeByName = mapBy(this.radCategoryCodes, 'name', (r) => r.code);
    this.radCategoryNameByCode = mapBy(this.radCategoryCodes, 'code', (r) => r.name);
    this.appStateService.currentProject$.pipe(filter(p => p != null)).subscribe(project => this.setSelectedValues(project));
  }

  private setSelectedValues(project: ImpProject) {
      this.selectRadProduct(project);
      this.selectProjectTracker(project);
  }

  private selectRadProduct(project: ImpProject) {
    if (!this.radCacheRetrieved) {
      this.getRadData().subscribe(null, null, () => {
        this.updateRadSuggestions('');
        this.selectRadProduct(project);
      });
    } else {
      if (project.radProduct == null && project.industryCategoryCode == null) {
          this.selectedRadLookup.next(null);
      } else {
        const radItem = this.radCache.filter(rad => rad.product === project.radProduct && rad['Category Code'] === project.industryCategoryCode)[0];
        if (radItem != null) this.selectedRadLookup.next(radItem);
      }
    }
  }

  private selectProjectTracker(project: ImpProject) {
    if (project.projectTrackerId == null){
      this.selectedProjectTracker.next(null);
    } else {
      this.getProjectTrackerData(project.projectTrackerId).subscribe(items => {
        const trackerItem = items.filter(tracker => tracker.projectId === project.projectTrackerId)[0];
        if (trackerItem != null) this.selectedProjectTracker.next(trackerItem);
      }, null, () => {
      });
    }
  }

  private formatDate(date) : string {
    const zeroPad = Intl.NumberFormat(undefined, { minimumIntegerDigits: 2 }).format;
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}-${zeroPad(month)}-${zeroPad(day)}`;
  }

  private getProjectTrackerData(searchString) : Observable<ProjectTrackerUIModel[]> {
    const updatedDateTo = new Date();
    updatedDateTo.setDate(updatedDateTo.getDate() + 1);
    const updatedDateFrom = new Date();
    updatedDateFrom.setMonth(updatedDateFrom.getMonth() - 6);
      return this.restDataService.get(`v1/targeting/base/impimsprojectsview/search?q=impImsprojectsViewSearch&fields=PROJECT_ID projectId,PROJECT_NAME projectName,
            TARGETOR targetor,CLIENT_NAME clientName,ACCOUNT_NUMBER accountNumber&searchString=${searchString}&updatedDateFrom=${this.formatDate(updatedDateFrom)}&updatedDateTo=${this.formatDate(updatedDateTo)}&sort=UPDATED_DATE&sortDirection=desc`).pipe(
              // tap(rawResult => this.logger.info('Fuse response', rawResult)),
          map((result: any) => result.payload.rows || []),
          map(data => data.map(tracker => new ProjectTrackerUIModel(tracker))),

    );  
  }

  private getRadData() : Observable<RadLookupUIModel[]> {
    const localCache: RadLookupUIModel[] = [];
    const result = this.impRadService.storeObservable.pipe(
      filter(data => data != null && data.length > 0),
      take(1),
      mapArray(radItem => new RadLookupUIModel(radItem)),
      tap(
        data => {
          data.forEach(d => d['Category Code'] = this.radCategoryCodeByName.get(d.category));
          localCache.push(...data);
        },
        err => {
          this.logger.error('There was an error retrieving the Rad Data Cache', err);
          this.radCacheRetrieved = true;
        },
        () => {
          this.sortRadCache(localCache);
          this.radCache = localCache;
          this.radCacheRetrieved = true;
        })
    );
    this.impRadService.get(true);
    return result;
  }

  private sortRadCache(data: RadLookupUIModel[]) : void {
    const excludeSet = new Set(['reminder', 'research', 'ritual']);
    data.sort((a, b) => {
      const result = a.category.localeCompare(b.category, undefined, {});
      const aExcluded = excludeSet.has(a.category.toLowerCase());
      const bExcluded = excludeSet.has(b.category.toLowerCase());
      if (aExcluded === bExcluded) return result;
      if (aExcluded && !bExcluded) return 1;
      return -1;
    });
  }

  public discoveryUsageMetricsCreate(actionName: string) : CounterMetrics[] {
    const impProject: ImpProject = this.appStateService.currentProject$.getValue();
    const counterMetrics = [];
    let usageMetricName = null;

    if (impProject.radProduct != null || impProject.radProduct != '') {
      usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'product', action: actionName });
      counterMetrics.push(new CounterMetrics(usageMetricName, impProject.radProduct, null));
    }
    if (impProject.industryCategoryCode != null || impProject.industryCategoryCode != '') {
      usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'category', action: actionName });
      counterMetrics.push(new CounterMetrics(usageMetricName, impProject.industryCategoryCode, null));
    }
    if (impProject.methAnalysis != null) {
      usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'analysis-level', action: actionName });
      counterMetrics.push(new CounterMetrics(usageMetricName, impProject.methAnalysis, null));
    }
    if (impProject.estimatedBlendedCpm != null) {
      const blendedCpm = impProject.estimatedBlendedCpm != null ? impProject.estimatedBlendedCpm : null;
      usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'blended-cpm', action: actionName });
      counterMetrics.push(new CounterMetrics(usageMetricName, null, blendedCpm));
    }
    if (impProject.smValassisCpm != null) {
      const valassisCpm = impProject.smValassisCpm != null ? impProject.smValassisCpm : null;
      usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'valassis-cpm', action: actionName });
      counterMetrics.push(new CounterMetrics(usageMetricName, null, valassisCpm));
    }
    if (impProject.smAnneCpm != null) {
      const anneCPM = impProject.smAnneCpm != null ? impProject.smAnneCpm : null;
      usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'anne-cpm', action: actionName });
      counterMetrics.push(new CounterMetrics(usageMetricName, null, anneCPM));
    }
    if (impProject.smSoloCpm != null) {
      const soloCpm = impProject.smSoloCpm != null ? impProject.smSoloCpm : null;
      usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'solo-cpm', action: actionName });
      counterMetrics.push(new CounterMetrics(usageMetricName, null, soloCpm));
    }
    if (impProject.totalBudget != null) {
      const totalBudget = impProject.totalBudget != null ? impProject.totalBudget : null;
      usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'dollar-budget', action: actionName });
      counterMetrics.push(new CounterMetrics(usageMetricName, null, totalBudget));
    }
    if (impProject.isCircBudget) {
      const circBudget = impProject.totalBudget != null ? impProject.totalBudget : null;
      usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'circ-budget', action: actionName });
      counterMetrics.push(new CounterMetrics(usageMetricName, null, circBudget));
    }
    if (impProject.impGeofootprintMasters[0].methSeason != null) {
      usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'season', action: actionName });
      counterMetrics.push(new CounterMetrics(usageMetricName, impProject.impGeofootprintMasters[0].methSeason, null));
    }
    usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'include-pob-geo', action: actionName });
    const ispob = impProject.isExcludePob ? 1 : 0;
    counterMetrics.push(new CounterMetrics(usageMetricName, ispob.toString(), null));

    usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'include-valassis-geo', action: actionName });
    const isvalGeo = impProject.isIncludeValassis ? 1 : 0;
    counterMetrics.push(new CounterMetrics(usageMetricName, isvalGeo.toString(), null));

    usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'include-anne-geo', action: actionName });
    const isAnneGeo = impProject.isIncludeAnne ? 1 : 0;
    counterMetrics.push(new CounterMetrics(usageMetricName, isAnneGeo.toString(), null));

    usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'include-solo-geo', action: actionName });
    const isSoloGeo = impProject.isIncludeSolo ? 1 : 0;
    counterMetrics.push(new CounterMetrics(usageMetricName, isSoloGeo.toString(), null));

    return counterMetrics;
  }

  public updateTrackerSuggestions(searchTerm: string) {
      this.getProjectTrackerData(searchTerm).subscribe(items => {
          if (items.length === 0) {
             this.appMessagingService.showErrorNotification('Error:', 'No Project Tracker ID Found.', true); 
          } else {  
          const foundItems = items.filter(filterByFields(searchTerm, ['projectId', 'projectName', 'targetor']));
          this.currentTrackerSuggestions.next(foundItems);
        }
      }, 
      err => this.logger.error('There was an error retrieving the Project Tracker Data', err), 
      () => {}
    );
  }

  public updateRadSuggestions(searchTerm: string) {
    if (!this.radCacheRetrieved) {
      // need to populate the cache before filtering suggestions
      this.getRadData().subscribe(null, null, () => this.updateRadSuggestions(searchTerm));
    } else {
      // cache exists, filter suggestions
      if (searchTerm == null || searchTerm.trim().length === 0) {
        this.currentRadSuggestions.next(Array.from(this.radCache));
      } else {
        const foundItems = this.radCache.filter(filterByFields(searchTerm, ['category', 'product']));
        this.currentRadSuggestions.next(foundItems);
      }
    }
  }
}
