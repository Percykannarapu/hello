import { Component } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { FormConfig } from '@val/common';
import { ColorPalette, UniqueShadingDefinition } from '@val/esri';
import { GfpOwnerForm } from '../../../../state/forms/forms.interfaces';
import { ShaderComponentBase } from '../shader-component.base';

@Component({
  selector: 'val-owner-trade-area-shader',
  templateUrl: './owner-trade-area-shader.component.html',
  styleUrls: ['./owner-trade-area-shader.component.scss']
})
export class OwnerTradeAreaShaderComponent extends ShaderComponentBase<UniqueShadingDefinition> {

  constructor(private fb: FormBuilder) { super(); }

  protected setupForm() : void {
    const formSetup: FormConfig<GfpOwnerForm> = {
      layerName: [this.definition.layerName, Validators.required],
      opacity: new FormControl(this.definition.opacity, [Validators.required, Validators.min(0), Validators.max(1)]),
      theme: new FormControl(this.definition.theme || ColorPalette.CpqMaps, { updateOn: 'change' }),
      reverseTheme: new FormControl(this.definition.reverseTheme || false, { updateOn: 'change' })
    };
    this.shaderForm = this.fb.group(formSetup, { updateOn: 'blur' });
  }
}
