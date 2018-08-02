import { Component, OnInit } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { User } from '../../models/User';
import { AppDiscoveryService, ProjectTrackerData } from '../../services/app-discovery.service';
import { UsageService } from '../../services/usage.service';
import { UserService } from '../../services/user.service';
import { ImpMetricName } from '../../val-modules/metrics/models/ImpMetricName';
import { ImpProject } from '../../val-modules/targeting/models/ImpProject';
import { ImpRadLookup } from '../../val-modules/targeting/models/ImpRadLookup';
import { AppStateService } from '../../services/app-state.service';
import { filter, map } from 'rxjs/operators';
import { ValDiscoveryUIModel } from '../../models/val-discovery.model';
import { ImpProjectService } from '../../val-modules/targeting/services/ImpProject.service';

@Component({
  selector: 'val-campaign-details',
  templateUrl: './campaign-details.component.html',
  styleUrls: ['./campaign-details.component.css']
})
export class CampaignDetailsComponent implements OnInit {

  currentDiscoveryData$: Observable<ValDiscoveryUIModel>;
  currentRadSuggestions$: Observable<ImpRadLookup[]>;
  currentProjectTrackerSuggestions$: Observable<ProjectTrackerData[]>;

  private previousForm: ValDiscoveryUIModel = null;
  private usageTargetMap: { [key: string] : string };

  constructor(private appStateService: AppStateService,
              private appDiscoveryService: AppDiscoveryService,
              private userService: UserService,
              private impProjectService: ImpProjectService,
              private usageService: UsageService) { }

  ngOnInit() {
    this.currentDiscoveryData$ =
      combineLatest(this.appStateService.applicationIsReady$, this.appStateService.currentProject$, this.appDiscoveryService.selectedRadLookup$, this.appDiscoveryService.selectedProjectTracker$)
        .pipe(
          filter(([appIsReady]) => appIsReady),
          map(([appIsReady, currentProject, selectedRad, selectedTracker]) => ValDiscoveryUIModel.createFromProject(currentProject, selectedRad, selectedTracker))
        );
    this.currentRadSuggestions$ = this.appDiscoveryService.radSearchSuggestions$;
    this.currentProjectTrackerSuggestions$ = this.appDiscoveryService.trackerSearchSuggestions$;

    // this maps the form control names to the equivalent usage metric name
    // if there is no entry here, then it will not get logged on change
    this.usageTargetMap = {
      selectedSeason: 'seasonality',
      selectedAnalysisLevel: 'analysis-level',
      includePob: 'include-pob-geo',
      includeValassis: 'include-valassis-geo',
      includeAnne: 'include-anne-geo',
      includeSolo: 'include-solo-geo',
      dollarBudget: 'dollar-budget',
      circBudget: 'circ-budget',
      cpmBlended: 'blended-cpm',
      cpmValassis: 'valassis-cpm',
      cpmAnne: 'anne-cpm',
      cpmSolo: 'solo-cpm',
    };
  }

  onDiscoveryFormChanged(newValues: ValDiscoveryUIModel) : void {
    const currentProject: ImpProject = this.appStateService.currentProject$.getValue();
    const currentUser: User = this.userService.getUser();
    if (this.previousForm != null) {
      this.logUsageMetricForChange(this.previousForm, newValues);
    }
    this.previousForm = new ValDiscoveryUIModel({ ...newValues });
    if (currentProject != null) {
      newValues.updateProjectItem(currentProject);
      // Update audit columns
      if (currentProject.createUser == null)
        currentProject.createUser = (currentUser.userId) ? (currentUser.userId) : -1;
      if (currentProject.createDate == null)
        currentProject.createDate = new Date(Date.now());
      currentProject.modifyUser = (currentUser.userId) ? (currentUser.userId) : -1;
      currentProject.modifyDate = new Date(Date.now());

      this.impProjectService.makeDirty();
    }
  }

  onTrackerRefresh() : void {
    this.onTrackerSearch('');
  }

  onTrackerSearch(searchTerm: string) : void {
    this.appDiscoveryService.updateTrackerSuggestions(searchTerm);
  }

  onRadSearch(searchTerm: string) : void {
    this.appDiscoveryService.updateRadSuggestions(searchTerm);
  }

  private logUsageMetricForChange(previousForm: ValDiscoveryUIModel, currentForm: ValDiscoveryUIModel) : void {
    // retrieve the list of field names from the form data
    const formFieldNames = Object.keys(previousForm);
    formFieldNames.forEach(fieldName => {
      const previousValue = previousForm[fieldName];
      const currentValue = currentForm[fieldName];
      const usageTarget = this.usageTargetMap[fieldName];
      // only log values that are tracked and have changed
      if (usageTarget != null && previousValue !== currentValue && currentValue != null) {
        console.log(`Logging a change for ${fieldName}`, [previousValue, currentValue]);
        let newText = null;
        let changeText = null;
        if (usageTarget === 'analysis-level' &&  currentValue != null){
           newText = `New=${currentValue.value}`;
           const preValue = previousValue != null ? previousValue.value  : null ;
           changeText = `${newText}~Old=${preValue}`;
        }else{
           newText = `New=${currentValue}`;
           changeText = `${newText}~Old=${previousValue}`;
        }

        const metricsText = previousValue == null || previousValue === '' ? newText : changeText;
        const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: usageTarget, action: 'changed' });
        this.usageService.createCounterMetric(usageMetricName, metricsText, null);
      }
    });
    // custom metrics that aren't picked up by the above code
    if (currentForm.selectedProjectTracker != null) {
      const previousValue = previousForm.selectedProjectTracker != null ? previousForm.selectedProjectTracker.projectId : null;
      if (previousValue != null && currentForm.selectedProjectTracker.projectId !== previousValue){
        const newText = `New=${currentForm.selectedProjectTracker.projectId}`;
        const changeText = `${newText}~Old=${previousValue}`;
        const metricsText = previousValue == null ? newText : changeText;
        const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'project-tracker-id', action: 'changed' });
        this.usageService.createCounterMetric(usageMetricName, metricsText, null);
      }
    }
    if (currentForm.selectedRadLookup != null) {
      const productMetric: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'product', action: 'changed' });
      const previousProduct = previousForm.selectedRadLookup != null ? previousForm.selectedRadLookup.product : null;
      if (previousProduct != null && currentForm.selectedRadLookup.product !== previousProduct){
        const newProductText = `New=${currentForm.selectedRadLookup.product}`;
        const changeProductText = `${newProductText}~Old=${previousProduct}`;
        const productMetricText = previousProduct == null || previousProduct === '' ? newProductText : changeProductText;
        this.usageService.createCounterMetric(productMetric, productMetricText, null);
      }

      const categoryMetric = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'category', action: 'changed' });
      const previousCategory = previousForm.selectedRadLookup != null ? previousForm.selectedRadLookup.category : null;
      if (previousCategory != null && currentForm.selectedRadLookup.category !== previousCategory){
        const newCategoryText = `New=${currentForm.selectedRadLookup.category}`;
        const changeCategoryText = `${newCategoryText}~Old=${previousCategory}`;
        const categoryMetricText = previousCategory == null || previousCategory === '' ? newCategoryText : changeCategoryText;
        this.usageService.createCounterMetric(categoryMetric, categoryMetricText, null);
      }
    }
  }
}
