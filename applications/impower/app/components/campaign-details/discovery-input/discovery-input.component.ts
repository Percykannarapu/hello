import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { SelectItem } from 'primeng/primeng';
import { debounceTime, map } from 'rxjs/operators';
import { ValDiscoveryUIModel } from '../../../models/val-discovery.model';
import { ProjectCpmTypeCodes } from '../../../val-modules/targeting/targeting.enums';
import { ProjectTrackerUIModel, RadLookupUIModel } from '../../../services/app-discovery.service';

@Component({
  selector: 'val-discovery-input',
  templateUrl: './discovery-input.component.html',
  styleUrls: ['./discovery-input.component.css'],
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
  @Input('onlineAudienceExists')
  set onlineAudienceExists(val: boolean) {
    this.setPCROptionState(val);
    this.showAnalysisLevelError = val;
  }
  @Input() radSuggestions: RadLookupUIModel[];
  @Input() projectTrackerSuggestions: ProjectTrackerUIModel[];

  @Output() formChanged = new EventEmitter<ValDiscoveryUIModel>();
  @Output() radSearchRequest = new EventEmitter<string>();
  @Output() trackerSearchRequest = new EventEmitter<string>();

  discoveryForm: FormGroup;
  allAnalysisLevels: SelectItem[] = [];
  showAnalysisLevelError: boolean = false;
  allSeasons: SelectItem[];
  cpmTypes = ProjectCpmTypeCodes;

  constructor(private fb: FormBuilder) { }

  ngOnInit() : void {
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

    // Create the form fields, and populate default values & validations.
    // These fields need to be named the same as the ValDiscoveryUIModel class
    // to make for easy mapping/patching back and forth.
    this.discoveryForm = this.fb.group({
      projectId: { value: null, disabled: true },
      projectName: new FormControl('', { validators: Validators.required, updateOn: 'blur' }),
      selectedProjectTracker: new FormControl(null, { updateOn: 'blur' }),
      selectedRadLookup: null,
      selectedSeason: null,
      selectedAnalysisLevel: [null, Validators.required],
      includePob: true,
      includeValassis: true,
      includeAnne: true,
      includeSolo: true,
      dollarBudget: new FormControl(null, { updateOn: 'blur' }),
      circulationBudget: new FormControl(null, { updateOn: 'blur' }),
      cpmType: null,
      cpmBlended: new FormControl({ value: null, disabled: true }, { updateOn: 'blur' }),
      cpmValassis: new FormControl({ value: null, disabled: true }, { updateOn: 'blur' }),
      cpmAnne: new FormControl({ value: null, disabled: true }, { updateOn: 'blur' }),
      cpmSolo: new FormControl({ value: null, disabled: true }, { updateOn: 'blur' })
    });
  
    this.discoveryForm.valueChanges.pipe(
      debounceTime(250),
      map(formData => new ValDiscoveryUIModel(formData))
    ).subscribe(uiModel => this.onFormChanged(uiModel));
  }

  setPCROptionState(value: boolean) : void {
    const pcrOption = this.allAnalysisLevels.find(l => l.value === 'PCR');
    if (pcrOption != null) {
     pcrOption.disabled = value;
    }
    this.allAnalysisLevels = [ ...this.allAnalysisLevels ];
  }

  private setControlStates(currentForm: ValDiscoveryUIModel) : void {
    const disable = (name: string) => this.discoveryForm.controls[name].disable({ emitEvent: false });
    const enable = (name: string) => this.discoveryForm.controls[name].enable({ emitEvent: false });
    switch (currentForm.cpmType) {
      case ProjectCpmTypeCodes.Blended:
        disable('cpmValassis');
        disable('cpmAnne');
        disable('cpmSolo');
        enable('cpmBlended');
        break;
      case ProjectCpmTypeCodes.OwnerGroup:
        enable('cpmValassis');
        enable('cpmAnne');
        enable('cpmSolo');
        disable('cpmBlended');
        break;
      default:
        disable('cpmValassis');
        disable('cpmAnne');
        disable('cpmSolo');
        disable('cpmBlended');
    }
    this.setAnalysisLevelDropDown(currentForm.selectedAnalysisLevel);
  }

  private onFormChanged(currentData: ValDiscoveryUIModel) : void {
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
}
