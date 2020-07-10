import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, ValidatorFn, AbstractControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import { mapArray } from '@val/common';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import { getAllAudiences } from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { RemoveVar } from 'app/impower-datastore/state/transient/geo-vars/geo-vars.actions';
import { AppStateService } from 'app/services/app-state.service';
import { TargetAudienceService } from 'app/services/target-audience.service';
import { LocalAppState } from 'app/state/app.interfaces';
import { CreateAudienceUsageMetric } from 'app/state/usage/targeting-usage.actions';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { Observable, Subject } from 'rxjs';
import { filter, map, tap, takeUntil } from 'rxjs/operators';
import { ImpProjectVarService } from '../../../val-modules/targeting/services/ImpProjectVar.service';
import { VarSpecs } from 'app/services/target-audience-unified.service';

@Component({
  selector: 'val-combined-audience',
  templateUrl: './combined-audience.component.html',
  styleUrls: ['./combined-audience.component.scss'],
  encapsulation: ViewEncapsulation.None,
})

export class CombinedAudienceComponent implements OnInit, OnDestroy {

  audienceForm: FormGroup;
  allIndexValues: SelectItem[];
  groupedAudiences$: Observable<SelectItem[]>;
  combinedAudiences$: Observable<Audience[]>;
  dependentVars: Audience[];
  hasAudienceSelections: boolean = false;
  allAudiences: Audience[];
  currentAudience: any;
  showError: boolean = false;
  isDuplicateName: boolean = false;
  varNames: Map<string, string> = new Map<string, string>([]);
  destroyed$ = new Subject<void>();
  audienceTypes: Set<string> = new Set<string>([]);
  public showDialog: boolean = false;
  public dialogboxWarningmsg: string = '';
  public dialogboxHeader: string = '';

  get audienceId() { return this.audienceForm.get('audienceId'); }
  get selectedIndex() { return this.audienceForm.get('selectedIndex'); }
  get audienceList() { return this.audienceForm.get('audienceList'); }
  get audienceName() { return this.audienceForm.get('audienceName'); }

  constructor(private store$: Store<LocalAppState>,
    private fb: FormBuilder,
    private varService: TargetAudienceService,
    private confirmationService: ConfirmationService,
    private appStateService: AppStateService,
    private impVarService: ImpProjectVarService
  ) { }

  ngOnInit() {
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
      filter(selectedVars => selectedVars != null),
      map(audiences => audiences.filter(aud => aud.audienceSourceType === 'Combined/Converted' || aud.audienceSourceType === 'Combined' || aud.audienceSourceType === 'Converted')),
      tap(a => a.forEach(aud => this.varNames.set(aud.audienceName.toLowerCase(), aud.audienceIdentifier)))
    );

    this.store$.select(getAllAudiences).pipe(
      filter(audiences => audiences != null),
      map(allVars => allVars.filter(aud => aud.audienceSourceType === 'Composite')),
    ).subscribe(filteredAudiences => this.dependentVars = filteredAudiences);

    this.audienceForm = this.fb.group({
      audienceId: '',
      audienceName: ['', { validators: [Validators.required], updateOn: 'blur' }],
      audienceList: '',
      selectedIndex: '',
    });


    this.audienceForm.get('audienceList').valueChanges.pipe(
      takeUntil(this.destroyed$)).subscribe(value => {
        this.showError = false;
        this.audienceTypes.clear();
        const selectedIndex = this.audienceForm.get('selectedIndex');
        if (value != null && value.length === 1) {
          selectedIndex.setValidators([Validators.required]);
          selectedIndex.updateValueAndValidity();
          if (value[0].fieldconte === 'INDEX')
            selectedIndex.setValue(this.allIndexValues.find(a => a.label === 'DMA'));
        } 
        if (value != null && value.length > 1) {
          selectedIndex.clearValidators();
          selectedIndex.updateValueAndValidity();
          value.forEach(variable => this.audienceTypes.add(variable.fieldconte));
          if (this.audienceTypes.size > 1 || (this.audienceTypes.size === 1 && !this.audienceTypes.has('PERCENT'))) {
            selectedIndex.setErrors({'Has Error': true});
            this.showError = true;
          }
        } 
      });

      this.audienceForm.get('audienceName').valueChanges.pipe(takeUntil(this.destroyed$)).subscribe( value => {
        const audienceName = this.audienceForm.get('audienceName');
        const currentName = audienceName.value != null ?  audienceName.value.trim() : '';
        this.isDuplicateName = false;
        if (this.varNames.has(currentName.toLowerCase()) && (this.varNames.get(currentName.toLowerCase()) !== audienceName.parent.controls['audienceId'].value)){
          audienceName.setErrors({'isDuplicateName': true});
          this.isDuplicateName = true;
        }
      });
  }

  ngOnDestroy() : void {
    this.destroyed$.next();
  }

  onSubmit(audienceFields: any) {
    const isCombined = (audienceFields.audienceList.length > 1 && (audienceFields.selectedIndex == null || audienceFields.selectedIndex === ''));
    const isCombineConverted = audienceFields.audienceList.length > 1 && audienceFields.selectedIndex != null && audienceFields.selectedIndex !== '';
    const combinedAudIds: string[] = [];
    const convertSource: VarSpecs[] = [];
    const combinedVariableNames: string[] = [];
    if (audienceFields.audienceList.length > 0) {
      audienceFields.audienceList.forEach(audience => {
        combinedVariableNames.push(audience.audienceName);
        combinedAudIds.push(audience.audienceIdentifier);
        convertSource.push({id: audience.audienceIdentifier, pct: 100.0, 
                            base: audienceFields.selectedIndex != null ? audienceFields.selectedIndex.value : '' });
      });
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
        isComposite: false,
        combinedAudiences: audienceFields.audienceList[0].fieldconte === 'PERCENT' && (isCombineConverted || isCombined) ? combinedAudIds : [],
        combinedVariableNames: combinedVariableNames.join('~'),
        compositeSource: !(isCombined || isCombineConverted) ? convertSource : [],
      };
      this.varService.addAudience(newAudience);

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
        selectedDataSet: audienceFields.selectedIndex != null && audienceFields.selectedIndex !== '' ? audienceFields.selectedIndex.value : '',
        audienceSourceName: this.currentAudience[0].audienceSourceName,
        audienceSourceType: this.currentAudience[0].audienceSourceType,
        fieldconte: this.currentAudience[0].fieldconte,
        requiresGeoPreCaching: this.currentAudience[0].requiresGeoPreCaching,
        seq: this.currentAudience[0].seq,
        isCombined: this.currentAudience[0].isCombined,
        isComposite: this.currentAudience[0].isComposite,
        combinedAudiences: this.currentAudience[0].fieldconte === 'PERCENT' ? combinedAudIds : [],
        combinedVariableNames: combinedVariableNames.join('~'),
        compositeSource: !this.currentAudience[0].isCombined && this.currentAudience[0].selectedDataSet != null && audienceFields.selectedIndex !== ''  ? convertSource : [],
      };
      this.varService.updateProjectVars(editedAudience);
    }
    this.currentAudience = '';
    this.audienceForm.reset();
  }

  resetForm() {
    this.audienceForm.reset();
  }

  onEdit(selectedAudience: Audience) {
    const currentSelections: Audience[] = [];
    const currentIndex = selectedAudience.selectedDataSet != null && selectedAudience.selectedDataSet.length > 0 && selectedAudience.selectedDataSet === 'NAT' ?
    this.allIndexValues.find(a => a.label === 'National') : this.allIndexValues.find(a => a.label === selectedAudience.selectedDataSet);
    if (selectedAudience.combinedAudiences.length > 0) {
      selectedAudience.combinedAudiences.forEach(previous => {
        this.allAudiences.forEach(current => {
          if (current != null && current.audienceIdentifier === previous)
            currentSelections.push(current);
        });
      });
    }
    if (selectedAudience.compositeSource.length > 0) {
      selectedAudience.compositeSource.forEach((previous: any) => {
        this.allAudiences.forEach(current => {
          if (previous.id != null){
            if (current != null && current.audienceIdentifier === previous.id.toString())
              currentSelections.push(current);
          } else {
            if (current != null && current.audienceIdentifier === previous.toString())
              currentSelections.push(current);
          }
        });
      });
    }
    this.audienceForm.setValue({
      audienceId: selectedAudience.audienceIdentifier,
      audienceName: selectedAudience.audienceName,
      audienceList: currentSelections,
      selectedIndex: currentIndex != null ? currentIndex : null,
    });
  }

  onDelete(audience: Audience) {
    const message = 'Are you sure you want to delete the following combined variable? <br/> <br/>' +
      `${audience.audienceName}`;
      let isDependent: boolean = false;
      this.dependentVars.map((aud: Audience) => aud.compositeSource.forEach(a => {
        if (a.id.toString() === audience.audienceIdentifier)
            isDependent = true;
      }));
      if (isDependent){
          this.dialogboxHeader = 'Invalid Delete!';
          this.dialogboxWarningmsg = 'Audiences used to create a Combined or Converted or Composite Audience can not be deleted.';
          this.showDialog = true;
        } else {
          this.confirmationService.confirm({
            message: message,
            header: 'Delete Combined Variable',
            icon: 'ui-icon-delete',
            accept: () => {
              this.varNames.delete(audience.audienceName);
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
  }

  closeDialog(){
    this.showDialog = false;
  }

  isDisabled() : boolean{
    const audiences = this.audienceForm.get('audienceList');
    return audiences.value == null || audiences.value.length === 0 ;
  }
}

