import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SelectItem } from 'primeng/primeng';
import { combineLatest } from 'rxjs';
import { debounceTime, filter, pairwise, startWith, take } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';
import { AppConfig } from '../../app.config';
import { EsriLayerService } from '../../esri-modules/layers/esri-layer.service';
import { AppMapService } from '../../services/app-map.service';
import { AppMessagingService } from '../../services/app-messaging.service';
import { AppStateService } from '../../services/app-state.service';
import { ImpDiscoveryService } from '../../services/ImpDiscoveryUI.service';
import { UsageService } from '../../services/usage.service';
import { UserService } from '../../services/user.service';
import { ImpMetricName } from '../../val-modules/metrics/models/ImpMetricName';
import { ImpProject } from '../../val-modules/targeting/models/ImpProject';
import { ImpRadLookup } from '../../val-modules/targeting/models/ImpRadLookup';
import { ImpProjectService } from '../../val-modules/targeting/services/ImpProject.service';
import { ImpRadLookupService } from '../../val-modules/targeting/services/ImpRadLookup.service';

interface DiscoveryFormData {
  projectName: string;
  projectTrackerData: TrackerData;
  selectedRadLookupValue: RadData;
  selectedSeason: string;
  selectedAnalysisLevel: SelectItem;
  includePob: boolean;
  includeValassis: boolean;
  includeAnne: boolean;
  includeSolo: boolean;
  dollarBudget: string;
  circBudget: string;
  cpmType: string;
  cpmBlended: string;
  cpmValassis: string;
  cpmAnne: string;
  cpmSolo: string;
}

class RadData extends ImpRadLookup {
  public get display() : string {
    return `${this.category} - ${this.product}`;
  }
  constructor(defaults: Partial<ImpRadLookup>) { super(defaults); }
}

class TrackerData {
  public projectId: number;
  public projectName: string;
  public targetor: string;
  public clientName: string;
  public get display() : string {
    const name = this.targetor == null ? '(Unassigned)' : `(${this.targetor})`;
    return `${this.projectId}   ${this.projectName}  ${name}`;
  }
  constructor(defaults: Partial<TrackerData>) {
    Object.assign(this, defaults);
  }
}

function toNumber(value: string) : number | null {
  return value != null && !Number.isNaN(Number(value)) ? Number(value) : null;
}

@Component({
  selector: 'val-discovery-input',
  templateUrl: './discovery-input.component.html',
  styleUrls: ['./discovery-input.component.css']
})
export class DiscoveryInputComponent implements OnInit {

  discoveryForm: FormGroup;
  allAnalysisLevels: SelectItem[];
  allSeasons: SelectItem[];

  radDataCache: RadData[] = [];
  radDataFiltered: RadData[] = [];

  trackerDataCache: TrackerData[] = [];
  trackerDataFiltered: TrackerData[] = [];

  get isBlendedCpm() : boolean { return this.discoveryForm.get('cpmType').value === 'blended'; }
  get isOwnerGroupCpm() : boolean { return this.discoveryForm.get('cpmType').value === 'ownerGroup'; }

  public impProject: ImpProject;
  private usageTargetMap: Map<string, string>;

  private projectSub: Subscription;

  // -----------------------------------------------------------
  // LIFECYCLE METHODS
  // -----------------------------------------------------------
  constructor(private fb: FormBuilder,
              private config: AppConfig,
              private discoveryService: ImpDiscoveryService,
              private appProjectService: ImpProjectService,
              private impRadLookupService: ImpRadLookupService,
              private userService: UserService,
              private usageService: UsageService,
              private messagingService: AppMessagingService,
              private appMapService: AppMapService,
              private appStateService: AppStateService,
              private esriLayerService: EsriLayerService){

    this.allAnalysisLevels = [
      {label: 'Digital ATZ', value: 'Digital ATZ'},
      {label: 'ATZ', value: 'ATZ'},
      {label: 'ZIP', value: 'ZIP'},
      {label: 'PCR', value: 'PCR'}
    ];

    this.allSeasons = [
      {label: 'Summer', value: 'S'},
      {label: 'Winter', value: 'W'}
    ];

    // this.products = [
    //   {label: 'N/A',                         value: 'N/A'},
    //   {label: 'Display Advertising',         value: 'N/A'},
    //   {label: 'Email',                       value: 'N/A'},
    //   {label: 'Insert - Newspaper',          value: 'NP Insert'},
    //   {label: 'Insert - Shared Mail',        value: 'SM Insert'},
    //   {label: 'RedPlum Plus Dynamic Mobile', value: 'N/A'},
    //   {label: 'Variable Data Postcard',      value: 'VDP'},
    //   {label: 'VDP + Email',                 value: 'N/A'},
    //   {label: 'Red Plum Wrap',               value: 'SM Wrap'}
    // ];

  }

  ngOnInit() : void {
    // create the form fields, and populate default values & validations
    this.discoveryForm = this.fb.group({
      projectName: ['', Validators.required],
      projectTrackerData: null,
      selectedRadLookupValue: null,
      selectedSeason: this.isSummer() ? this.allSeasons[0].value : this.allSeasons[1].value,
      selectedAnalysisLevel: ['', Validators.required],
      includePob: true,
      includeValassis: true,
      includeAnne: true,
      includeSolo: true,
      dollarBudget: null,
      circBudget: null,
      cpmType: null,
      cpmBlended: null,
      cpmValassis: null,
      cpmAnne: null,
      cpmSolo: null
    });

    // this maps the form control names to the equivalent usage metric name
    // if there is no entry here, then it will not get logged on change
    this.usageTargetMap = new Map<string, string>([
      ['selectedSeason', 'seasonality'],
      ['selectedAnalysisLevel', 'analysis-level'],
      ['includePob', 'include-pob-geo'],
      ['includeValassis', 'include-valassis-geo'],
      ['includeAnne', 'include-anne-geo'],
      ['includeSolo', 'include-solo-geo'],
      ['dollarBudget', 'dollar-budget'],
      ['circBudget', 'circ-budget'],
      ['cpmBlended', 'blended-cpm'],
      ['cpmValassis', 'valassis-cpm'],
      ['cpmAnne', 'anne-cpm'],
      ['cpmSolo', 'solo-cpm'],
    ]);

    combineLatest(this.appMapService.onReady$, this.esriLayerService.layersReady$).pipe(
      filter(([mapReady, layersReady]) => mapReady && layersReady),
      take(1)
    ).subscribe(() => {
      // set up all my observables after the map & layers are ready
      this.impRadLookupService.storeObservable.subscribe(radData => this.radDataCache = radData.map(item => new RadData(item)));
      this.impRadLookupService.get(true); // fire off the store retrieval mechanism
     this.discoveryService.getProjectTrackerData().subscribe(data => this.trackerDataCache = data.map(item => new TrackerData(item)));
      const cleanForm$ = this.discoveryForm.valueChanges.pipe(
        debounceTime(500)
      );

      cleanForm$.subscribe(currentForm => this.updateProject(currentForm));

      cleanForm$.pipe(
        startWith(this.discoveryForm.value),
        pairwise()
      ).subscribe(([previous, current]) => this.logUsageMetricForChange(previous,  current));

      this.projectSub = this.appStateService.currentProject$.subscribe(project => this.mapFromProject(project));
    });
  }

  private logUsageMetricForChange(previousForm: DiscoveryFormData, currentForm: DiscoveryFormData) : void {
    // retrieve the list of field names from the form data
    const formFieldNames = Object.keys(previousForm);
    formFieldNames.forEach(fieldName => {
      const previousValue = previousForm[fieldName];
      const currentValue = currentForm[fieldName];
      const usageTarget = this.usageTargetMap.get(fieldName);
      // only log values that are tracked and have changed
      if (usageTarget != null && previousValue !== currentValue) {
        console.log(`Logging a change for ${fieldName}`, [previousValue, currentValue]);
        const newText = `New=${currentValue}`;
        const changeText = `${newText}~Old=${previousValue}`;
        const metricsText = previousValue == null || previousValue === '' ? newText : changeText;
        const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: usageTarget, action: 'changed' });
        this.usageService.createCounterMetric(usageMetricName, metricsText, null);
      }
    });
    // custom metrics that aren't picked up by the above code
    if (currentForm.projectTrackerData != null) {
      const previousValue = previousForm.projectTrackerData != null ? previousForm.projectTrackerData.projectId : null;
      const newText = `New=${currentForm.projectTrackerData.projectId}`;
      const changeText = `${newText}~Old=${previousValue}`;
      const metricsText = previousValue == null ? newText : changeText;
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'project-tracker-id', action: 'changed' });
      this.usageService.createCounterMetric(usageMetricName, metricsText, null);
    }
    if (currentForm.selectedRadLookupValue != null) {
      const productMetric: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'product', action: 'changed' });
      const previousProduct = previousForm.selectedRadLookupValue != null ? previousForm.selectedRadLookupValue.product : null;
      const newProductText = `New=${currentForm.selectedRadLookupValue.product}`;
      const changeProductText = `${newProductText}~Old=${previousProduct}`;
      const productMetricText = previousProduct == null || previousProduct === '' ? newProductText : changeProductText;
      this.usageService.createCounterMetric(productMetric, productMetricText, null);

      const categoryMetric = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'category', action: 'changed' });
      const previousCategory = previousForm.selectedRadLookupValue != null ? previousForm.selectedRadLookupValue.category : null;
      const newCategoryText = `New=${currentForm.selectedRadLookupValue.category}`;
      const changeCategoryText = `${newCategoryText}~Old=${previousCategory}`;
      const categoryMetricText = previousCategory == null || previousCategory === '' ? newCategoryText : changeCategoryText;
      this.usageService.createCounterMetric(categoryMetric, categoryMetricText, null);
    }
  }

  private processForm(currentForm: DiscoveryFormData) : void {
    switch (currentForm.cpmType) {
      case 'blended':
        this.discoveryForm.patchValue({
          cpmValassis: null,
          cpmAnne: null,
          cpmSolo: null
        });
        break;
      case 'ownerGroup':
        this.discoveryForm.patchValue({
          cpmBlended: null
        });
        break;
      default:
        this.discoveryForm.patchValue({
          cpmValassis: null,
          cpmAnne: null,
          cpmSolo: null,
          cpmBlended: null
        });
    }
  }

  private updateProject(currentForm: DiscoveryFormData) {
    console.log('discovery-component.updateProject fired');
    console.log('selected analysislevel', currentForm.selectedAnalysisLevel);
    const dollarBudget = toNumber(currentForm.dollarBudget);
    const circBudget = toNumber(currentForm.circBudget);
    if (this.impProject == null) return;

    // Update audit columns
    if (this.impProject.createUser == null)
      this.impProject.createUser = (this.userService.getUser().userId) ? (this.userService.getUser().userId) : -1;
    if (this.impProject.createDate == null)
      this.impProject.createDate = new Date(Date.now());
    this.impProject.modifyUser = (this.userService.getUser().userId) ? (this.userService.getUser().userId) : -1;
    this.impProject.modifyDate = new Date(Date.now());

    // Populate the ImpProject model
    this.impProject.clientIdentifierTypeCode = 'CAR_LIST';
    this.impProject.clientIdentifierName     =  currentForm.projectTrackerData ? currentForm.projectTrackerData.clientName : null;
    this.impProject.consumerPurchFreqCode    = 'REMINDER';
    this.impProject.goalCode                 = 'ACQUISITION';
    this.impProject.objectiveCode            = 'INCREASE_PENETRATION';
    this.impProject.industryCategoryCode     = currentForm.selectedRadLookupValue != null ? this.discoveryService.radCategoryCodeByName.get(currentForm.selectedRadLookupValue.category) : '';

    this.impProject.methAnalysis       = currentForm.selectedAnalysisLevel ? currentForm.selectedAnalysisLevel.value : null;
    this.impProject.totalBudget        = (dollarBudget != null ? dollarBudget : circBudget);
    this.impProject.isValidated        = true;
    this.impProject.isCircBudget       = (circBudget != null);
    this.impProject.isActive           = true;
    this.impProject.isSingleDate       = true;
    this.impProject.isMustCover        = true;
    this.impProject.isDollarBudget     = (dollarBudget != null);
    this.impProject.isRunAvail         = true;
    this.impProject.isHardPdi          = true;
    this.impProject.isIncludeNonWeekly = true;
    this.impProject.isIncludeValassis  = currentForm.includeValassis;
    this.impProject.isExcludePob       = !currentForm.includePob;
    this.impProject.isIncludeAnne      = currentForm.includeAnne;
    this.impProject.isIncludeSolo      = currentForm.includeSolo;
    this.impProject.projectTrackerId   = currentForm.projectTrackerData ? currentForm.projectTrackerData.projectId : null;
    this.impProject.projectName        = currentForm.projectName;
    this.impProject.estimatedBlendedCpm = toNumber(currentForm.cpmBlended);
    this.impProject.smValassisCpm      = toNumber(currentForm.cpmValassis);
    this.impProject.smAnneCpm          = toNumber(currentForm.cpmAnne);
    this.impProject.smSoloCpm          = toNumber(currentForm.cpmSolo);
    this.impProject.radProduct         = currentForm.selectedRadLookupValue ? currentForm.selectedRadLookupValue.product : null;
    this.impProject.impGeofootprintMasters[0].methSeason = currentForm.selectedSeason;

    console.log('Saving project data', this.impProject);
    this.appProjectService.update(null, null);
  }

  private mapFromProject(newProject: ImpProject) {
    console.log ('discovery-input.component - mapFromProject - fired');
    // Bail if there is no project to map from - this should not happen due to piping on currentProject$
    if (newProject == null){
      console.error('Project passed into MapFromProject is null');
      return;
    }
    if (this.impProject != null && this.impProject.projectId === newProject.projectId) {
      // break out of infinite loop
      return;
    }

    this.impProject = newProject;
    if (newProject.projectId == null) {
      // new project - no need to load form data
      return;
    }
    const radItem = this.radDataCache.filter(rad => rad.product === newProject.radProduct && this.discoveryService.radCategoryCodeByName.get(rad.category) === newProject.industryCategoryCode)[0];
    const trackerItem = this.trackerDataCache.filter(tracker => tracker.projectId === newProject.projectTrackerId)[0];
    const analysisLevelItem = this.allAnalysisLevels.filter(al => al.value === newProject.methAnalysis)[0];
    const newFormData: DiscoveryFormData = {
      projectName: newProject.projectName,
      circBudget: newProject.isCircBudget && newProject.totalBudget ? newProject.totalBudget.toString() : null,
      dollarBudget: newProject.isDollarBudget && newProject.totalBudget ? newProject.totalBudget.toString() : null,
      cpmAnne: newProject.smAnneCpm ? newProject.smAnneCpm.toString() : null,
      cpmValassis: newProject.smValassisCpm ? newProject.smValassisCpm.toString() : null,
      cpmSolo: newProject.smSoloCpm ? newProject.smSoloCpm.toString() : null,
      cpmBlended: newProject.estimatedBlendedCpm ? newProject.estimatedBlendedCpm.toString() : null,
      cpmType: newProject.estimatedBlendedCpm ? 'blended' : (newProject.smAnneCpm || newProject.smSoloCpm || newProject.smValassisCpm ? 'ownerGroup' : null),
      includeAnne: newProject.isIncludeAnne,
      includeSolo: newProject.isIncludeSolo,
      includeValassis: newProject.isIncludeValassis,
      includePob: !newProject.isExcludePob,
      selectedAnalysisLevel: analysisLevelItem ? analysisLevelItem : null,
      selectedSeason: newProject.impGeofootprintMasters[0].methSeason,
      projectTrackerData: trackerItem ? trackerItem : null,
      selectedRadLookupValue: radItem ? radItem : null
    };

    console.log('Patching data to form', newFormData);
    this.discoveryForm.patchValue(newFormData);
  }

  // TODO: move to the discovery service and use to initialize selectedSeason
  public isSummer() : boolean {
    const today: Date = new Date();
    today.setDate(today.getDate() + 28);
    return today.getMonth() >= 4 && today.getMonth() <= 8;
  }

  public saveProject() {
    // Save the project
    this.appProjectService.saveProject();
  }

  filterRadData(event) {
    const value = event.query;
    this.radDataFiltered = [];
    const excludeList: RadData[] = [];
    const excludeSet = new Set(['reminder', 'research', 'ritual']);
    let matchingValues = this.radDataCache.filter(item => {
      return item.category.toLowerCase().includes(value.toLowerCase()) || item.product.toLowerCase().includes(value.toLowerCase());
    }).map(item => {
      if (!excludeSet.has(item.category.toLowerCase())){
        return item;
      }else{
        excludeList.push(item);
      }
    }).sort(function(a, b){
      if (a.category < b.category) return -1;
      if (a.category > b.category) return 1;
      return 0;
    });

    excludeList.sort(function(a, b){
      if (a.category < b.category) return -1;
      if (a.category > b.category) return 1;
      return 0;
    });
    matchingValues.push(...excludeList);
    matchingValues = matchingValues.filter(x => x != null);
    this.radDataFiltered.push(...matchingValues);
  }

  filterProjectTracker(event) {
    const value = event.query;
    if (value.length > 2) {
      this.trackerDataFiltered = this.trackerDataCache.filter(item => {
        if (item.targetor != null) {
          return item.projectId.toString().toLowerCase().includes(value.toLowerCase()) || item.projectName.toLowerCase().includes(value.toLowerCase()) || item.targetor.toLowerCase().includes(value.toLowerCase());
        } else {
          return item.projectId.toString().toLowerCase().includes(value.toLowerCase()) || item.projectName.toLowerCase().includes(value.toLowerCase()) ;
        }
      });
    }
  }
  public refreshProjectTrackerData(){
      console.log('Refreshing trackerDataCache');
      this.discoveryService.getProjectTrackerData().subscribe(data => {
      this.trackerDataCache = data.map(item => new TrackerData(item));
      });

}
}

