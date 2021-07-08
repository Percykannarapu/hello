import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { isEmpty, isString, mapArray } from '@val/common';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import { allAudiences } from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { AppStateService } from 'app/services/app-state.service';
import { FullAppState } from 'app/state/app.interfaces';
import { CreateAudienceUsageMetric } from 'app/state/usage/targeting-usage.actions';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { Observable, Subject } from 'rxjs';
import { filter, map, takeUntil, tap } from 'rxjs/operators';
import { FieldContentTypeCodes } from '../../../../../worker-shared/data-model/impower.data-model.enums';
import { DeleteAudience, UpsertAudience } from '../../../../impower-datastore/state/transient/audience/audience.actions';
import { VarSpecs } from '../../../../models/audience-data.model';
import { createCombinedAudienceInstance } from '../../../../models/audience-factories';
import { UnifiedAudienceService } from '../../../../services/unified-audience.service';

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

  get audienceId() {
    return this.audienceForm.get('audienceId');
  }

  get selectedIndex() {
    return this.audienceForm.get('selectedIndex');
  }

  get audienceList() {
    return this.audienceForm.get('audienceList');
  }

  get audienceName() {
    return this.audienceForm.get('audienceName');
  }

  constructor(private store$: Store<FullAppState>,
              private fb: FormBuilder,
              private confirmationService: ConfirmationService,
              private appStateService: AppStateService,
              private audienceService: UnifiedAudienceService) {
  }

  ngOnInit() {
    this.allIndexValues = [
      {label: 'DMA', value: 'DMA'},
      {label: 'National', value: 'NAT'},
      {label: 'None', value: ''}
    ];
    this.groupedAudiences$ = this.store$.select(allAudiences).pipe(
      filter(audiences => audiences != null),
      map(aud => {
        this.allAudiences = aud;
        return aud.filter(a => (a.audienceSourceType === 'Offline' || a.audienceSourceType === 'Combined') &&
          (a.fieldconte === 'PERCENT' || a.fieldconte === 'INDEX' || a.fieldconte === 'MEDIAN'));
      }),
      tap(audiences => this.hasAudienceSelections = audiences.length > 0),
      map(audList => audList.sort((a, b) => a.audienceName.localeCompare(b.audienceName))),
      mapArray(audience => ({label: audience.audienceName, value: audience})),
    );

    this.combinedAudiences$ = this.store$.select(allAudiences).pipe(
      filter(selectedVars => selectedVars != null),
      map(audiences => audiences.filter(aud => aud.audienceSourceType === 'Combined/Converted' || aud.audienceSourceType === 'Combined' || aud.audienceSourceType === 'Converted')),
      tap(a => a.forEach(aud => this.varNames.set(aud.audienceName.toLowerCase(), aud.audienceIdentifier)))
    );

    this.store$.select(allAudiences).pipe(
      filter(audiences => audiences != null),
      map(allVars => allVars.filter(aud => aud.audienceSourceType === 'Composite')),
    ).subscribe(filteredAudiences => this.dependentVars = filteredAudiences);

    this.audienceForm = this.fb.group({
      audienceId: '',
      audienceName: ['', {validators: [Validators.required], updateOn: 'blur'}],
      audienceList: '',
      selectedIndex: '',
    });

    this.audienceForm.get('audienceList').valueChanges.pipe(
      filter(val => val != null && val !== ''),
      takeUntil(this.destroyed$)).subscribe(selectedAudience => {
      this.showError = false;
      this.audienceTypes.clear();
      if (selectedAudience.length === 1) {
        this.selectedIndex.setValidators([Validators.required]);
        this.selectedIndex.updateValueAndValidity();
        if (selectedAudience[0].fieldconte === 'INDEX')
          this.selectedIndex.setValue(this.allIndexValues.find(a => a.label === 'DMA'));
      }
      if (selectedAudience.length > 1) {
        this.selectedIndex.clearValidators();
        this.selectedIndex.updateValueAndValidity();
        selectedAudience.forEach(variable => this.audienceTypes.add(variable.fieldconte));
        if ((this.selectedIndex != null && this.selectedIndex.value !== '' && this.audienceTypes.size > 1 || (this.audienceTypes.size === 1 && this.audienceTypes.has('INDEX')))) {
          this.showError = true;
          this.selectedIndex.setErrors({'Has Error': true});
        }
      }
    });

    this.audienceForm.get('selectedIndex').valueChanges.pipe(
      filter(base => base != null && base.val !== ''),
      takeUntil(this.destroyed$)
    ).subscribe(() => {
      if (this.audienceList != null && this.audienceList.value.length > 1 && (this.audienceTypes.size > 1 || (this.audienceTypes.size === 1 && this.audienceTypes.has('INDEX')))) {
        setTimeout(() => {
          this.audienceForm.setErrors({'Has Error': true});
        }, 0);
      }
    });

    this.audienceForm.get('audienceName').valueChanges.pipe(takeUntil(this.destroyed$)).subscribe(() => {
      const currentName = this.audienceName.value != null ? this.audienceName.value.trim() : '';
      this.isDuplicateName = false;
      if (this.varNames.has(currentName.toLowerCase()) && (this.varNames.get(currentName.toLowerCase()) !== this.audienceName.parent.controls['audienceId'].value)) {
        this.audienceName.setErrors({'isDuplicateName': true});
        this.isDuplicateName = true;
      }
    });
  }

  ngOnDestroy() {
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
        convertSource.push({
          id: audience.audienceIdentifier, pct: 100.0,
          base: audienceFields.selectedIndex != null ? audienceFields.selectedIndex.value : ''
        });
      });
    }
    if (audienceFields.audienceId == null || audienceFields.audienceId.length === 0) {
      const audience = createCombinedAudienceInstance(audienceFields.audienceName,
        isEmpty(audienceFields.selectedIndex) ? audienceFields.audienceList[0].fieldconte : FieldContentTypeCodes.Index, audienceFields.selectedIndex?.value ?? '',
        audienceFields.audienceList[0].audienceSourceName, isCombined ? 'Combined' : (isCombineConverted ? 'Combined/Converted' : 'Converted'),
        (isCombineConverted || isCombined) ? combinedAudIds : [], combinedVariableNames.join('~'), !(isCombined || isCombineConverted) ? convertSource : []);
      this.audienceService.addAudience(audience);
    } else {
      this.currentAudience = this.allAudiences.filter(a => a.audienceIdentifier === audienceFields.audienceId);
      const editedAudience: Audience = {
        ...this.currentAudience[0],
        audienceIdentifier: audienceFields.audienceId,
        audienceName: audienceFields.audienceName,
        selectedDataSet: audienceFields.selectedIndex != null && audienceFields.selectedIndex !== '' ? audienceFields.selectedIndex.value : '',
        combinedAudiences: (isCombineConverted || isCombined) ? combinedAudIds : [],
        audienceSourceType: isCombined ? 'Combined' : (isCombineConverted ? 'Combined/Converted' : 'Converted'),
        combinedVariableNames: combinedVariableNames.join('~'),
        compositeSource: !(isCombined || isCombineConverted) ? convertSource : [],
      };
      this.store$.dispatch(new UpsertAudience({audience: editedAudience}));
    }
    this.currentAudience = '';
    this.audienceForm.reset();
  }

  resetForm() {
    this.showError = false;
    this.isDuplicateName = false;
    this.audienceForm.reset();
  }

  onEdit(selectedAudience: Audience) {
    const currentSelections: Audience[] = [];
    const currentIndex = selectedAudience.selectedDataSet != null && selectedAudience.selectedDataSet.length > 0 && selectedAudience.selectedDataSet === 'NAT' ?
      this.allIndexValues.find(a => a.label === 'National') : this.allIndexValues.find(a => a.label === selectedAudience.selectedDataSet);
    if (selectedAudience.combinedAudiences != null && selectedAudience.combinedAudiences.length > 0) {
      selectedAudience.combinedAudiences.forEach(previous => {
        this.allAudiences.forEach(current => {
          if (current != null && current.audienceIdentifier === previous)
            currentSelections.push(current);
        });
      });
    }
    if (selectedAudience.compositeSource != null && selectedAudience.compositeSource.length > 0) {
      selectedAudience.compositeSource.forEach((previous: any) => {
        this.allAudiences.forEach(current => {
          if (previous.id != null) {
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
      if (!isString(a) && `${a.id}` === audience.audienceIdentifier)
        isDependent = true;
    }));
    if (isDependent) {
      this.dialogboxHeader = 'Invalid Delete!';
      this.dialogboxWarningmsg = 'Audiences used to create a Combined or Converted or Composite Audience can not be deleted.';
      this.showDialog = true;
    } else {
      this.confirmationService.confirm({
        message: message,
        header: 'Delete Combined Variable',
        icon: 'pi pi-trash',
        accept: () => {
          this.varNames.delete(audience.audienceName);
          this.store$.dispatch(new DeleteAudience({id: audience.audienceIdentifier}));

          const metricText = `${audience.audienceIdentifier}~${audience.audienceName}~${audience.audienceSourceName}~${this.appStateService.analysisLevel$.getValue()}`;
          this.store$.dispatch(new CreateAudienceUsageMetric('combined audience', 'delete', metricText));
          this.audienceForm.reset();
        },
        reject: () => {
        }
      });
    }
  }

  closeDialog() {
    this.showDialog = false;
  }

  isDisabled() : boolean {
    return this.audienceList.value == null || this.audienceList.value.length === 0;
  }
}

