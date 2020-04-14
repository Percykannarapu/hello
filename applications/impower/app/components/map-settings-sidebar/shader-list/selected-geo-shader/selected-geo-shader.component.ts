import { Component } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { FormConfig, rgbToHex } from '@val/common';
import { FillSymbolDefinition, fillTypeFriendlyNames, SimpleShadingDefinition } from '@val/esri';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { GfpSelectionForm } from '../../../../state/forms/forms.interfaces';
import { ShaderBaseComponent } from '../shader-base.component';

@Component({
  selector: 'val-selected-geo-shader',
  templateUrl: './selected-geo-shader.component.html',
  styleUrls: ['./selected-geo-shader.component.scss']
})
export class SelectedGeoShaderComponent extends ShaderBaseComponent<SimpleShadingDefinition> {

  get currentFillColorInHex() : string {
    return rgbToHex(this.definition.defaultSymbolDefinition.fillColor);
  }
  get currentFriendlyFillType() : string {
    return fillTypeFriendlyNames[this.definition.defaultSymbolDefinition.fillType];
  }

  constructor(private fb: FormBuilder) {
    super();
  }

  protected setupForm() : void {
    const defaultSymbol: Partial<FillSymbolDefinition> = this.definition.defaultSymbolDefinition || {};

    const formSetup: FormConfig<GfpSelectionForm> = {
      layerName: [this.definition.layerName, Validators.required],
      opacity: new FormControl(this.definition.opacity, [Validators.required, Validators.min(0), Validators.max(1)]),
      defaultSymbolDefinition: this.fb.group({
        fillColor: new FormControl(defaultSymbol.fillColor),
        fillType: new FormControl(defaultSymbol.fillType),
        outlineColor: new FormControl(defaultSymbol.outlineColor),
        legendName: defaultSymbol.legendName
      })
    };
    this.shaderForm = this.fb.group(formSetup);

    this.shaderForm.get('defaultSymbolDefinition.fillType').valueChanges.pipe(
      takeUntil(this.destroyed$),
      distinctUntilChanged()
    ).subscribe(value => this.styleChanged(value));

    this.shaderForm.get('layerName').valueChanges.pipe(
      takeUntil(this.destroyed$),
      distinctUntilChanged()
    ).subscribe(newName => {
      this.shaderForm.get('defaultSymbolDefinition.legendName').setValue(newName);
    });
  }

  styleChanged(newValue: string) : void {
    if (newValue === 'solid') {
      this.shaderForm.get('opacity').setValue(0.25);
    } else {
      this.shaderForm.get('opacity').setValue(0.75);
    }
  }
}
