import { Component, OnInit, ViewEncapsulation, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FormBuilder, Validators, FormGroup, FormArray, FormControl } from '@angular/forms';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { SelectItem, ConfirmationService } from 'primeng/api';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { filter, map, tap, takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { LocalAppState } from 'app/state/app.interfaces';
import { getAllAudiences } from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { ImpProjectVarService } from 'app/val-modules/targeting/services/ImpProjectVar.service';
import { TargetAudienceService } from 'app/services/target-audience.service';
import { mapArray } from '@val/common';
import { FieldContentTypeCodes } from 'app/impower-datastore/state/models/impower-model.enums';
import { VarSpecs } from 'app/services/target-audience-unified.service';
import { RemoveVar } from 'app/impower-datastore/state/transient/geo-vars/geo-vars.actions';
import { CreateAudienceUsageMetric } from 'app/state/usage/targeting-usage.actions';
import { AppStateService } from 'app/services/app-state.service';
import { ValassisValidators } from 'app/models/valassis-validators';

@Component({
  selector: 'val-composite-audience',
  templateUrl: './composite-audience.component.html',
  styleUrls: ['./composite-audience.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CompositeAudienceComponent implements OnInit, OnDestroy {

  compositeForm: FormGroup;
  allIndexValues: SelectItem[];
  filteredAudiences$: Observable<SelectItem[]>;
  hasAudienceSelections: boolean = false;
  destroyed$ = new Subject<void>();
  selectedVars: SelectItem[];
  compositeAudiences$: Observable<Audience[]>;
  varNames: Map<string, string> = new Map<string, string>([]);
  audiences$: Observable<Audience[]>;
  isDuplicateName: boolean = false;
  currentAudience: any;
  allAudiences: Audience[];
  indexTypes: Set<string> = new Set<string>([]);


  get audienceRows() : FormArray { return this.compositeForm.get('audienceRows') as FormArray; }
  get compositeAudienceId() { return this.compositeForm.get('compositeAudienceId'); }
  get compositeAudName() { return this.compositeForm.get('compositeAudName'); }
  get selectedAudienceList() : FormGroup[] {
    return this.audienceRows.controls as FormGroup[];
  }
  get indexBase() : FormGroup[] {
    return this.audienceRows.controls as FormGroup[];
  }


  constructor(private fb: FormBuilder,
              private appStateService: AppStateService,
              private store$: Store<LocalAppState>,
              private impVarService: ImpProjectVarService,
              private varService: TargetAudienceService,
              private cd: ChangeDetectorRef,
              private confirmationService: ConfirmationService,
              ) { }

  ngOnInit() {
    this.filteredAudiences$ = this.store$.select(fromAudienceSelectors.allAudiences).pipe(
      filter(audiences => audiences != null && audiences.length > 0),
      map(aud => {
        this.allAudiences = aud;
        return aud.filter(a => (a.audienceSourceType === 'Offline' || a.audienceSourceType === 'Online' || a.audienceSourceType === 'Combined' ||
          a.audienceSourceType === 'Combined/Converted' || a.audienceSourceType === 'Converted' || a.audienceSourceType === 'Composite') &&
          (a.fieldconte === 'PERCENT' || a.fieldconte === 'INDEX' || a.fieldconte === 'MEDIAN' || a.fieldconte === 'COUNT'));
      }),
      tap(audiences => this.hasAudienceSelections = audiences.length > 0),
      map(audList => audList.sort((a, b) => a.audienceName.localeCompare(b.audienceName))),
      mapArray(audience => ({ label: audience.audienceName, value: audience })),
    );
    this.compositeAudiences$ = this.store$.select(getAllAudiences).pipe(
      filter(allAudiences => allAudiences != null),
      map(audiences => audiences.filter(aud => aud.audienceSourceType === 'Composite')),
    );

    this.compositeAudiences$.subscribe(a => a.forEach(aud => this.varNames.set(aud.audienceName.toLowerCase(), aud.audienceIdentifier)));

    this.allIndexValues = [
      { label: 'DMA', value: 'DMA' },
      { label: 'National', value: 'NAT' },
    ];

    this.compositeForm = this.fb.group({
      compositeAudienceId: new FormControl(''),
      compositeAudName: new FormControl('', { validators: [Validators.required], updateOn: 'blur' }),
      audienceRows: new FormArray([
        new FormGroup({
          selectedAudienceList: new FormControl('', { validators: [Validators.required] }),
          indexBase: new FormControl('', { validators: [Validators.required] }),
          percent: new FormControl('', { validators: [Validators.required, ValassisValidators.numeric, ValassisValidators.greaterThan(0), ValassisValidators.lessThan(100)] })
        }),
        new FormGroup({
          selectedAudienceList: new FormControl('', { validators: [Validators.required] }),
          indexBase: new FormControl('', { validators: [Validators.required] }),
          percent: new FormControl('', { validators: [Validators.required, ValassisValidators.numeric, ValassisValidators.greaterThan(0), ValassisValidators.lessThan(100)] })
        })
      ])
    });

    this.compositeForm.get('compositeAudName').valueChanges.pipe(takeUntil(this.destroyed$)).subscribe(value => {
      const audienceName = this.compositeForm.get('compositeAudName');
      const currentName = audienceName.value != null ? audienceName.value.trim() : '';
      this.isDuplicateName = false;
      if (this.varNames.has(currentName.toLowerCase()) && this.varNames.get(currentName.toLowerCase()) !== audienceName.parent.controls['compositeAudienceId'].value)
        this.isDuplicateName = true;
    });

    this.audienceRows.controls.forEach((row: FormGroup) => {
      row.get('selectedAudienceList').valueChanges.pipe(takeUntil(this.destroyed$)).subscribe(val => {
        if (val != null && val.fieldconte != null && val.audienceSourceType != null) {
          if (val.fieldconte === 'INDEX' && (val.audienceSourceType === 'Offline' || val.audienceSourceType === 'Online')) {
            row.patchValue({ indexBase: this.allIndexValues.find(a => a.label === 'National').value });
          }
          if (val.audienceSourceType === 'Converted' || val.audienceSourceType === 'Combined/Converted') {
            if (val.selectedDataSet === 'DMA'){
              row.get('indexBase').enable();
              row.patchValue({ indexBase: this.allIndexValues.find(a => a.label === val.selectedDataSet).value });
            }
            if (val.selectedDataSet === 'NAT'){
              row.get('indexBase').enable();
              row.patchValue({ indexBase: this.allIndexValues.find(a => a.label === 'National').value });
            }
          } else if (val.audienceSourceType === 'Composite') {
              row.get('indexBase').clearValidators();
              row.get('indexBase').disable();
          } else {
              row.get('indexBase').enable();
          }
        }
      });
    });
    this.appStateService.clearUI$.subscribe(() => {
      this.compositeForm.reset();
    });
  }

  ngOnDestroy() : void {
    this.destroyed$.next();
  }

  onSubmit(audienceFields: any) {
    const compositeAudIds: VarSpecs[] = [];
    const selectedVariableNames: string[] = [];
    if (audienceFields.audienceRows.length > 0) {
      audienceFields.audienceRows.forEach(selectedRow => {
        this.indexTypes.add(selectedRow.indexBase);
        selectedVariableNames.push(selectedRow.selectedAudienceList.audienceName + '-' + selectedRow.indexBase + '-' + selectedRow.percent);
        compositeAudIds.push({ id: Number(selectedRow.selectedAudienceList.audienceIdentifier), pct: Number(selectedRow.percent), base: selectedRow.indexBase });
      });
    }
    if (audienceFields.compositeAudienceId == null || audienceFields.compositeAudienceId.length === 0) {
      const fkId = this.impVarService.getNextStoreId();
      const newAudience: Audience = {
        audienceIdentifier: fkId.toString(),
        audienceName: audienceFields.compositeAudName,
        showOnMap: false,
        showOnGrid: false,
        exportInGeoFootprint: true,
        exportNationally: false,
        allowNationalExport: false,
        selectedDataSet: this.indexTypes.size == 2 ? 'DMA/NAT' : Array.from(this.indexTypes)[0],
        audienceSourceName: 'TDA',
        audienceSourceType: 'Composite',
        fieldconte: FieldContentTypeCodes.Index,
        requiresGeoPreCaching: true,
        seq: fkId,
        isComposite: true,
        combinedAudiences: [],
        combinedVariableNames: selectedVariableNames.join('~'),
        compositeSource: compositeAudIds,
      };
      this.varService.addAudience(newAudience);
    }
    else {
      this.currentAudience = this.allAudiences.filter(a => a.audienceIdentifier === audienceFields.compositeAudienceId);
      const editedAudience: Audience = {
        audienceIdentifier: audienceFields.compositeAudienceId,
        audienceName: audienceFields.compositeAudName,
        showOnMap: this.currentAudience[0].showOnMap,
        showOnGrid: this.currentAudience[0].showOnGrid,
        exportInGeoFootprint: this.currentAudience[0].exportInGeoFootprint,
        exportNationally: this.currentAudience[0].exportNationally,
        allowNationalExport: this.currentAudience[0].allowNationalExport,
        selectedDataSet: this.indexTypes.size == 2 ? 'ALL' : Array.from(this.indexTypes)[0],
        audienceSourceName: this.currentAudience[0].audienceSourceName,
        audienceSourceType: this.currentAudience[0].audienceSourceType,
        fieldconte: this.currentAudience[0].fieldconte,
        requiresGeoPreCaching: this.currentAudience[0].requiresGeoPreCaching,
        seq: this.currentAudience[0].seq,
        isComposite: this.currentAudience[0].isComposite,
        combinedAudiences: this.currentAudience[0].combinedAudiences,
        combinedVariableNames: selectedVariableNames.join('~'),
        compositeSource: compositeAudIds,
      };
      this.varService.updateProjectVars(editedAudience);
    }
    this.currentAudience = '';
    this.indexTypes.clear();
    this.compositeForm.reset();
  }

  addRow() {
    const audienceArray = this.compositeForm.controls.audienceRows as FormArray;
    const arraylen = audienceArray.length;
    const newAudienceGroup: FormGroup = this.fb.group({
      selectedAudienceList: '',
      indexBase: '',
      percent: ''
    });
    audienceArray.insert(arraylen + 1, newAudienceGroup);
  }

  onRemove(i: number) {
    const audienceArray = this.compositeForm.controls.audienceRows as FormArray;
    audienceArray.removeAt(i);
  }

  onDelete(audience: Audience) {
    console.log('inside delete');
    const message = 'Are you sure you want to delete the following composite variable? <br/> <br/>' +
      `${audience.audienceName}`;
    this.confirmationService.confirm({
      message: message,
      header: 'Delete Composite Variable',
      icon: 'ui-icon-delete',
      accept: () => {
        this.varNames.delete(audience.audienceName);
        this.varService.addDeletedAudience(audience.audienceSourceType, audience.audienceSourceName, audience.audienceIdentifier);
        this.varService.removeAudience(audience.audienceSourceType, audience.audienceSourceName, audience.audienceIdentifier);
        this.store$.dispatch(new RemoveVar({ varPk: audience.audienceIdentifier }));

        let metricText = null;
        metricText = `${audience.audienceIdentifier}~${audience.audienceName}~${audience.audienceSourceName}~${this.appStateService.analysisLevel$.getValue()}`;
        this.store$.dispatch(new CreateAudienceUsageMetric('composite audience', 'delete', metricText));
        this.compositeForm.reset();
      },
      reject: () => { }
    });
  }

  resetForm() {
    this.compositeForm.reset();
  }

  onEdit(selectedAudience: Audience) {
    const currentSelections: Audience[] = [];
    let currentRows: any = [];
    if (selectedAudience.compositeSource.length > 0) {
      selectedAudience.compositeSource.forEach(audience => {
        this.allAudiences.forEach(current => {
          if (current != null && current.audienceIdentifier === audience.id.toString())
            currentSelections.push(current);
          currentRows.push({
            selectedAudienceList: current,
            indexBase: selectedAudience.selectedDataSet,
            percent: audience.pct
          });
        });
      });
    }
    this.compositeForm.patchValue({
      compositeAudienceId: selectedAudience.audienceIdentifier,
      compositeAudName: selectedAudience.audienceName,
      audienceRows: currentRows,
    });
    currentRows = [];

  }

}
