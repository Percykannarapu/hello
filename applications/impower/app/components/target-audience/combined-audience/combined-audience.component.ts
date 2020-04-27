import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { mapArray } from '@val/common';
import { SuccessNotification } from '@val/messaging';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import { getAllAudiences } from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { RemoveVar } from 'app/impower-datastore/state/transient/geo-vars/geo-vars.actions';
import { AppStateService } from 'app/services/app-state.service';
import { TargetAudienceService } from 'app/services/target-audience.service';
import { LocalAppState } from 'app/state/app.interfaces';
import { CreateAudienceUsageMetric } from 'app/state/usage/targeting-usage.actions';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { ImpProjectVarService } from '../../../val-modules/targeting/services/ImpProjectVar.service';

@Component({
  selector: 'val-combined-audience',
  templateUrl: './combined-audience.component.html',
  styleUrls: ['./combined-audience.component.scss'],
})

export class CombinedAudienceComponent implements OnInit {
  groupedAudiences$: Observable<SelectItem[]>;
  combinedAudiences$: Observable<Audience[]>;
  selectedColumns: Audience[];
  selectedOperation: SelectItem;
  allIndexValues: SelectItem[];
  audienceForm: FormGroup;
  hasAudienceSelections: boolean = false;
  isOffline: boolean = false;
  allAudiences: Audience[];
  currentAudience: any;
  showError: boolean;
  isDuplicateName: boolean;

  constructor(private store$: Store<LocalAppState>,
    private fb: FormBuilder,
    private varService: TargetAudienceService,
    private confirmationService: ConfirmationService,
    private appStateService: AppStateService,
    private impVarService: ImpProjectVarService
  ) {

  }

  ngOnInit() {
    this.audienceForm = this.fb.group({
      audienceName: ['', Validators.required],
      audienceList: '',
      selectedIndex: '',
      audienceId: '',
    });
    this.allIndexValues = [
      { label: 'DMA', value: 'DMA' },
      { label: 'National', value: 'NAT' },
    ];
    this.groupedAudiences$ = this.store$.select(getAllAudiences).pipe(
      filter(audiences => audiences != null),
      map(aud => {
        this.allAudiences = aud;
        return aud.filter(a => (a.audienceSourceType === 'Offline' || a.audienceSourceType === 'Combined') &&
                               (a.fieldconte === 'PERCENT' || a.fieldconte === 'INDEX' || a.fieldconte === 'MEDIAN' || a.fieldconte === 'COUNT'));
      }),
      tap(audiences => this.hasAudienceSelections = audiences.length > 0),
      map(audList => audList.sort((a, b) => a.audienceName.localeCompare(b.audienceName))),
      mapArray(audience => ({ label: audience.audienceName, value: audience })),
    );

    this.combinedAudiences$ = this.store$.select(getAllAudiences).pipe(
      filter(allAudiences => allAudiences != null),
      map(audiences => audiences.filter(aud => aud.audienceSourceType === 'Combined/Converted' || aud.audienceSourceType === 'Combined' || aud.audienceSourceType === 'Converted')),
    );
  }
  submitAudiences(audienceFields: any) {
    const isCombined = (audienceFields.audienceList.length > 1 && audienceFields.selectedIndex == null);
    const isCombineConverted = audienceFields.audienceList.length > 1 && audienceFields.selectedIndex != null ;
    const combinedAudIds: string[] = [];
    const combinedVariableNames: string[] = [];
    if (audienceFields.audienceList.length > 0) {
      audienceFields.audienceList.forEach(audience => {
        combinedVariableNames.push(audience.audienceName);
        combinedAudIds.push(audience.audienceIdentifier);
      }
      );
    }
    if (audienceFields.audienceId == null || audienceFields.audienceId.length === 0) {
      const fkId = this.impVarService.getNextStoreId();
      const newAudience: Audience = {
        audienceIdentifier: fkId.toString(),
        audienceName: audienceFields.audienceName,
        showOnMap: false,
        showOnGrid: false,
        exportInGeoFootprint: true,
        exportNationally: false,
        allowNationalExport: false,
        selectedDataSet: audienceFields.selectedIndex != null ? audienceFields.selectedIndex.value : '',
        audienceSourceName: audienceFields.audienceList[0].audienceSourceName,
        audienceSourceType: isCombined ? 'Combined' : (isCombineConverted ? 'Combined/Converted' : 'Converted'),
        fieldconte: audienceFields.selectedIndex != null ? 'INDEX' : audienceFields.audienceList[0].fieldconte, 
        requiresGeoPreCaching: true,
        seq: fkId,
        isCombined: isCombined,
        combinedAudiences: audienceFields.audienceList[0].fieldconte === 'PERCENT' && (isCombineConverted || isCombined)  ? combinedAudIds : [],
        combinedVariableNames: combinedVariableNames.join('~'),
        compositeSource: !(isCombined || isCombineConverted) ? combinedAudIds : [],
      };
      this.varService.addAudience(newAudience);
      // this.store$.dispatch(new SuccessNotification({ message: 'The following audience was created successfully: \n' + newAudience.audienceName, notificationTitle: 'Combine/Convert Audience' }));

    } else {
      this.currentAudience = this.allAudiences.filter(a => a.audienceIdentifier === audienceFields.audienceId);
      const editedAudience: Audience = {
        audienceIdentifier: audienceFields.audienceId,
        audienceName: audienceFields.audienceName,
        showOnMap: this.currentAudience[0].showOnMap,
        showOnGrid: this.currentAudience[0].showOnGrid,
        exportInGeoFootprint: this.currentAudience[0].exportInGeoFootprint,
        exportNationally: this.currentAudience[0].exportNationally,
        allowNationalExport: this.currentAudience[0].allowNationalExport,
        selectedDataSet: audienceFields.selectedIndex != null ? audienceFields.selectedIndex.value : '',
        audienceSourceName: this.currentAudience[0].audienceSourceName,
        audienceSourceType: this.currentAudience[0].audienceSourceType,
        fieldconte: this.currentAudience[0].fieldconte,
        requiresGeoPreCaching: this.currentAudience[0].requiresGeoPreCaching,
        seq: this.currentAudience[0].seq,
        isCombined: this.currentAudience[0].isCombined,
        combinedAudiences: this.currentAudience[0].fieldconte === 'PERCENT' ? combinedAudIds : [],
        combinedVariableNames: combinedVariableNames.join('~'),
        compositeSource: !this.currentAudience[0].isCombined && this.currentAudience[0].selectedDataSet != null ? combinedAudIds : [],
      };
      this.varService.updateProjectVars(editedAudience);
      // this.store$.dispatch(new SuccessNotification({ message: 'The following audience was updated successfully: \n' + editedAudience.audienceName, notificationTitle: 'Combine Audience' }));

    }
    this.currentAudience = '';
    this.audienceForm.reset();
  }

  hasErrors(controlKey: string) : boolean {
    const control = this.audienceForm.get(controlKey);
    return control.errors != null;
  }

  resetForm() {
    this.selectedColumns = null;
    this.selectedOperation = null;
    this.audienceForm.reset();
  }

  onEdit(selectedAudience: Audience) {
    const currentSelections: Audience[] = [];
    const currentIndex = selectedAudience.selectedDataSet != null && selectedAudience.selectedDataSet.length > 0 && selectedAudience.selectedDataSet === 'NAT' ?
                        this.allIndexValues.find(a => a.label === 'National') : this.allIndexValues.find(a => a.label === selectedAudience.selectedDataSet);

    if (selectedAudience.combinedAudiences.length > 0){
      selectedAudience.combinedAudiences.forEach(previous => {
        this.allAudiences.forEach(current => {
          if (current != null && current.audienceIdentifier === previous)
            currentSelections.push(current);
        });
      });
    }
    if (selectedAudience.compositeSource.length > 0){
      selectedAudience.compositeSource.forEach(previous => {
        this.allAudiences.forEach(current => {
          if (current != null && current.audienceIdentifier === previous)
            currentSelections.push(current);
        });
      });
    }
   
    this.audienceForm = this.fb.group({
      audienceName: selectedAudience.audienceName,
      audienceList: currentSelections,
      audienceId: selectedAudience.audienceIdentifier,
      selectedIndex: currentIndex
    });
    this.selectedColumns = currentSelections;
    this.selectedOperation = currentIndex;
  }

  onDelete(audience: Audience) {
    const message = 'Are you sure you want to delete the following combined variable? <br/> <br/>' +
      `${audience.audienceName}`;
    this.confirmationService.confirm({
      message: message,
      header: 'Delete Combined Variable',
      icon: 'ui-icon-delete',
      accept: () => {
        this.varService.addDeletedAudience(audience.audienceSourceType, audience.audienceSourceName, audience.audienceIdentifier);
        this.varService.removeAudience(audience.audienceSourceType, audience.audienceSourceName, audience.audienceIdentifier);
        this.store$.dispatch(new RemoveVar({ varPk: audience.audienceIdentifier }));

        let metricText = null;
        metricText = `${audience.audienceIdentifier}~${audience.audienceName}~${audience.audienceSourceName}~${this.appStateService.analysisLevel$.getValue()}`;
        this.store$.dispatch(new CreateAudienceUsageMetric('combined audience', 'delete', metricText));
        this.audienceForm.reset();
      },
      reject: () => { }
    });
  }

  isDisabled() {
    let result = false;
    this.showError = false;
    const audienceTypes: Set<string> = new Set<string>();
    const varNames: Set<string> = new Set<string>();
      this.combinedAudiences$.subscribe(a => {
        a.forEach(aud => {
          varNames.add(aud.audienceName);
      });
      });

    if (this.selectedColumns != null && this.selectedColumns.length > 0) {
      result = (this.selectedColumns.length === 1 && this.selectedColumns[0].fieldconte === 'PERCENT' && this.selectedOperation == null);

      if (this.selectedColumns.length === 1 && this.selectedColumns[0].fieldconte === 'INDEX' && this.selectedOperation == null) {
        this.selectedOperation = this.allIndexValues.find(a => a.label === 'DMA');
      }
      if (this.selectedColumns.length > 1) {
        this.selectedColumns.forEach(variable => audienceTypes.add(variable.fieldconte));
        if (audienceTypes.size === 1 && (audienceTypes.has('INDEX'))) {
          this.selectedOperation = null;
          result = true;
        }

        if (audienceTypes.size > 1 || (audienceTypes.size === 1 && !audienceTypes.has('PERCENT'))) {
          this.selectedOperation = null;
          this.showError = true;
          result = true;
        }

      }
    }
    const audName = this.audienceForm.get('audienceName');
    this.isDuplicateName = !audName.untouched &&  varNames.has(audName.value);  
    return (result || this.isDuplicateName || audName.status === 'INVALID' || this.selectedColumns == null || this.selectedColumns.length === 0);

  }
}

