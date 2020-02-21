import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ColorPalette, UniqueShadingDefinition } from '@val/esri';
import { VariableBaseComponent } from '../variable-base.component';

@Component({
  selector: 'val-unique-variable-shader',
  templateUrl: './unique-variable-shader.component.html'
})
export class UniqueVariableShaderComponent extends VariableBaseComponent<UniqueShadingDefinition> {

  constructor() { super(); }

  protected setupForm() : void {
    this.parentForm.addControl('theme', new FormControl(this.definition.theme || ColorPalette.CpqMaps));
    this.parentForm.addControl('reverseTheme', new FormControl(this.definition.reverseTheme || false));
  }

}
