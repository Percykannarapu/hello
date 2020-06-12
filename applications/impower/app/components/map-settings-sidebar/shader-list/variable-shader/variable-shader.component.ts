import { Component, Input, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { ConfigurationTypes, shaderConfigTypeFriendlyNames, ShadingDefinition } from '@val/esri';
import { SelectItem } from 'primeng/api';
import { Audience } from '../../../../impower-datastore/state/transient/audience/audience.model';
import { FieldContentTypeCodes } from '../../../../val-modules/targeting/targeting.enums';
import { ShaderBaseComponent } from '../shader-base.component';

@Component({
  selector: 'val-variable-shader',
  templateUrl: './variable-shader.component.html',
  styleUrls: ['./variable-shader.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class VariableShaderComponent extends ShaderBaseComponent<ShadingDefinition> {
  private _audiences: Audience[];
  public get audiences() : Audience[] {
    return this._audiences;
  }
  @Input()
  public set audiences(value: Audience[]) {
    this._audiences = value;
    this.allAudiences = this._audiences.map(aud => ({label: `${aud.audienceName} (${aud.audienceSourceName})`, value: aud.audienceIdentifier}));
  }

  public get currentAudience() : Audience {
    const currentAudienceId = this.definition.dataKey || this.shaderForm.get('dataKey').value;
    return this._audiences.filter(a => a.audienceIdentifier === currentAudienceId)[0];
  }
  allAudiences: SelectItem[];
  allShaders: SelectItem[] = [];

  ConfigurationTypes = ConfigurationTypes;

  constructor(private fb: FormBuilder) {
    super();
  }

  variableSelectionChanged(newKey: string) : void {
    const newVar = this.audiences.filter(a => a.audienceIdentifier === newKey)[0];
    if (newVar != null) {
      if (newVar.audienceSourceType !== 'Custom') {
        this.limitShaderTypesByVar(newVar.fieldconte);
      } else {
        this.setShaderTypes(ConfigurationTypes.Ramp, ConfigurationTypes.ClassBreak, ConfigurationTypes.DotDensity, ConfigurationTypes.Unique);
      }
      this.shaderForm.get('layerName').setValue(newVar.audienceName);
    }
  }

  private setShaderTypes(...typesToShow: ConfigurationTypes[]) : void  {
    this.allShaders = typesToShow.map(key => ({
        label: shaderConfigTypeFriendlyNames[ConfigurationTypes[key]],
        value: ConfigurationTypes[key]
      }));
    if (this.allShaders.length === 1) {
      this.shaderForm.get('shadingType').setValue(this.allShaders[0].value);
    }
  }

  protected setupForm() : void {
    const formSetup: any = {
      dataKey: [this.definition.dataKey, Validators.required],
      shadingType: [this.definition.shadingType, Validators.required],
      layerName: new FormControl(this.definition.layerName, { updateOn: 'blur', validators: [Validators.required] }),
      filterByFeaturesOfInterest: this.definition.filterByFeaturesOfInterest,
      opacity: new FormControl(this.definition.opacity, { updateOn: 'blur', validators: [Validators.required, Validators.min(0), Validators.max(1)] }),
    };
    this.shaderForm = this.fb.group(formSetup);
    if (this.currentAudience != null) {
      if (this.currentAudience.audienceSourceType !== 'Custom') {
        this.limitShaderTypesByVar(this.currentAudience.fieldconte);
      } else {
        this.setShaderTypes(ConfigurationTypes.Ramp, ConfigurationTypes.ClassBreak, ConfigurationTypes.DotDensity, ConfigurationTypes.Unique);
      }
    }
  }

  private limitShaderTypesByVar(varType: FieldContentTypeCodes) : void {
    switch (varType) {
      case FieldContentTypeCodes.Char:
        this.setShaderTypes(ConfigurationTypes.Unique);
        break;
      case FieldContentTypeCodes.Count:
        this.setShaderTypes(ConfigurationTypes.Ramp, ConfigurationTypes.ClassBreak, ConfigurationTypes.DotDensity);
        break;
      case FieldContentTypeCodes.Dist:
      case FieldContentTypeCodes.Distance:
      case FieldContentTypeCodes.Index:
      case FieldContentTypeCodes.Median:
      case FieldContentTypeCodes.Percent:
      case FieldContentTypeCodes.Ratio:
        this.setShaderTypes(ConfigurationTypes.Ramp, ConfigurationTypes.ClassBreak);
        break;
      default:
        this.setShaderTypes(ConfigurationTypes.Simple);
    }
  }
}
