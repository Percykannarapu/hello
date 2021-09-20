import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { SelectItem } from 'primeng/api';
import { debounceTime, map } from 'rxjs/operators';
import { ProjectCpmTypeCodes } from '../../../../worker-shared/data-model/impower.data-model.enums';
import { ValDiscoveryUIModel } from '../../../models/val-discovery.model';
import { ProjectTrackerUIModel, RadLookupUIModel } from '../../../services/app-discovery.service';
import { Store } from '@ngrx/store';
import { FullAppState } from 'app/state/app.interfaces';
import { UserService } from 'app/services/user.service';

@Component({
  selector: 'val-discovery-input',
  templateUrl: './discovery-input.component.html',
  styleUrls: ['./discovery-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiscoveryInputComponent implements OnInit {

  @Input('storeData')
  set data(val: ValDiscoveryUIModel) {
    if (val) {
      this.discoveryForm.patchValue(val, { emitEvent: false });
      this.setControlStates(val);
    }
  }

  @ViewChild('ElementRef', {static: true})
  form: ElementRef;

  @Input() radSuggestions: RadLookupUIModel[];
  @Input() projectTrackerSuggestions: ProjectTrackerUIModel[];

  @Output() formChanged = new EventEmitter<ValDiscoveryUIModel>();
  @Output() radSearchRequest = new EventEmitter<string>();
  @Output() trackerSearchRequest = new EventEmitter<string>();

  discoveryForm: FormGroup;
  allAnalysisLevels: SelectItem[] = [];
  limitedAnalysisLevels: SelectItem[] = [];
  allSeasons: SelectItem[];
  allCPMTypes: SelectItem[];
  hasGrant: boolean = false;

  cpmTypes = ProjectCpmTypeCodes;

  constructor(private fb: FormBuilder,
              private store$: Store<FullAppState>,
              private cd: ChangeDetectorRef,
              private userService: UserService) { }

  ngOnInit() : void {
    this.allAnalysisLevels = [
      {label: 'Digital ATZ', value: 'Digital ATZ'},
      {label: 'ATZ', value: 'ATZ'},
      {label: 'ZIP', value: 'ZIP'},
      {label: 'PCR', value: 'PCR'}
    ];
    this.limitedAnalysisLevels = [
      {label: 'ATZ', value: 'ATZ'},
      {label: 'ZIP', value: 'ZIP'},
      {label: 'PCR', value: 'PCR'}
    ];
    this.allSeasons = [
      {label: 'Summer', value: 'S'},
      {label: 'Winter', value: 'W'}
    ];
    this.allCPMTypes = [
      { label: 'Blended', value: ProjectCpmTypeCodes.Blended },
      { label: 'By Owner Group', value: ProjectCpmTypeCodes.OwnerGroup },
    ];

    this.hasGrant = this.userService.userHasGrants(['IMPOWER_ANALYSIS_DATAZ']);
    // Create the form fields, and populate default values & validations.
    // These fields need to be named the same as the ValDiscoveryUIModel class
    // to make for easy mapping/patching back and forth.
    this.discoveryForm = this.fb.group({
      projectId: { value: null, disabled: true },
      projectName: new FormControl('', { validators: Validators.required, updateOn: 'blur' }),
      selectedProjectTracker: null,
      selectedRadLookup: null,
      selectedSeason: null,
      selectedAnalysisLevel: [null, Validators.required],
      forceHomeGeos: true,
      includePob: true,
      includeValassis: true,
      includeAnne: true,
      includeSolo: true,
      dollarBudget: new FormControl(null, { updateOn: 'blur' }),
      circulationBudget: new FormControl(null, { updateOn: 'blur' }),
      cpmType: null,
      cpmBlended: new FormControl({ value: null }, { updateOn: 'blur' }),
      cpmValassis: new FormControl({ value: null }, { updateOn: 'blur' }),
      cpmAnne: new FormControl({ value: null }, { updateOn: 'blur' }),
      cpmSolo: new FormControl({ value: null }, { updateOn: 'blur' })
    });

    this.discoveryForm.valueChanges.pipe(
      debounceTime(250),
      map(formData => new ValDiscoveryUIModel(formData))
    ).subscribe(uiModel => this.onFormChanged(uiModel));
  }

  private setControlStates(currentForm: ValDiscoveryUIModel) : void {
    this.setAnalysisLevelDropDown(currentForm.selectedAnalysisLevel);
  }

  private onFormChanged(currentData: ValDiscoveryUIModel) : void {
    // this.store$.dispatch(new HideLabels());
    switch (currentData.cpmType) {
      case ProjectCpmTypeCodes.Blended:
        currentData.cpmValassis = null;
        currentData.cpmAnne = null;
        currentData.cpmSolo = null;
        break;
      case ProjectCpmTypeCodes.OwnerGroup:
        currentData.cpmBlended = null;
        break;
    }
    this.formChanged.emit(currentData);
  }

  private setAnalysisLevelDropDown(analysisLevel: string) : void {
    if (analysisLevel == null || analysisLevel.trim().length === 0) {
      this.discoveryForm.controls['selectedAnalysisLevel'].reset(null, { emitEvent: false });
    } else {
      this.discoveryForm.controls['selectedAnalysisLevel'].setValue(analysisLevel, { emitEvent: false });
    }
  }

  doOnSelect(){
    this.projectTrackerSuggestions = [];
    this.cd.markForCheck();
  }

 onFormClose(){
   this.form.nativeElement.blur();
 }
}
