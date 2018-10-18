import { Component, OnInit } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { User } from '../../models/User';
import { AppDiscoveryService, ProjectTrackerUIModel, RadLookupUIModel } from '../../services/app-discovery.service';
import { AppLoggingService } from '../../services/app-logging.service';
import { UsageService } from '../../services/usage.service';
import { UserService } from '../../services/user.service';
import { ImpMetricName } from '../../val-modules/metrics/models/ImpMetricName';
import { ImpProject } from '../../val-modules/targeting/models/ImpProject';
import { AppStateService } from '../../services/app-state.service';
import { filter, map, tap } from 'rxjs/operators';
import { ValDiscoveryUIModel } from '../../models/val-discovery.model';
import { ImpProjectService } from '../../val-modules/targeting/services/ImpProject.service';
import { TargetAudienceService } from '../../services/target-audience.service';
import { filterArray } from '../../val-modules/common/common.rxjs';

@Component({
  selector: 'val-campaign-details',
  templateUrl: './campaign-details.component.html',
  styleUrls: ['./campaign-details.component.css']
})
export class CampaignDetailsComponent implements OnInit {

  currentDiscoveryData$: Observable<ValDiscoveryUIModel>;
  currentRadSuggestions$: Observable<RadLookupUIModel[]>;
  currentProjectTrackerSuggestions$: Observable<ProjectTrackerUIModel[]>;
  onlineAudienceExists$: Observable<boolean>;

  private previousForm: ValDiscoveryUIModel = null;
  private usageTargetMap: { [key: string] : string };

  constructor(private appStateService: AppStateService,
              private appDiscoveryService: AppDiscoveryService,
              private userService: UserService,
              private impProjectService: ImpProjectService,
              private logger: AppLoggingService,
              private usageService: UsageService,
              private targetAudienceService: TargetAudienceService ) { }

  ngOnInit() {
    this.currentDiscoveryData$ =
      combineLatest(this.appStateService.applicationIsReady$, this.appStateService.currentProject$, this.appDiscoveryService.selectedRadLookup$, this.appDiscoveryService.selectedProjectTracker$)
        .pipe(
          filter(([appIsReady]) => appIsReady),
          map(([appIsReady, currentProject, selectedRad, selectedTracker]) => ValDiscoveryUIModel.createFromProject(currentProject, selectedRad, selectedTracker)),
          tap(UIData => this.logger.debug('Discovery UI data changed', UIData))
        );
    this.currentRadSuggestions$ = this.appDiscoveryService.radSearchSuggestions$;
    this.currentProjectTrackerSuggestions$ = this.appDiscoveryService.trackerSearchSuggestions$;

    this.onlineAudienceExists$ = this.targetAudienceService.audiences$.pipe(
      filterArray(audience => audience.audienceSourceType === 'Online'),
      map(audiences => audiences.length > 0 )
    );
    
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
   // if (this.previousForm != null) {
      this.logUsageMetricForChange(this.previousForm, newValues);
    //}
    
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
 
  onTrackerSearch(searchTerm: string) : void {
    this.appDiscoveryService.updateTrackerSuggestions(searchTerm);
  }

  onRadSearch(searchTerm: string) : void {
    this.appDiscoveryService.updateRadSuggestions(searchTerm);
  }

  private logUsageMetricForChange(previousForm: ValDiscoveryUIModel, currentForm: ValDiscoveryUIModel) : void {
    // retrieve the list of field names from the form data
    if (previousForm == null && currentForm != null && currentForm.selectedAnalysisLevel != null){
      const newval = `New=${currentForm.selectedAnalysisLevel}`;
      const usageTarget = this.usageTargetMap['selectedAnalysisLevel'];
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: usageTarget, action: 'changed' });
      this.usageService.createCounterMetric(usageMetricName, newval, null);
      this.previousForm = new ValDiscoveryUIModel({ ...currentForm });
    }
    else if (previousForm != null){
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
          if (usageTarget === 'analysis-level' &&  currentValue.value != null){
             newText = `New=${currentValue.value}`;
             const preValue = previousValue != null ? previousValue.value  : null ;
             changeText = `${newText}~Old=${preValue}`;
             this.previousForm = new ValDiscoveryUIModel({ ...currentForm });
          }else{
             newText = `New=${currentValue}`;
             changeText = `${newText}~Old=${previousValue}`;
             this.previousForm = new ValDiscoveryUIModel({ ...currentForm });
          }
  
          const metricsText = previousValue == null || previousValue === '' ? newText : changeText;
          const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: usageTarget, action: 'changed' });
          this.usageService.createCounterMetric(usageMetricName, metricsText, null);
        }
      });
    }
    // custom metrics that aren't picked up by the above code
    if (currentForm.selectedProjectTracker != null) {
      let metricsText = null;
      const previousValue = previousForm != null && previousForm.selectedProjectTracker != null ? previousForm.selectedProjectTracker.projectId : null;
      if ((currentForm.selectedProjectTracker.projectId != null && previousValue == null) && currentForm.selectedProjectTracker.projectId !== previousValue){
        const newText = `New=${currentForm.selectedProjectTracker.projectId}`;
        const changeText = `${newText}~Old=${previousValue}`;
        metricsText = previousValue == null ? newText : changeText;
        const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'project-tracker-id', action: 'changed' });
        this.usageService.createCounterMetric(usageMetricName, metricsText, null);
        this.previousForm = new ValDiscoveryUIModel({ ...currentForm });
      }
      else if (currentForm.selectedProjectTracker.projectId != null && previousValue != null && currentForm.selectedProjectTracker.projectId !== previousValue){
        const newText = `New=${currentForm.selectedProjectTracker.projectId}`;
        const changeText = `${newText}~Old=${previousValue}`;
        metricsText = previousValue == null ? newText : changeText;
        const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'project-tracker-id', action: 'changed' });
        this.usageService.createCounterMetric(usageMetricName, metricsText, null);
        this.previousForm = new ValDiscoveryUIModel({ ...currentForm });
      }
      
    }
    if (currentForm.selectedRadLookup != null) {
      const productMetric: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'product', action: 'changed' });
      const previousProduct = previousForm != null && previousForm.selectedRadLookup != null ? previousForm.selectedRadLookup.product : null;
      if (currentForm.selectedRadLookup.product != null && previousProduct != null && currentForm.selectedRadLookup.product !== previousProduct){
        const newProductText = `New=${currentForm.selectedRadLookup.product}`;
        const changeProductText = `${newProductText}~Old=${previousProduct}`;
        const productMetricText = previousProduct == null || previousProduct === '' ? newProductText : changeProductText;
        this.usageService.createCounterMetric(productMetric, productMetricText, null);
        this.previousForm = new ValDiscoveryUIModel({ ...currentForm });
      }
      else if (currentForm.selectedRadLookup.product != null && previousProduct == null ){
        const newProductText = `New=${currentForm.selectedRadLookup.product}`;
        const changeProductText = `${newProductText}~Old=${previousProduct}`;
        const productMetricText = previousProduct == null || previousProduct === '' ? newProductText : changeProductText;
        this.usageService.createCounterMetric(productMetric, productMetricText, null);
        this.previousForm = new ValDiscoveryUIModel({ ...currentForm });
      }

      const categoryMetric = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'category', action: 'changed' });
      const previousCategory = previousForm != null && previousForm.selectedRadLookup != null ? previousForm.selectedRadLookup.category : null;
      if (currentForm.selectedRadLookup.category != null && previousCategory != null && currentForm.selectedRadLookup.category !== previousCategory){
        const newCategoryText = `New=${currentForm.selectedRadLookup.category}`;
        const changeCategoryText = `${newCategoryText}~Old=${previousCategory}`;
        const categoryMetricText = previousCategory == null || previousCategory === '' ? newCategoryText : changeCategoryText;
        this.usageService.createCounterMetric(categoryMetric, categoryMetricText, null);
        this.previousForm = new ValDiscoveryUIModel({ ...currentForm });
      }else if (currentForm.selectedRadLookup.category != null && previousCategory == null){
        const newCategoryText = `New=${currentForm.selectedRadLookup.category}`;
        const changeCategoryText = `${newCategoryText}~Old=${previousCategory}`;
        const categoryMetricText = previousCategory == null || previousCategory === '' ? newCategoryText : changeCategoryText;
        this.usageService.createCounterMetric(categoryMetric, categoryMetricText, null);
        this.previousForm = new ValDiscoveryUIModel({ ...currentForm });
      }
    }

    if (currentForm.cpmValassis != null) {
       const previousCpmValue = previousForm != null && previousForm.cpmValassis != null ? previousForm.cpmValassis : null;
       if (currentForm.cpmValassis != null && previousForm == null){
         const newText = `New=${currentForm.cpmValassis}`;
         const changeText = `${newText}~Old=${previousCpmValue}`;
         const metricsText = previousCpmValue == null ? newText : changeText;
         const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'valassis-cpm', action: 'changed' });
         this.usageService.createCounterMetric(usageMetricName, metricsText, null);
         this.previousForm = new ValDiscoveryUIModel({ ...currentForm });
       }
       else if (currentForm.cpmValassis != null &&  previousCpmValue != null && currentForm.cpmValassis !== previousCpmValue){
        const newText = `New=${currentForm.cpmValassis}`;
        const changeText = `${newText}~Old=${previousCpmValue}`;
        const metricsText = previousCpmValue == null ? newText : changeText;
        const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'valassis-cpm', action: 'changed' });
        this.usageService.createCounterMetric(usageMetricName, metricsText, null);
        this.previousForm = new ValDiscoveryUIModel({ ...currentForm });
       }
    }
    
    if (currentForm.cpmBlended != null) {
      const previousCpmBlendedValue = previousForm != null && previousForm.cpmBlended != null ? previousForm.cpmBlended : null;
      if (currentForm.cpmBlended != null && previousForm == null){
        const newText = `New=${currentForm.cpmBlended}`;
         const changeText = `${newText}~Old=${previousCpmBlendedValue}`;
         const metricsText = previousCpmBlendedValue == null ? newText : changeText;
         const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'blended-cpm', action: 'changed' });
         this.usageService.createCounterMetric(usageMetricName, metricsText, null);
         this.previousForm = new ValDiscoveryUIModel({ ...currentForm });
      }
      else if (currentForm.cpmBlended != null && previousForm != null && currentForm.cpmBlended !== previousForm.cpmBlended){
        const newText = `New=${currentForm.cpmBlended}`;
         const changeText = `${newText}~Old=${previousCpmBlendedValue}`;
         const metricsText = previousCpmBlendedValue == null ? newText : changeText;
         const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'blended-cpm', action: 'changed' });
         this.usageService.createCounterMetric(usageMetricName, metricsText, null);
         this.previousForm = new ValDiscoveryUIModel({ ...currentForm });

      }
    }

  }
}
