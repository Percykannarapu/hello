import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ClassBreakShadingDefinition, ColorPalette, DynamicAllocationTypes } from '@val/esri';
import { SelectItem } from 'primeng/api';
import { VariableBaseComponent } from '../variable-base.component';

@Component({
  selector: 'val-breaks-variable-shader',
  templateUrl: './breaks-variable-shader.component.html',
  styleUrls: ['./breaks-variable-shader.component.scss']
})
export class BreaksVariableShaderComponent extends VariableBaseComponent<ClassBreakShadingDefinition> {

  breakTypes: SelectItem[];
  selectedBreakType: string;

  constructor() {
    super();
    this.breakTypes = [
      { label: 'Set Value Ranges', value: 'Set Value Ranges' },
      { label: 'Equal Interval Ranges', value: 'Equal Interval Ranges' },
      { label: 'Equal Class Counts', value: 'Equal Class Counts' }
    ];
  }

  // tslint:disable-next-line:use-lifecycle-interface
  public ngOnInit() {
    super.ngOnInit();
    if (this.definition.dynamicallyAllocate === true) {
      if (this.definition.dynamicAllocationType === DynamicAllocationTypes.Interval) {
        this.selectedBreakType = this.breakTypes[1].value;
      } else {
        this.selectedBreakType = this.breakTypes[2].value;
      }
    } else {
      if (this.definition.dynamicallyAllocate === false) {
        this.selectedBreakType = this.breakTypes[0].value;
      } else {
        this.selectedBreakType = null;
      }
    }
  }

  protected setupForm() : void {
    this.parentForm.addControl('theme', new FormControl(this.definition.theme || ColorPalette.Cpqmaps));
    this.parentForm.addControl('reverseTheme', new FormControl(this.definition.reverseTheme || false));
    this.parentForm.addControl('dynamicallyAllocate', new FormControl(this.definition.dynamicallyAllocate, [Validators.required]));
    this.parentForm.addControl('dynamicAllocationType', new FormControl(this.definition.dynamicAllocationType));
    this.parentForm.addControl('dynamicAllocationSlots', new FormControl(this.definition.dynamicAllocationSlots || 4));
  }

  public breakTypeChanged({ value }) {
    switch (value) {
      case this.breakTypes[0].value:
        this.parentForm.get('dynamicallyAllocate').setValue(false);
        this.parentForm.get('dynamicAllocationType').setValue(null);
        this.parentForm.get('dynamicAllocationSlots').clearValidators();
        break;
      case this.breakTypes[1].value:
        this.parentForm.get('dynamicallyAllocate').setValue(true);
        this.parentForm.get('dynamicAllocationType').setValue(DynamicAllocationTypes.Interval);
        this.parentForm.get('dynamicAllocationSlots').setValidators([Validators.required, Validators.min(2), Validators.max(20)]);
        break;
      case this.breakTypes[2].value:
        this.parentForm.get('dynamicallyAllocate').setValue(true);
        this.parentForm.get('dynamicAllocationType').setValue(DynamicAllocationTypes.ClassCount);
        this.parentForm.get('dynamicAllocationSlots').setValidators([Validators.required, Validators.min(2), Validators.max(20)]);
        break;
    }
  }
}
