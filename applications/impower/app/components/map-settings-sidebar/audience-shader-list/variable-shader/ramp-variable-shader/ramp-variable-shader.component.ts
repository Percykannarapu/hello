import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ColorPalette, RampShadingDefinition } from '@val/esri';
import { VariableComponentBase } from '../variable-component.base';

@Component({
  selector: 'val-ramp-variable-shader',
  templateUrl: './ramp-variable-shader.component.html'
})
export class RampVariableShaderComponent extends VariableComponentBase<RampShadingDefinition> {

  constructor() { super(); }

  protected setupForm() : void {
    this.parentForm.addControl('theme', new FormControl(this.definition.theme || ColorPalette.EsriPurple, { updateOn: 'change' }));
    this.parentForm.addControl('reverseTheme', new FormControl(this.definition.reverseTheme || false, { updateOn: 'change' }));
  }

  protected tearDownForm() : void {
    this.parentForm.removeControl('theme');
    this.parentForm.removeControl('reverseTheme');
  }

}
