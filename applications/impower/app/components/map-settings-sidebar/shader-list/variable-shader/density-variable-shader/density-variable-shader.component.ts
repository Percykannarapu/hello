import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { DotDensityShadingDefinition } from '@val/esri';
import { VariableComponentBase } from '../variable-component.base';

@Component({
  selector: 'val-density-variable-shader',
  templateUrl: './density-variable-shader.component.html',
  styleUrls: ['./density-variable-shader.component.scss']
})
export class DensityVariableShaderComponent extends VariableComponentBase<DotDensityShadingDefinition> {

  constructor() { super(); }

  protected setupForm() : void {
    this.parentForm.addControl('arcadeExpression', new FormControl(this.definition.arcadeExpression));
    this.parentForm.addControl('dotColor', new FormControl(this.definition.dotColor || [0, 0, 64, 1]));
    this.parentForm.addControl('dotValue', new FormControl(this.definition.dotValue || 100, { updateOn: 'blur', validators: [Validators.required, Validators.min(1)] }));
    this.parentForm.addControl('legendUnits', new FormControl(this.definition.legendUnits, { updateOn: 'blur', validators: [Validators.required] }));
  }

  protected tearDownForm() : void {
    this.parentForm.removeControl('arcadeExpression');
    this.parentForm.removeControl('dotColor');
    this.parentForm.removeControl('dotValue');
    this.parentForm.removeControl('legendUnits');
  }
}
