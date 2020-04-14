import { Component, Input } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { rgbToHex } from '@val/common';
import { LabelDefinition, MarkerSymbolDefinition, markerTypeFriendlyNames, RgbaTuple, SimplePoiConfiguration } from '@val/esri';
import { SelectItem } from 'primeng/api';
import { PoiBaseComponent } from '../poi-base.component';

@Component({
  selector: 'val-location-shader',
  templateUrl: './location-shader.component.html',
  styleUrls: ['./location-shader.component.scss']
})
export class LocationShaderComponent extends PoiBaseComponent<SimplePoiConfiguration> {

  @Input() labelChoices: SelectItem[];

  @Input() defaultColor: RgbaTuple;

  get currentLabelIdentifier() : string {
    const currentLabelConfig = (this.configuration.labelDefinition || {} as Partial<LabelDefinition>).featureAttribute;
    const foundItem = (this.labelChoices || []).filter(l => l.value === currentLabelConfig)[0];
    return foundItem == null ? '' : foundItem.label;
  }

  get currentMarkerIdentifier() : string {
    const currentMarkerType = (this.configuration.symbolDefinition || {} as Partial<MarkerSymbolDefinition>).markerType;
    return markerTypeFriendlyNames[currentMarkerType];
  }

  get currentMarkerColorInHex() : string {
    return rgbToHex((this.configuration.symbolDefinition || {} as Partial<MarkerSymbolDefinition>).color || this.defaultColor);
  }

  constructor(private fb: FormBuilder) {
    super();
  }

  protected setupForm() : void {
    const defaultLabelDefinition: Partial<LabelDefinition> = this.configuration.labelDefinition || {};
    const defaultSymbolDefinition: Partial<MarkerSymbolDefinition> = this.configuration.symbolDefinition || {};
    const formSetup: any = {
      opacity: new FormControl(this.configuration.opacity, [Validators.required, Validators.min(0), Validators.max(1)]),
      showLabels: new FormControl(this.configuration.showLabels || false, { updateOn: 'change' }),
      labelDefinition: this.fb.group({
        isBold: new FormControl(defaultLabelDefinition.isBold || false, { updateOn: 'change' }),
        size: defaultLabelDefinition.size,
        color: new FormControl(defaultLabelDefinition.color),
        haloColor: new FormControl(defaultLabelDefinition.haloColor),
        featureAttribute: new FormControl(defaultLabelDefinition.featureAttribute, { updateOn: 'change' })
      }),
      symbolDefinition: this.fb.group({
        legendName: new FormControl(defaultSymbolDefinition.legendName, [Validators.required]),
        outlineColor: new FormControl(defaultSymbolDefinition.outlineColor),
        color: new FormControl(defaultSymbolDefinition.color),
        markerType: new FormControl(defaultSymbolDefinition.markerType, { updateOn: 'change' })
      })
    };
    this.configForm = this.fb.group(formSetup);
  }

}
