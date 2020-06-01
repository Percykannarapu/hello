import { Component, EventEmitter, Input, OnDestroy, Output, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { rgbToHex } from '@val/common';
import {
  completeEsriFaces,
  duplicatePoiConfiguration,
  LabelDefinition,
  PoiConfiguration,
  PoiConfigurationTypes,
  RgbaTuple,
  RgbTuple
} from '@val/esri';
import { SelectItem } from 'primeng/api';
import { Subject } from 'rxjs';
import { ValassisValidators } from '../../../../models/valassis-validators';
import { ImpGeofootprintLocation } from '../../../../val-modules/targeting/models/ImpGeofootprintLocation';

@Component({
  selector: 'val-location-shader',
  templateUrl: './location-shader.component.html',
  styleUrls: ['./location-shader.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LocationShaderComponent implements OnDestroy {

  @Input() labelChoices: SelectItem[];
  @Input() defaultColor: RgbaTuple;
  @Input() poiData: ImpGeofootprintLocation[];
  @Input() configuration: PoiConfiguration;
  @Output() applyConfiguration: EventEmitter<PoiConfiguration> = new EventEmitter<PoiConfiguration>();

  public get symbologyAttributes() : SelectItem[] {
    return this._symbologyAttributes;
  }

  @Input()
  public set symbologyAttributes(value: SelectItem[]) {
    value.sort((a, b) => {
      if (a.label.toLowerCase() === 'icon') return -1;
      if (b.label.toLowerCase() === 'icon') return 1;
      return a.label.localeCompare(b.label);
    });
    this._symbologyAttributes = value;
  }

  configForm: FormGroup;
  isEditing: boolean = false;
  defaultHalo: RgbaTuple = [255, 255, 255, 1];
  PoiConfigurationTypes = PoiConfigurationTypes;
  shaderTypeChoices: SelectItem[] = [
    { label: 'Same for All', value: PoiConfigurationTypes.Simple },
    { label: 'Based on Attribute', value: PoiConfigurationTypes.Unique }
  ];
  fontFaces: SelectItem[];

  private _symbologyAttributes: SelectItem[];
  private destroyed$ = new Subject<void>();

  constructor(private fb: FormBuilder) {
    this.fontFaces = completeEsriFaces.map(f => ({ label: f, value: f }));
  }

  ngOnDestroy() : void {
    this.destroyed$.next();
  }

  public edit() : void {
    this.setupForm();
    this.isEditing = true;
  }

  public cancel() : void {
    this.isEditing = false;
  }

  public apply(form: FormGroup) : void {
    if (form.valid) {
      const newDef: PoiConfiguration = duplicatePoiConfiguration(this.configuration);
      const convertedForm = this.convertForm(form);
      Object.assign(newDef, convertedForm);
      this.applyConfiguration.emit(newDef);
    }
  }

  protected setupForm() : void {
    const defaultLabelDefinition: Partial<LabelDefinition> = this.configuration.labelDefinition || {};
    const formSetup: any = {
      layerName: new FormControl(this.configuration.layerName, [Validators.required]),
      poiType: new FormControl(this.configuration.poiType, [Validators.required]),
      opacity: new FormControl(this.configuration.opacity, [Validators.required, Validators.min(0), Validators.max(1)]),
      showLabels: new FormControl(this.configuration.showLabels || false, { updateOn: 'change' }),
      labelDefinition: this.fb.group({
        isBold: new FormControl(defaultLabelDefinition.isBold || false, { updateOn: 'change' }),
        isItalic: new FormControl(defaultLabelDefinition.isItalic || false, { updateOn: 'change' }),
        usesStaticColor: new FormControl(defaultLabelDefinition.usesStaticColor || false, { updateOn: 'change' }),
        family: new FormControl(defaultLabelDefinition.family || 'Noto Sans', { updateOn: 'change', validators: [Validators.required] }),
        size: new FormControl(defaultLabelDefinition.size || 12, [Validators.required, ValassisValidators.numeric, Validators.min(6), Validators.max(48)]),
        color: new FormControl(defaultLabelDefinition.color),
        haloColor: new FormControl(defaultLabelDefinition.haloColor),
        featureAttribute: new FormControl(defaultLabelDefinition.featureAttribute, { updateOn: 'change', validators: [Validators.required] })
      })
    };
    this.configForm = this.fb.group(formSetup);
  }

  protected convertForm(form: FormGroup) : PoiConfiguration {
    const result: PoiConfiguration = form.value;
    switch (result.poiType) {
      case PoiConfigurationTypes.Simple:
        result.symbolDefinition.outlineColor = RgbTuple.duplicate(result.symbolDefinition.outlineColor || this.defaultHalo);
        break;
      case PoiConfigurationTypes.Unique:
        result.breakDefinitions.forEach(bd => {
          bd.outlineColor = RgbTuple.duplicate(bd.outlineColor || this.defaultHalo);
          bd.outlineWidth = bd.outlineWidth || 1;
        });
        break;
    }
    return result;
  }

  getLabelDescription(labelDef: LabelDefinition) : string {
    const foundItem = (this.labelChoices || []).filter(l => l.value === labelDef.featureAttribute)[0];
    return foundItem == null ? 'n/a' : foundItem.label;
  }

  getFontWeight(labelDef: LabelDefinition) : string {
    const fontItems: string[] = [];
    if (labelDef.isBold) fontItems.push('Bold');
    if (labelDef.isItalic) fontItems.push('Italic');
    return fontItems.length > 0 ? fontItems.join(' ') : 'Regular';
  }

  getLabelColor(symbolDef: LabelDefinition) : string {
    return rgbToHex(symbolDef.color || this.defaultColor || [0, 0, 0, 1]);
  }

  getLabelHalo(symbolDef: LabelDefinition) : string {
    return rgbToHex(symbolDef.haloColor || this.defaultHalo || [255, 255, 255, 1]);
  }
}
