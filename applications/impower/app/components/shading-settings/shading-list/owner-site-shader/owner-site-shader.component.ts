import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { FormConfig } from '@val/common';
import { GfpForm } from '../../../../state/forms/forms.interfaces';
import { UIShadingDefinition } from '../../shading-ui-helpers';

@Component({
  selector: 'val-owner-site-shader',
  templateUrl: './owner-site-shader.component.html',
  styleUrls: ['./owner-site-shader.component.scss']
})
export class OwnerSiteShaderComponent implements OnInit {

  @Input() definition: UIShadingDefinition;

  @Output() applyShader: EventEmitter<UIShadingDefinition> = new EventEmitter<UIShadingDefinition>();
  @Output() editShader: EventEmitter<UIShadingDefinition> = new EventEmitter<UIShadingDefinition>();
  shaderForm: FormGroup;

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    const formSetup: FormConfig<GfpForm> = {
      layerName: [this.definition.layerName, Validators.required],
      opacity: new FormControl(this.definition.opacity, [Validators.required, Validators.min(0), Validators.max(1)]),
    };
    this.shaderForm = this.fb.group(formSetup, { updateOn: 'blur' });
  }

  hasErrors(controlKey: string) : boolean {
    const control = this.shaderForm.get(controlKey);
    return (control.dirty || control.touched) && (control.errors != null);
  }

  edit(def: UIShadingDefinition) : void {
    this.definition = { ...def, isEditing: true };
    this.editShader.emit(this.shaderForm.value);
  }

  apply() : void {
    this.shaderForm.updateValueAndValidity();
    if (this.shaderForm.errors == null) {
      const values: GfpForm = this.shaderForm.value;
      Object.assign(this.definition, values);
      this.applyShader.emit(this.definition);
    }
  }
}
