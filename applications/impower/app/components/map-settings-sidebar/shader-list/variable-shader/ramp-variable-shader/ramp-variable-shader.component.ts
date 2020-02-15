import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ColorPalette, RampShadingDefinition } from '@val/esri';
import { VariableBaseComponent } from '../variable-base.component';

@Component({
  selector: 'val-ramp-variable-shader',
  templateUrl: './ramp-variable-shader.component.html'
})
export class RampVariableShaderComponent extends VariableBaseComponent<RampShadingDefinition> {

  constructor() { super(); }

  protected setupForm() : void {
    this.parentForm.addControl('theme', new FormControl(this.definition.theme || ColorPalette.EsriPurple));
    this.parentForm.addControl('reverseTheme', new FormControl(this.definition.reverseTheme || false));
  }

}
