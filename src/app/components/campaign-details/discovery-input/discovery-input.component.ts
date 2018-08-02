import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SelectItem } from 'primeng/primeng';
import { debounceTime, filter, map } from 'rxjs/operators';
import { ValDiscoveryUIModel } from '../../../models/val-discovery.model';
import { ProjectTrackerData } from '../../../services/app-discovery.service';
import { ImpRadLookup } from '../../../val-modules/targeting/models/ImpRadLookup';
import { ProjectCpmTypeCodes } from '../../../val-modules/targeting/targeting.enums';

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
      this.discoveryForm.patchValue(val);
      this.setControlStates(val);
      this.discoveryForm.markAsPristine();
    }
  }
  @Input() radSuggestions: ImpRadLookup[];
  @Input() projectTrackerSuggestions: ProjectTrackerData[];

  @Output() formChanged = new EventEmitter<ValDiscoveryUIModel>();
  @Output() refreshTrackerData = new EventEmitter();
  @Output() radSearchRequest = new EventEmitter<string>();
  @Output() trackerSearchRequest = new EventEmitter<string>();

  discoveryForm: FormGroup;
  allAnalysisLevels: SelectItem[];
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
      projectName: ['', Validators.required],
      selectedProjectTracker: null,
      selectedRadLookup: null,
      selectedSeason: null,
      selectedAnalysisLevel: ['', Validators.required],
      includePob: true,
      includeValassis: true,
      includeAnne: true,
      includeSolo: true,
      dollarBudget: null,
      circulationBudget: null,
      cpmType: null,
      cpmBlended: { value: null, disabled: true },
      cpmValassis: { value: null, disabled: true },
      cpmAnne: { value: null, disabled: true },
      cpmSolo: { value: null, disabled: true }
    });

    this.discoveryForm.valueChanges.pipe(
      debounceTime(500),
      filter(() => this.discoveryForm.dirty),
      map(formData => new ValDiscoveryUIModel(formData))
    ).subscribe(uiModel => this.onFormChanged(uiModel));
  }

  private setControlStates(currentForm: ValDiscoveryUIModel) : void {
    switch (currentForm.cpmType) {
      case ProjectCpmTypeCodes.Blended:
        this.discoveryForm.controls['cpmValassis'].disable();
        this.discoveryForm.controls['cpmAnne'].disable();
        this.discoveryForm.controls['cpmSolo'].disable();
        this.discoveryForm.controls['cpmBlended'].enable();
        break;
      case ProjectCpmTypeCodes.OwnerGroup:
        this.discoveryForm.controls['cpmValassis'].enable();
        this.discoveryForm.controls['cpmAnne'].enable();
        this.discoveryForm.controls['cpmSolo'].enable();
        this.discoveryForm.controls['cpmBlended'].disable();
        break;
      default:
        this.discoveryForm.controls['cpmValassis'].disable();
        this.discoveryForm.controls['cpmAnne'].disable();
        this.discoveryForm.controls['cpmSolo'].disable();
        this.discoveryForm.controls['cpmBlended'].disable();
    }
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
}

