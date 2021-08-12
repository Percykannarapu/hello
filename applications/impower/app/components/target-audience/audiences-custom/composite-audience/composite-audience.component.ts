import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { isEmpty, isString, mapArray } from '@val/common';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { allAudiences } from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { AppStateService } from 'app/services/app-state.service';
import { LocalAppState } from 'app/state/app.interfaces';
import { CreateAudienceUsageMetric } from 'app/state/usage/targeting-usage.actions';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { filter, map, takeUntil, tap } from 'rxjs/operators';
import { ValassisValidators } from '../../../../common/valassis-validators';
import { DeleteAudience, UpsertAudience } from '../../../../impower-datastore/state/transient/audience/audience.actions';
import { VarSpecs } from '../../../../models/audience-data.model';
import { createCompositeAudienceInstance } from '../../../../models/audience-factories';
import { UnifiedAudienceService } from '../../../../services/unified-audience.service';

@Component({
  selector: 'val-composite-audience',
  templateUrl: './composite-audience.component.html',
  styleUrls: ['./composite-audience.component.scss']
})
export class CompositeAudienceComponent implements OnInit, OnDestroy {

  compositeForm: FormGroup;
  allIndexValues: SelectItem[];
  hasAudienceSelections: boolean = false;
  destroyed$ = new Subject<void>();
  showError: boolean = false;
  varNames: Map<string, string> = new Map<string, string>([]);
  isDuplicateName: boolean = false;
  currentAudience: any;
  allAudiences: Audience[];
  indexTypes: Set<string> = new Set<string>([]);
  dependentVars: Audience[];

  private selectedAudiences: Observable<Audience[]>;
  public compositeAudiences$: Observable<Audience[]>;
  private editAudience$ = new BehaviorSubject<Audience>(null);
  public filteredAudiences$: Observable<SelectItem[]>;
  public showDialog: boolean = false;
  public dialogboxWarningmsg: string = '';
  public dialogboxHeader: string = '';

  get audienceRows() : FormArray {
    return this.compositeForm.get('audienceRows') as FormArray;
  }

  get compositeAudienceId() {
    return this.compositeForm.get('compositeAudienceId');
  }

  get compositeAudName() {
    return this.compositeForm.get('compositeAudName');
  }

  get selectedAudienceList() : FormGroup[] {
    return this.audienceRows.controls as FormGroup[];
  }

  get indexBase() : FormGroup[] {
    return this.audienceRows.controls as FormGroup[];
  }

  constructor(private fb: FormBuilder,
              private appStateService: AppStateService,
              private audienceService: UnifiedAudienceService,
              private confirmationService: ConfirmationService,
              private store$: Store<LocalAppState>) {
  }

  ngOnInit() {
    this.selectedAudiences = this.store$.select(fromAudienceSelectors.allAudiences).pipe(
      filter(audiences => audiences != null && audiences.length > 0),
      map(aud => {
        this.allAudiences = aud;
        return aud.filter(a => (a.audienceSourceType === 'Offline' || a.audienceSourceType === 'Online' || a.audienceSourceType === 'Combined' ||
          a.audienceSourceType === 'Combined/Converted' || a.audienceSourceType === 'Converted' || a.audienceSourceType === 'Composite') &&
          (a.fieldconte === 'PERCENT' || a.fieldconte === 'INDEX' || a.fieldconte === 'MEDIAN'));
      }),
      tap(audiences => this.hasAudienceSelections = audiences.length > 0),
      map((audList: Audience[]) => audList.sort((a, b) => a.audienceName.localeCompare(b.audienceName))),
    );

    this.filteredAudiences$ = combineLatest([this.selectedAudiences, this.editAudience$]).pipe(
      map(([selected, currentSelection]) => {
        if (currentSelection != null) {
          return selected.filter(audience => audience.audienceIdentifier !== currentSelection.audienceIdentifier);  //handles self-referencing
        } else
          return selected;
      }),
      mapArray(filtered => ({
        label: filtered.audienceSourceName != null && filtered.audienceSourceName.length > 0 ?
          filtered.audienceName + ' - ' + filtered.audienceSourceName : filtered.audienceName,
        value: filtered
      })),
    );

    this.compositeAudiences$ = this.store$.select(allAudiences).pipe(
      filter(audiences => audiences != null),
      map(audiences => audiences.filter(aud => aud.audienceSourceType === 'Composite')),
      tap(filteredVars => this.dependentVars = filteredVars)
    );

    this.appStateService.clearUI$.subscribe(() => {
      this.resetForm();
    });

    this.compositeAudiences$.subscribe(a => a.forEach(aud => this.varNames.set(aud.audienceName.toLowerCase(), aud.audienceIdentifier)));

    this.allIndexValues = [
      {label: 'DMA', value: 'DMA'},
      {label: 'National', value: 'NAT'},
      {label: '', value: 'ALL'}
    ];
    this.setupForm();

    this.compositeForm.get('compositeAudName').valueChanges.pipe(takeUntil(this.destroyed$)).subscribe(() => {
      const audienceName = this.compositeForm.get('compositeAudName');
      const currentName = audienceName.value != null ? audienceName.value.trim() : '';

      this.isDuplicateName = this.varNames.has(currentName.toLowerCase()) &&
        this.varNames.get(currentName.toLowerCase()) !== audienceName.parent.controls['compositeAudienceId'].value;
    });

    this.appStateService.clearUI$.subscribe(() => {
      this.resetForm();
    });
  }

  ngOnDestroy() {
    this.destroyed$.next();
  }

  setupForm() {
    const formSetup = {
      compositeAudienceId: new FormControl(''),
      compositeAudName: new FormControl('', {validators: [Validators.required], updateOn: 'blur'}),
      audienceRows: new FormArray([])
    };
    this.compositeForm = this.fb.group(formSetup);
    this.addRow();
    this.addRow();
  }

  onSubmit(audienceFields: any) {
    const compositeAudIds: VarSpecs[] = [];
    const weights: number[] = [];
    let total: number = 0;
    const selectedVariableNames: string[] = [];
    if (audienceFields.audienceRows.length > 0) {
      audienceFields.audienceRows.forEach(selectedRow => {
        this.indexTypes.add(selectedRow.indexBase);
        if(!isEmpty(selectedRow.percent))
          weights.push(selectedRow.percent);
        selectedVariableNames.push(selectedRow.selectedAudienceList?.audienceName + '-' + selectedRow.indexBase + '-' + selectedRow.percent);
        compositeAudIds.push({
          id: Number(selectedRow.selectedAudienceList?.audienceIdentifier),
          pct: Number(selectedRow.percent),
          base: selectedRow.indexBase != null ? selectedRow.indexBase : 'NAT'
        });
      });
    }
    if (weights.length > 0) {
      total = weights.reduce((p, c) => p + Number(c), 0);
    }
    if (total === 100) {
      this.showError = false;
      if (audienceFields.compositeAudienceId == null || audienceFields.compositeAudienceId.length === 0) {
        const audience = createCompositeAudienceInstance(audienceFields.compositeAudName,
          this.indexTypes.size == 2 ? 'ALL' : Array.from(this.indexTypes)[0], selectedVariableNames.join('~'), compositeAudIds);
        this.audienceService.addAudience(audience);
      } else {
        this.currentAudience = this.allAudiences.filter(a => a.audienceIdentifier === audienceFields.compositeAudienceId);
        const editedAudience: Audience = {
          ...this.currentAudience[0],
          audienceIdentifier: audienceFields.compositeAudienceId,
          audienceName: audienceFields.compositeAudName,
          selectedDataSet: this.indexTypes.size == 2 ? 'ALL' : Array.from(this.indexTypes)[0],
          combinedVariableNames: selectedVariableNames.join('~'),
          compositeSource: compositeAudIds,
        };
        this.store$.dispatch(new UpsertAudience({ audience: editedAudience }));

      }
      this.currentAudience = [];
      this.indexTypes.clear();
    } else {
      this.showError = true;
    }
    this.resetForm();
  }

  addRow(newRow?: any) {
    this.showError = false;
    //TODO: introduces memory leak
    const audienceArray = this.compositeForm.controls.audienceRows as FormArray;
    const arraylen = audienceArray.length;
    let newAudienceGroup: FormGroup;
    if (newRow != null) {
      newAudienceGroup = this.fb.group({
        selectedAudienceList: new FormControl(newRow.selectedAudienceList, {validators: [Validators.required]}),
        indexBase: new FormControl(newRow.indexBase, {validators: [Validators.required]}),
        percent: new FormControl(newRow.percent, {validators: [Validators.required, ValassisValidators.numeric, ValassisValidators.greaterThan(0), ValassisValidators.lessThan(100)]})
      });
    } else {
      newAudienceGroup = this.fb.group({
        selectedAudienceList: new FormControl('', {validators: [Validators.required]}),
        indexBase: new FormControl('', {validators: [Validators.required]}),
        percent: new FormControl('', {validators: [Validators.required, ValassisValidators.numeric, ValassisValidators.greaterThan(0), ValassisValidators.lessThan(100)]})
      });
    }
    newAudienceGroup.get('selectedAudienceList').valueChanges.pipe(takeUntil(this.destroyed$)).subscribe(val => {
      if (val != null && val.fieldconte != null && val.audienceSourceType != null) {
        if (val.fieldconte === 'INDEX' && (val.audienceSourceType === 'Offline' || val.audienceSourceType === 'Online')) {
          newAudienceGroup.patchValue({indexBase: this.allIndexValues.find(a => a.label === 'National').value});
        }
        if (val.audienceSourceType === 'Converted' || val.audienceSourceType === 'Combined/Converted') {
          if (val.selectedDataSet === 'DMA') {
            newAudienceGroup.get('indexBase').enable();
            newAudienceGroup.patchValue({indexBase: this.allIndexValues.find(a => a.label === val.selectedDataSet).value});
          }
          if (val.selectedDataSet === 'NAT') {
            newAudienceGroup.get('indexBase').enable();
            newAudienceGroup.patchValue({indexBase: this.allIndexValues.find(a => a.label === 'National').value});
          }
        } else if (val.audienceSourceType === 'Composite') {
          // newAudienceGroup.clearValidators();
          newAudienceGroup.get('indexBase').reset();
          newAudienceGroup.get('indexBase').disable();
        } else {
          newAudienceGroup.get('indexBase').enable();
        }
      }
    });
    audienceArray.insert(arraylen + 1, newAudienceGroup);
  }

  onRemove(i: number) {
    const audienceArray = this.compositeForm.controls.audienceRows as FormArray;
    audienceArray.removeAt(i);
  }

  onDelete(audience: Audience) {
    const message = 'Are you sure you want to delete the following composite variable? <br/> <br/>' + `${audience.audienceName}`;
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
        header: 'Delete Composite Variable',
        icon: 'pi pi-trash',
        accept: () => {
          this.varNames.delete(audience.audienceName);
          this.store$.dispatch(new DeleteAudience({ id: audience.audienceIdentifier }));

          const metricText = `${audience.audienceIdentifier}~${audience.audienceName}~${audience.audienceSourceName}~${this.appStateService.analysisLevel$.getValue()}`;
          this.store$.dispatch(new CreateAudienceUsageMetric('composite audience', 'delete', metricText));
          this.resetForm();
        },
        reject: () => {
        }
      });
    }
  }

  resetForm() {
    this.showError = false;
    this.isDuplicateName = false;
    this.compositeForm.reset();
  }

  closeDialog() {
    this.showDialog = false;
  }

  onEdit(selectedAudience: Audience) {
    let currentRows: any = [];
    const compositeSelectItem = this.allIndexValues.find(v => v.label === '');
    const nationalSelectItem = this.allIndexValues.find(base => base.label === 'National');
    const dmaSelectItem = this.allIndexValues.find(b => b.label === 'DMA');
    const compositeBase = compositeSelectItem != null ? compositeSelectItem.value : null;
    const nationalBase = nationalSelectItem != null ? nationalSelectItem.value : null;
    const dmaBase = dmaSelectItem != null ? dmaSelectItem.value : null;

    if (selectedAudience.compositeSource.length > 0) {
      selectedAudience.compositeSource.forEach(audience => {
        this.allAudiences.forEach(current => {
          if (current != null && current.audienceIdentifier === audience.id.toString()) {
            currentRows.push({
              selectedAudienceList: current,
              indexBase: current.selectedDataSet != null && current.selectedDataSet !== 'ALL' ?
                current.selectedDataSet !== 'nationalScore' && current.selectedDataSet !== 'dmaScore' ? current.selectedDataSet :
                  current.selectedDataSet === 'nationalScore' ? nationalBase : dmaBase : current.selectedDataSet === 'ALL' ? compositeBase : nationalBase,
              percent: audience.pct
            });
          }
        });
      });
    }

    this.compositeForm.patchValue({
      compositeAudienceId: selectedAudience.audienceIdentifier,
      compositeAudName: selectedAudience.audienceName,
    });

    this.editAudience$.next(selectedAudience);
    this.audienceRows.clear();
    currentRows.forEach(row => this.addRow(row));
    currentRows = [];
  }

}
