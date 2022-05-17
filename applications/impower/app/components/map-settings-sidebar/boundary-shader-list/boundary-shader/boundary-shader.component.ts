import { Component, EventEmitter, Input, OnDestroy, Output, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { DeepPartial } from '@val/common';
import {
  applyBoundaryChanges,
  applyFillChanges,
  applyLabelChanges,
  BoundaryConfiguration,
  completeEsriFaces,
  LabelDefinition,
  RgbaTuple
} from '@val/esri';
import { SelectItem } from 'primeng/api';
import { Subject } from 'rxjs';
import { ValassisValidators } from '../../../../common/valassis-validators';

@Component({
  selector: 'val-boundary-shader',
  templateUrl: './boundary-shader.component.html',
  styleUrls: ['./boundary-shader.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class BoundaryShaderComponent implements OnDestroy {

  @Input() configuration: BoundaryConfiguration;
  @Input() defaultFontSize: number;
  @Input() defaultColor: RgbaTuple;
  @Output() applyConfiguration = new EventEmitter<BoundaryConfiguration>();

  defaultHalo: RgbaTuple = [255, 255, 255, 1];
  configForm: FormGroup;
  isEditing: boolean = false;
  fontFaces: SelectItem[];

  thickness: number = 2;

  protected destroyed$ = new Subject<void>();

  constructor(private fb: FormBuilder) {
    this.fontFaces = completeEsriFaces.map(f => ({ label: f, value: f }));
  }

  public ngOnDestroy() : void {
    this.destroyed$.next();
  }

  public edit() : void {
    this.setupForm();
    this.isEditing = true;
  }

  public cancel() : void {
    this.isEditing = false;
  }

  public apply(form: FormGroup) : void {
    if (form.valid) {
      const convertedForm = this.convertForm(form);
      const newDef = applyBoundaryChanges(this.configuration, convertedForm);
      this.applyConfiguration.emit(newDef);
    }
  }

  protected convertForm(form: FormGroup) : DeepPartial<BoundaryConfiguration> {
    const currentValues = form.value as DeepPartial<BoundaryConfiguration>;
    // update all the label settings to use the values the user selected in the UI
    if (this.configuration.hhcLabelDefinition != null) {
      currentValues.hhcLabelDefinition = applyLabelChanges(this.configuration.hhcLabelDefinition, currentValues.labelDefinition);
    }
    if (this.configuration.pobLabelDefinition != null) {
      currentValues.pobLabelDefinition = applyLabelChanges(this.configuration.pobLabelDefinition, currentValues.labelDefinition);
    }
    if (this.configuration.symbolDefinition.outlineWidth != currentValues.symbolDefinition.outlineWidth){
      currentValues.symbolDefinition = applyFillChanges(this.configuration.symbolDefinition, currentValues.symbolDefinition);
    }
    return currentValues;
  }

  protected setupForm() : void {
    const defaultLabelDefinition: Partial<LabelDefinition> = this.configuration.labelDefinition || {};
    const formSetup: any = {
      showCentroids: new FormControl(this.configuration.showCentroids),
      showLabels: new FormControl(this.configuration.showLabels),
      showHouseholdCounts: new FormControl(this.configuration.showHouseholdCounts),
      showPOBs: new FormControl(this.configuration.showPOBs),
      showPopups: new FormControl(this.configuration.showPopups),
      opacity: new FormControl(this.configuration.opacity, [Validators.required, Validators.min(0), Validators.max(1)]),

      symbolDefinition: this.fb.group({
        outlineWidth: new FormControl(this.configuration.symbolDefinition.outlineWidth),
      }),
      labelDefinition: this.fb.group({
        isBold: new FormControl(defaultLabelDefinition.isBold || false, { updateOn: 'change' }),
        isItalic: new FormControl(defaultLabelDefinition.isItalic || false, { updateOn: 'change' }),
        family: new FormControl(defaultLabelDefinition.family || 'Noto Sans', { updateOn: 'change', validators: [Validators.required] }),
        size: new FormControl(defaultLabelDefinition.size || this.defaultFontSize, [Validators.required, ValassisValidators.numeric, Validators.min(6), Validators.max(48)]),
        color: new FormControl(defaultLabelDefinition.color),
        haloColor: new FormControl(defaultLabelDefinition.haloColor),
        forceLabelsVisible: new FormControl(defaultLabelDefinition.forceLabelsVisible ?? false)
      })
    };
    this.configForm = this.fb.group(formSetup);
    this.thickness = this.configuration.symbolDefinition.outlineWidth;
  }

  onSlide(event: any){
    this.thickness =  event.value;
  }
}
