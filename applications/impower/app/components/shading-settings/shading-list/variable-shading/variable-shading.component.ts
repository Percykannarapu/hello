import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { FormConfig, rgbToHex } from '@val/common';
import { ColorPalette, ComplexShadingDefinition, ConfigurationTypes, DotDensityShadingDefinition } from '@val/esri';
import { SelectItem } from 'primeng/api';
import { Audience } from '../../../../impower-datastore/state/transient/audience/audience.model';
import { VariableSelectionForm } from '../../../../state/forms/forms.interfaces';
import { FieldContentTypeCodes } from '../../../../val-modules/targeting/targeting.enums';
import { UIShadingDefinition } from '../../shading-ui-helpers';

interface Rgb { r: number; g: number; b: number; }

function esriToRgb(esriColor: [number, number, number, number]) : Rgb {
  return { r: esriColor[0], g: esriColor[1], b: esriColor[2] };
}

function rgbToEsri(rgbColor: Rgb) : [number, number, number, number] {
  return [ rgbColor.r, rgbColor.g, rgbColor.b, 1.0 ];
}

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

  get selectedDotColor() : Rgb {
    return esriToRgb(this.shaderForm.get('dotColor').value || [0, 0, 0, 1]);
  }
  set selectedDotColor(value: Rgb) {
    this.shaderForm.get('dotColor').setValue(rgbToEsri(value));
  }
  get currentDotColorInHex() : string {
    const dotDefinition = this.definition as DotDensityShadingDefinition;
    return rgbToHex(dotDefinition.dotColor);
  }

  @Input() definition: UIShadingDefinition;
  @Output() applyShader: EventEmitter<UIShadingDefinition> = new EventEmitter<UIShadingDefinition>();
  @Output() editShader: EventEmitter<UIShadingDefinition> = new EventEmitter<UIShadingDefinition>();
  @Output() removeShader: EventEmitter<UIShadingDefinition> = new EventEmitter<UIShadingDefinition>();

  public get currentAudience() : Audience {
    return this._audiences.filter(a => a.audienceIdentifier === this.definition.dataKey)[0];
  }
  allAudiences: SelectItem[];
  numericThemes: SelectItem[] = [];
  allThemes: SelectItem[] = [];
  allShaders: SelectItem[] = [];
  allExtents: SelectItem[] = [];
  shaderForm: FormGroup;

  ConfigurationTypes = ConfigurationTypes;

  constructor(private fb: FormBuilder) {
    this.allThemes = Object.keys(ColorPalette)
      .map(key => ({
        label: ColorPalette[key],
        value: ColorPalette[key]
      }));
    this.numericThemes = this.allThemes.filter(k => k.value !== ColorPalette.Cpqmaps);

    this.filterShaderTypes(ConfigurationTypes.Simple);
    this.allExtents.push({label: 'Whole Map', value: false });
    this.allExtents.push({label: 'Selected Geos only', value: true });
  }

  ngOnInit() {
    const extendedDefinition = this.definition as ComplexShadingDefinition;
    const dotDefinition = this.definition as DotDensityShadingDefinition;
    const formSetup: FormConfig<VariableSelectionForm> = {
      dataKey: [this.definition.dataKey, Validators.required],
      layerName: new FormControl(this.definition.layerName, { updateOn: 'blur', validators: [Validators.required] }),
      filterByFeaturesOfInterest: this.definition.filterByFeaturesOfInterest,
      shadingType: [this.definition.shadingType, Validators.required],
      theme: extendedDefinition.theme || ColorPalette.EsriPurple,
      reverseTheme: extendedDefinition.reverseTheme,
      opacity: new FormControl(this.definition.opacity, { updateOn: 'blur', validators: [Validators.required, Validators.min(0), Validators.max(1)] }),
      legendUnits: new FormControl(dotDefinition.legendUnits, { updateOn: 'blur' }),
      dotValue: new FormControl(dotDefinition.dotValue, { updateOn: 'blur' }),
      dotColor: new FormControl(dotDefinition.dotColor, { updateOn: 'blur' })
    };
    this.shaderForm = this.fb.group(formSetup);
  }

  variableSelectionChanged(newKey: string) : void {
    const newVar = this.audiences.filter(a => a.audienceIdentifier === newKey)[0];
    if (newVar != null) {
      switch (newVar.fieldconte) {
        case FieldContentTypeCodes.Char:
          this.filterShaderTypes(ConfigurationTypes.Simple, ConfigurationTypes.ClassBreak, ConfigurationTypes.Ramp, ConfigurationTypes.DotDensity);
          break;
        case FieldContentTypeCodes.Count:
          this.filterShaderTypes(ConfigurationTypes.Simple, ConfigurationTypes.ClassBreak, ConfigurationTypes.Unique);
          break;
        case FieldContentTypeCodes.Dist:
        case FieldContentTypeCodes.Distance:
        case FieldContentTypeCodes.Index:
        case FieldContentTypeCodes.Median:
        case FieldContentTypeCodes.Percent:
        case FieldContentTypeCodes.Ratio:
          this.filterShaderTypes(ConfigurationTypes.Simple, ConfigurationTypes.ClassBreak, ConfigurationTypes.DotDensity, ConfigurationTypes.Unique);
          break;
      }
      this.definition.layerName = newVar.audienceName;
      this.shaderForm.get('layerName').setValue(newVar.audienceName);
      this.shaderForm.get('dataKey').setValue(newVar.audienceIdentifier);
    }
  }

  edit(def: UIShadingDefinition) : void {
    this.definition = { ...def, isEditing: true };
    this.editShader.emit({ ...this.shaderForm.value, id: this.definition.id });
  }

  apply() : void {
    this.shaderForm.updateValueAndValidity();
    if (this.shaderForm.status === 'VALID') {
      const values: VariableSelectionForm = this.shaderForm.value;
      const newDef: UIShadingDefinition & VariableSelectionForm = { ...this.definition };
      Object.assign(newDef, values);
      switch (newDef.shadingType) {
        case ConfigurationTypes.Ramp:
          delete newDef.dotColor;
          delete newDef.dotValue;
          delete newDef.legendUnits;
          break;
        case ConfigurationTypes.Unique:
          newDef.theme = ColorPalette.Cpqmaps;
          delete newDef.dotColor;
          delete newDef.dotValue;
          delete newDef.legendUnits;
          break;
        case ConfigurationTypes.ClassBreak:
          newDef.reverseTheme = false;
          delete newDef.dotColor;
          delete newDef.dotValue;
          delete newDef.legendUnits;
          break;
        case ConfigurationTypes.DotDensity:
          newDef.arcadeExpression = null;
          delete newDef.theme;
          delete newDef.reverseTheme;
          break;
      }
      this.applyShader.emit(newDef);
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

  private filterShaderTypes(...typesToRemove: ConfigurationTypes[]) : void  {
    const removals = new Set(typesToRemove);
    this.allShaders = Object.keys(ConfigurationTypes)
      .filter(k => !removals.has(ConfigurationTypes[k]))
      .map(key => ({
        label: ConfigurationTypes[key],
        value: ConfigurationTypes[key]
      }));
  }
}
