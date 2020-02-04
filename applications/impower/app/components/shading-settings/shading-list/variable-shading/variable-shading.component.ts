import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { FormConfig } from '@val/common';
import { ColorPalette, ComplexShadingDefinition, ConfigurationTypes } from '@val/esri';
import { SelectItem } from 'primeng/api';
import { Audience } from '../../../../impower-datastore/state/transient/audience/audience.model';
import { VariableSelectionForm } from '../../../../state/forms/forms.interfaces';
import { FieldContentTypeCodes } from '../../../../val-modules/targeting/targeting.enums';
import { UIShadingDefinition } from '../../shading-ui-helpers';

@Component({
  selector: 'val-variable-shading',
  templateUrl: './variable-shading.component.html',
  styleUrls: ['./variable-shading.component.scss']
})
export class VariableShadingComponent implements OnInit {
  private _audiences: Audience[];
  public get audiences() : Audience[] {
    return this._audiences;
  }
  @Input()
  public set audiences(value: Audience[]) {
    this._audiences = value;
    this.allAudiences = this._audiences.filter(aud => aud.audienceSourceType !== 'Combined')
      .map(aud => ({label: `${aud.audienceSourceName}: ${aud.audienceName}`, value: aud.audienceIdentifier}));
  }

  @Input() definition: UIShadingDefinition;
  @Output() applyShader: EventEmitter<UIShadingDefinition> = new EventEmitter<UIShadingDefinition>();
  @Output() editShader: EventEmitter<UIShadingDefinition> = new EventEmitter<UIShadingDefinition>();

  public get currentAudience() : Audience {
    return this._audiences.filter(a => a.audienceIdentifier === this.definition.dataKey)[0];
  }
  allAudiences: SelectItem[];
  allThemes: SelectItem[] = [];
  allExtents: SelectItem[] = [];
  shaderForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.allThemes = Object.keys(ColorPalette).map(key => ({
      label: ColorPalette[key],
      value: ColorPalette[key]
    }));
    this.allExtents.push({label: 'Whole Map', value: 'Whole Map'});
    this.allExtents.push({label: 'Selected Geos only', value: 'Selected Geos only'});
  }

  ngOnInit() {
    const isWholeMap = !this.definition.filterByFeaturesOfInterest;
    const extendedDefinition = this.definition as ComplexShadingDefinition;
    const formSetup: FormConfig<VariableSelectionForm> = {
      layerName: [this.definition.layerName, Validators.required],
      opacity: new FormControl(this.definition.opacity, [Validators.required, Validators.min(0), Validators.max(1)]),
      audienceId: [this.definition.dataKey, Validators.required],
      extent: isWholeMap ? 'Whole Map' : 'Selected Geos only',
      theme: extendedDefinition.theme || ColorPalette.EsriPurple,
    };
    this.shaderForm = this.fb.group(formSetup, { updateOn: 'blur' });
  }

  variableSelectionChanged(newKey: string) : void {
    const newVar = this.audiences.filter(a => a.audienceIdentifier === newKey)[0];
    if (newVar != null) {
      const isNumeric = newVar.fieldconte !== FieldContentTypeCodes.Char;
      this.definition.layerName = newVar.audienceName;
      this.shaderForm.get('layerName').setValue(newVar.audienceName);
      this.definition.shadingType = isNumeric ? ConfigurationTypes.Ramp : ConfigurationTypes.Unique;
      this.shaderForm.get('audienceId').setValue(newVar.audienceIdentifier);
      this.definition.legendHeader = newVar.audienceName;
      this.definition.showLegendHeader = !isNumeric;
    }
  }

  edit(def: UIShadingDefinition) : void {
    this.definition = { ...def, isEditing: true };
    this.editShader.emit(this.shaderForm.value);
  }

  apply() : void {
    this.shaderForm.updateValueAndValidity();
    if (this.shaderForm.status === 'VALID') {
      const values: VariableSelectionForm = this.shaderForm.value;
      this.definition.filterByFeaturesOfInterest = values.extent === 'Selected Geos only';
      this.definition.dataKey = values.audienceId;
      delete values.extent;
      delete values.audienceId;
      Object.assign(this.definition, values);
      this.applyShader.emit(this.definition);
    }
  }
}
