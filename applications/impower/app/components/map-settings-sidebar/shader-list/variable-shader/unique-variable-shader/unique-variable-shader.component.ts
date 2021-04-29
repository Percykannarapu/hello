import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ColorPalette, UniqueShadingDefinition } from '@val/esri';
import { VariableComponentBase } from '../variable-component.base';

@Component({
  selector: 'val-unique-variable-shader',
  templateUrl: './unique-variable-shader.component.html'
})
export class UniqueVariableShaderComponent extends VariableComponentBase<UniqueShadingDefinition> {

  constructor() { super(); }

  protected setupForm() : void {
    this.parentForm.addControl('theme', new FormControl(this.definition.theme || ColorPalette.CpqMaps, { updateOn: 'change' }));
    this.parentForm.addControl('reverseTheme', new FormControl(this.definition.reverseTheme || false, { updateOn: 'change' }));
  }

  protected tearDownForm() : void {
    this.parentForm.removeControl('theme');
    this.parentForm.removeControl('reverseTheme');
  }
}
