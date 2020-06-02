import { Component, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { filterArray, mapBy, mapByExtended, groupByExtended } from '@val/common';
import { combineLatest, Observable, of } from 'rxjs';
import { filter, map, tap, switchMap } from 'rxjs/operators';
import { User } from '../../models/User';
import { ValDiscoveryUIModel } from '../../models/val-discovery.model';
import { AppDiscoveryService, ProjectTrackerUIModel, RadLookupUIModel } from '../../services/app-discovery.service';
import { AppLoggingService } from '../../services/app-logging.service';
import { AppStateService } from '../../services/app-state.service';
import { TargetAudienceService } from '../../services/target-audience.service';
import { UserService } from '../../services/user.service';
import { LocalAppState } from '../../state/app.interfaces';
import { CalculateMetrics, DeleteCustomTAGeos, DeleteMustCoverGeos, DeleteCustomData } from '../../state/data-shim/data-shim.actions';
import { CreateProjectUsageMetric } from '../../state/usage/targeting-usage.actions';
import { ImpProject } from '../../val-modules/targeting/models/ImpProject';
import { ImpProjectService } from '../../val-modules/targeting/services/ImpProject.service';
import { DiscoveryInputComponent } from './discovery-input/discovery-input.component';
import { ImpGeofootprintGeoService } from 'app/val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ConfirmationService } from 'primeng/api';
import { ImpGeofootprintTradeAreaService } from 'app/val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { AppTradeAreaService } from 'app/services/app-trade-area.service';
import { ImpGeofootprintGeo } from 'app/val-modules/targeting/models/ImpGeofootprintGeo';
import { AppGeoService } from 'app/services/app-geo.service';
import { projectIsReady } from 'app/state/data-shim/data-shim.selectors';
import { ForceHomeGeos } from 'app/state/homeGeocode/homeGeo.actions';
import { SuccessNotification } from '@val/messaging';

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


  @ViewChild('discoveryFormComponent', { static: true })
  private discoveryFormComponent: DiscoveryInputComponent;

  constructor(private appStateService: AppStateService,
              private appDiscoveryService: AppDiscoveryService,
              private userService: UserService,
              private impProjectService: ImpProjectService,
              private impGeofootprintGeoService: ImpGeofootprintGeoService,
              private logger: AppLoggingService,
              private targetAudienceService: TargetAudienceService,
              private confirmationService: ConfirmationService,
              private impGeofootprintTradeAreaService: ImpGeofootprintTradeAreaService,
              private appGeoService: AppGeoService,
              private tradeAreaService: AppTradeAreaService,
              private store$: Store<LocalAppState>) { }

  ngOnInit() {
    this.currentDiscoveryData$ =
      combineLatest([this.appStateService.applicationIsReady$, this.appStateService.currentProject$, this.appDiscoveryService.selectedRadLookup$, this.appDiscoveryService.selectedProjectTracker$])
        .pipe(
          filter(([appIsReady]) => appIsReady),
          map(([, currentProject, selectedRad, selectedTracker]) => ValDiscoveryUIModel.createFromProject(currentProject, selectedRad, selectedTracker)),
          tap(UIData => this.logger.debug.log('Discovery UI data changed', UIData))
        );
    this.currentRadSuggestions$ = this.appDiscoveryService.radSearchSuggestions$;
    this.currentProjectTrackerSuggestions$ = this.appDiscoveryService.trackerSearchSuggestions$;

    this.onlineAudienceExists$ = this.targetAudienceService.allAudiencesBS$.pipe(
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
    this.logUsageMetricForChange(this.previousForm, newValues);

    if (currentProject != null) {
      this.validateSwitchAnalysisLevel(currentProject, newValues);
      
    }
    this.previousForm = new ValDiscoveryUIModel({ ...newValues });
  }

  updateDiscoveryForm(newValues: ValDiscoveryUIModel, currentProject: ImpProject){
    const currentUser: User = this.userService.getUser();
    newValues.updateProjectItem(currentProject);
      // Update audit columns
      if (currentProject.createUser == null)
        currentProject.createUser = (currentUser.userId) ? (currentUser.userId) : -1;
      if (currentProject.createDate == null)
        currentProject.createDate = Date.now();
      currentProject.modifyUser = (currentUser.userId) ? (currentUser.userId) : -1;
      currentProject.modifyDate = Date.now();

      if (this.previousForm != null) {
        if (this.previousForm.circulationBudget !== newValues.circulationBudget ||
            this.previousForm.dollarBudget !== newValues.dollarBudget ||
            this.previousForm.cpmAnne !== newValues.cpmAnne ||
            this.previousForm.cpmSolo !== newValues.cpmSolo ||
            this.previousForm.cpmValassis !== newValues.cpmValassis ||
            this.previousForm.cpmBlended !== newValues.cpmBlended ||
            this.previousForm.selectedSeason !== newValues.selectedSeason ) {
          this.store$.dispatch(new CalculateMetrics());
        }
      }

      this.impProjectService.makeDirty();
      this.previousForm = new ValDiscoveryUIModel({ ...newValues });
  }

  validateSwitchAnalysisLevel(currentProject: ImpProject, newValues: ValDiscoveryUIModel){
    const oldAnalysislevel = currentProject.methAnalysis;

    if (oldAnalysislevel != null && oldAnalysislevel !== newValues.selectedAnalysisLevel){
        const header = 'Change Analysis Level Confirmation';
        //oldAnalysislevel = currentProject.projectId != null && oldAnalysislevel == null ? newValues.selectedAnalysisLevel : oldAnalysislevel;
        const isMustCoverExists = this.impGeofootprintGeoService.allMustCoverBS$.value.length > 0;
        const isCustomTaExists = this.impGeofootprintTradeAreaService.get().filter(ta => ta.taType === 'CUSTOM').length > 0;
        const isCustomDataExixts = this.targetAudienceService.allAudiencesBS$.value.filter(aud => aud.audienceSourceType === 'Custom').length > 0;
        if (!isMustCoverExists && !isCustomTaExists && !isCustomDataExixts){
          this.updateDiscoveryForm(newValues, currentProject);
        }
        else {
          let customType = '';
          const customTaGeos: ImpGeofootprintGeo[] = [];
          if (isCustomTaExists){
            customType = 'Custom Trade Area';  
            this.impGeofootprintTradeAreaService.get().forEach(ta => { if (ta.taType === 'CUSTOM') customTaGeos.push(...ta.impGeofootprintGeos); });
          }
          if (isMustCoverExists)
            customType = isCustomTaExists ? customType + '/Must Cover' : customType + 'Must Cover';
          if (isCustomDataExixts)
            customType = isMustCoverExists || isCustomTaExists ? customType + '/Custom Data' : customType + 'Custom Data';
          
          const customMessage = `You have ${customType} geographies uploaded at a different analysis level which will be deleted upon changing levels. Do you want to continue?`;
          
          this.confirmationService.confirm({
            header: header,
            message: customMessage,
            key: 'mustCoverKey',
            accept: () => {
                if (isMustCoverExists)
                  this.store$.dispatch(new DeleteMustCoverGeos({deleteMustCover: true}));
                if (isCustomTaExists)  
                  this.store$.dispatch(new DeleteCustomTAGeos({ deleteCustomTa: true }));
                if (isCustomDataExixts)
                  this.store$.dispatch(new DeleteCustomData({ deleteCustomData: true }));  
                this.updateDiscoveryForm(newValues, currentProject);
                this.store$.dispatch(new SuccessNotification({message: `All ${customType} geographies related to the previously selected Analysis Level have been deleted.`, 
                                                              notificationTitle: 'Change Analysis Level Cleanup'}));
            },
            reject: () => {
                newValues.selectedAnalysisLevel = oldAnalysislevel ;
                this.updateDiscoveryForm(newValues, currentProject);
            }
          });
        }
      }else{
        this.updateDiscoveryForm(newValues, currentProject);
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
    const formFieldNames = Object.keys(currentForm);
    formFieldNames.forEach(fieldName => {
      const previousValue = previousForm != null ? previousForm[fieldName] : null;
      const currentValue = currentForm != null ? currentForm[fieldName] : null;
      const usageTarget = this.usageTargetMap[fieldName];
      // only log values that are tracked and have changed
      if (usageTarget != null && previousValue !== currentValue) {
        this.logSingleUsage(previousValue, currentValue, usageTarget);
      }
    });

    // custom metrics that aren't picked up by the above code - these guys are complex objects, not simple value types
    // Project Tracker - just need to track the id
    const previousProjectTrackerId = previousForm != null && previousForm.selectedProjectTracker != null ? previousForm.selectedProjectTracker.projectId : null;
    const currentProjectTrackerId = currentForm != null && currentForm.selectedProjectTracker != null ? currentForm.selectedProjectTracker.projectId : null;
    if (previousProjectTrackerId !== currentProjectTrackerId) {
      this.logSingleUsage(previousProjectTrackerId, currentProjectTrackerId, 'project-tracker-id');
    }
    // Rad Lookup - need to track both product and category
    const previousRad = previousForm != null && previousForm.selectedRadLookup != null ? previousForm.selectedRadLookup.display : null;
    const currentRad = currentForm != null && currentForm.selectedRadLookup != null ? currentForm.selectedRadLookup.display : null;
    if (previousRad !== currentRad) {
      const previousProduct = previousRad == null ? null : previousForm.selectedRadLookup.product;
      const currentProduct = currentRad == null ? null : currentForm.selectedRadLookup.product;
      const previousCategory = previousRad == null ? null : previousForm.selectedRadLookup.category;
      const currentCategory = currentRad == null ? null : currentForm.selectedRadLookup.category;
      this.logSingleUsage(previousProduct, currentProduct, 'product');
      this.logSingleUsage(previousCategory, currentCategory, 'category');
    }
  }

  private logSingleUsage(previousValue: any, currentValue: any, target: string) : void {
    const newText = currentValue == null ? 'New=(empty)' : `New=${currentValue}`;
    const changeText = `${newText}~Old=${previousValue}`;
    const metricsText = previousValue == null ? newText : changeText;
    this.store$.dispatch(new CreateProjectUsageMetric(target, 'changed', metricsText));
  }

  onDiscoveryFormClose(){
    this.discoveryFormComponent.onFormClose();
  }


}
