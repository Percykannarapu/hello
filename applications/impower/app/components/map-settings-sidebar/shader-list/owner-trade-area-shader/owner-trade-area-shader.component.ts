import { Component } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { FormConfig } from '@val/common';
import { UniqueShadingDefinition } from '@val/esri';
import { GfpForm } from '../../../../state/forms/forms.interfaces';
import { ShaderBaseComponent } from '../shader-base.component';

@Component({
  selector: 'val-owner-trade-area-shader',
  templateUrl: './owner-trade-area-shader.component.html',
  styleUrls: ['./owner-trade-area-shader.component.scss']
})
export class OwnerTradeAreaShaderComponent extends ShaderBaseComponent<UniqueShadingDefinition> {

  constructor(private fb: FormBuilder) { super(); }

  protected setupForm() : void {
    const formSetup: FormConfig<GfpForm> = {
      layerName: [this.definition.layerName, Validators.required],
      opacity: new FormControl(this.definition.opacity, [Validators.required, Validators.min(0), Validators.max(1)]),
    };
    this.shaderForm = this.fb.group(formSetup, { updateOn: 'blur' });
  }
}
