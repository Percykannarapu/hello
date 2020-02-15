import { Component, Input } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { FormConfig } from '@val/common';
import { UniqueShadingDefinition } from '@val/esri';
import { SelectItem } from 'primeng/api';
import { GfpSiteOwnerForm } from '../../../../state/forms/forms.interfaces';
import { ShaderBaseComponent } from '../shader-base.component';

@Component({
  selector: 'val-owner-site-shader',
  templateUrl: './owner-site-shader.component.html',
  styleUrls: ['./owner-site-shader.component.scss']
})
export class OwnerSiteShaderComponent extends ShaderBaseComponent<UniqueShadingDefinition> {

  @Input() labelChoices: SelectItem[];

  get currentLegendIdentifier() : string {
    const foundItem = (this.labelChoices || []).filter(l => l.value === this.definition.secondaryDataKey)[0];
    return foundItem == null ? '' : foundItem.label;
  }

  constructor(private fb: FormBuilder) { super(); }

  protected setupForm() : void {
    const formSetup: FormConfig<GfpSiteOwnerForm> = {
      layerName: [this.definition.layerName, Validators.required],
      secondaryDataKey: this.definition.secondaryDataKey,
      opacity: new FormControl(this.definition.opacity, [Validators.required, Validators.min(0), Validators.max(1)]),
    };
    this.shaderForm = this.fb.group(formSetup, { updateOn: 'blur' });
  }
}
