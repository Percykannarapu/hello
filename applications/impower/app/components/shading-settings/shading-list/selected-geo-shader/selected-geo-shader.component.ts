import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { FormConfig } from '@val/common';
import { SelectItem } from 'primeng/api';
import { GfpSelectionForm } from '../../../../state/forms/forms.interfaces';
import { UIShadingDefinition } from '../../shading-ui-helpers';

@Component({
  selector: 'val-selected-geo-shader',
  templateUrl: './selected-geo-shader.component.html',
  styleUrls: ['./selected-geo-shader.component.scss']
})
export class SelectedGeoShaderComponent implements OnInit {

  @Input() definition: UIShadingDefinition;

  @Output() applyShader: EventEmitter<UIShadingDefinition> = new EventEmitter<UIShadingDefinition>();
  @Output() editShader: EventEmitter<UIShadingDefinition> = new EventEmitter<UIShadingDefinition>();
  shaderForm: FormGroup;

  shadingTypes: SelectItem[] = [];

  constructor(private fb: FormBuilder) {
    this.shadingTypes.push({label: 'Green Highlight', value: 'Green Highlight'});
    this.shadingTypes.push({label: 'Cross Hatching', value: 'Cross Hatching'});
  }

  ngOnInit() {
    const isHighlight = this.definition.defaultSymbolDefinition == null || this.definition.defaultSymbolDefinition.fillType === 'solid';
    const formSetup: FormConfig<GfpSelectionForm> = {
      layerName: [this.definition.layerName, Validators.required],
      opacity: new FormControl(this.definition.opacity, [Validators.required, Validators.min(0), Validators.max(1)]),
      shadingType: isHighlight ? 'Green Highlight' : 'Cross Hatching'
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
      const values: GfpSelectionForm = this.shaderForm.value;
      const isCrossHatched = values.shadingType === 'Cross Hatching';
      this.definition.defaultSymbolDefinition = {
        fillColor: isCrossHatched ? [0, 0, 0, 1] : [0, 255, 0, 1],
        fillType: isCrossHatched ? 'backward-diagonal' : 'solid',
      };
      delete values.shadingType;
      Object.assign(this.definition, values);
      this.applyShader.emit(this.definition);
    }
  }

  styleChanged(newValue: string) : void {
    switch (newValue) {
      case 'Green Highlight':
        this.shaderForm.get('opacity').setValue(0.25);
        break;
      case 'Cross Hatching':
        this.shaderForm.get('opacity').setValue(1);
        break;
    }
    this.shaderForm.get('shadingType').setValue(newValue);
  }
}
