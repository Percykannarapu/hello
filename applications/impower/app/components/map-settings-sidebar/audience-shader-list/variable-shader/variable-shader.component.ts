import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { ConfigurationTypes, shaderConfigTypeFriendlyNames, ShadingDefinition } from '@val/esri';
import { GfpShaderKeys } from 'app/common/models/ui-enums';
import { SelectItem } from 'primeng/api';
import { FieldContentTypeCodes } from '../../../../../worker-shared/data-model/impower.data-model.enums';
import { Audience } from '../../../../impower-datastore/state/transient/audience/audience.model';
import { AudienceShaderComponentBase } from '../audience-shader-component-base.directive';

@Component({
  selector: 'val-variable-shader',
  templateUrl: './variable-shader.component.html',
  styleUrls: ['./variable-shader.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class VariableShaderComponent extends AudienceShaderComponentBase<ShadingDefinition> {
  private _audiences: Audience[];
  public get audiences() : Audience[] {
    return this._audiences;
  }
  @Input()
  public set audiences(value: Audience[]) {
    this._audiences = value;
    this.allAudiences = this._audiences.map(aud => ({label: `${aud.audienceName} (${aud.audienceSourceName})`, value: aud.audienceIdentifier}));
  }

  shadingTypes = GfpShaderKeys;

  @Output() customAudienceSelected: EventEmitter<boolean> = new EventEmitter<boolean>();

  public get currentAudience() : Audience {
    const currentAudienceId = this.definition.dataKey || this.shaderForm.get('dataKey').value;
    return this._audiences.filter(a => a.audienceIdentifier === currentAudienceId)[0];
  }
  allAudiences: SelectItem<string>[];
  allShaders: SelectItem<ConfigurationTypes>[] = [];

  ConfigurationTypes = ConfigurationTypes;

  constructor(private fb: FormBuilder) {
    super();
  }

  variableSelectionChanged(newKey: string) : void {
    const newVar = this.audiences.filter(a => a.audienceIdentifier === newKey)[0];
    if (newVar != null) {
      if (newVar.audienceSourceType === 'Custom') {
        this.customAudienceSelected.emit(true);
        this.setShaderTypes(ConfigurationTypes.Ramp, ConfigurationTypes.ClassBreak, ConfigurationTypes.DotDensity, ConfigurationTypes.Unique);
      } else {
        this.customAudienceSelected.emit(false);
        this.limitShaderTypesByVar(newVar.fieldconte);
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
      useLocalGeometry: new FormControl(this.definition.useLocalGeometry, { updateOn: 'change' }),
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

    if (this.definition.dataKey == GfpShaderKeys.PcrIndicator){
      this.setShaderTypes(ConfigurationTypes.Unique);
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
