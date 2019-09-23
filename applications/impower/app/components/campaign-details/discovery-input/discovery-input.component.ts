import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { SelectItem } from 'primeng/api';
import { debounceTime, map } from 'rxjs/operators';
import { ValDiscoveryUIModel } from '../../../models/val-discovery.model';
import { ProjectCpmTypeCodes } from '../../../val-modules/targeting/targeting.enums';
import { ProjectTrackerUIModel, RadLookupUIModel } from '../../../services/app-discovery.service';
import { AppStateService } from 'app/services/app-state.service';

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
  allSeasons: SelectItem[];
  allCPMTypes: SelectItem[];

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
    this.allCPMTypes = [
      { label: 'Blended', value: ProjectCpmTypeCodes.Blended },
      { label: 'By Owner Group', value: ProjectCpmTypeCodes.OwnerGroup },
    ];

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

 onFormClose(){
   this.form.nativeElement.blur();
 }
}
