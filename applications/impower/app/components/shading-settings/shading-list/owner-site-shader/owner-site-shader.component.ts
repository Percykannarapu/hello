import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { FormConfig } from '@val/common';
import { UniqueShadingDefinition } from '@val/esri';
import { SelectItem } from 'primeng/api';
import { GfpSiteOwnerForm } from '../../../../state/forms/forms.interfaces';
import { UIShadingDefinition } from '../../shading-ui-helpers';

@Component({
  selector: 'val-owner-site-shader',
  templateUrl: './owner-site-shader.component.html',
  styleUrls: ['./owner-site-shader.component.scss']
})
export class OwnerSiteShaderComponent implements OnInit {

  @Input() definition: UIShadingDefinition;
  @Input() labelChoices: SelectItem[];

  @Output() applyShader: EventEmitter<UIShadingDefinition> = new EventEmitter<UIShadingDefinition>();
  @Output() editShader: EventEmitter<UIShadingDefinition> = new EventEmitter<UIShadingDefinition>();
  @Output() removeShader: EventEmitter<UIShadingDefinition> = new EventEmitter<UIShadingDefinition>();
  shaderForm: FormGroup;

  get currentLegendIdentifier() : string {
    const extendedDefinition = this.definition as UniqueShadingDefinition;
    const foundItem = (this.labelChoices || []).filter(l => l.value === extendedDefinition.secondaryDataKey)[0];
    return foundItem == null ? '' : foundItem.label;
  }

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    const extendedDefinition = this.definition as UniqueShadingDefinition;
    const formSetup: FormConfig<GfpSiteOwnerForm> = {
      layerName: [this.definition.layerName, Validators.required],
      secondaryDataKey: extendedDefinition.secondaryDataKey,
      opacity: new FormControl(this.definition.opacity, [Validators.required, Validators.min(0), Validators.max(1)]),
    };
    this.shaderForm = this.fb.group(formSetup, { updateOn: 'blur' });
  }

  edit(def: UIShadingDefinition) : void {
    this.definition = { ...def, isEditing: true };
    this.editShader.emit({ ...this.shaderForm.value, id: this.definition.id });
  }

  apply() : void {
    this.shaderForm.updateValueAndValidity();
    if (this.shaderForm.status === 'VALID') {
      const values: GfpSiteOwnerForm = this.shaderForm.value;
      Object.assign(this.definition, values);
      this.applyShader.emit(this.definition);
    }
  }

  cancel() : void {
    if (this.definition.isNew) {
      this.removeShader.emit(this.definition);
    } else {
      this.definition = { ...this.definition, isEditing: false };
      this.shaderForm.reset(this.definition);
    }
  }
}
