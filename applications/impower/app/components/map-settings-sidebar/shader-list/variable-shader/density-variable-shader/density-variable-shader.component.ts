import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { rgbToHex } from '@val/common';
import { DotDensityShadingDefinition } from '@val/esri';
import { VariableBaseComponent } from '../variable-base.component';

interface Rgb { r: number; g: number; b: number; }

function esriToRgb(esriColor: [number, number, number, number]) : Rgb {
  return { r: esriColor[0], g: esriColor[1], b: esriColor[2] };
}

function rgbToEsri(rgbColor: Rgb) : [number, number, number, number] {
  return [ rgbColor.r, rgbColor.g, rgbColor.b, 1.0 ];
}

@Component({
  selector: 'val-density-variable-shader',
  templateUrl: './density-variable-shader.component.html',
  styleUrls: ['./density-variable-shader.component.scss']
})
export class DensityVariableShaderComponent extends VariableBaseComponent<DotDensityShadingDefinition> {

  get selectedDotColor() : Rgb {
    return esriToRgb(this.parentForm.get('dotColor').value || [0, 0, 64, 1]);
  }
  set selectedDotColor(value: Rgb) {
    this.parentForm.get('dotColor').setValue(rgbToEsri(value));
  }
  get currentDotColorInHex() : string {
    const dotDefinition = this.definition as DotDensityShadingDefinition;
    return rgbToHex(dotDefinition.dotColor);
  }

  constructor() { super(); }

  protected setupForm() : void {
    this.parentForm.addControl('arcadeExpression', new FormControl(this.definition.arcadeExpression));
    this.parentForm.addControl('dotColor', new FormControl(this.definition.dotColor || [0, 0, 64, 1]));
    this.parentForm.addControl('dotValue', new FormControl(this.definition.dotValue || 100, { updateOn: 'blur', validators: [Validators.required, Validators.min(1)] }));
    this.parentForm.addControl('legendUnits', new FormControl(this.definition.legendUnits, { updateOn: 'blur', validators: [Validators.required] }));
  }

}
