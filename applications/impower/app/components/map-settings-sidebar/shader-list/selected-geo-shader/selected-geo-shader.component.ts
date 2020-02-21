import { Component } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { FormConfig, rgbToHex } from '@val/common';
import { fillTypeFriendlyNames, SimpleShadingDefinition, SymbolDefinition } from '@val/esri';
import { distinctUntilChanged, map, takeUntil } from 'rxjs/operators';
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
    const defaultSymbol: Partial<SymbolDefinition> = this.definition.defaultSymbolDefinition || {};

    const formSetup: FormConfig<GfpSelectionForm> = {
      layerName: [this.definition.layerName, Validators.required],
      opacity: new FormControl(this.definition.opacity, [Validators.required, Validators.min(0), Validators.max(1)]),
      defaultSymbolDefinition: this.fb.group({
        fillColor: new FormControl(defaultSymbol.fillColor, { updateOn: 'change' }),
        fillType: new FormControl(defaultSymbol.fillType, { updateOn: 'change' }),
        outlineColor: new FormControl(defaultSymbol.outlineColor, { updateOn: 'change' }),
        legendName: defaultSymbol.legendName
      })
    };
    this.shaderForm = this.fb.group(formSetup, { updateOn: 'blur' });

    this.shaderForm.get('defaultSymbolDefinition').valueChanges.pipe(
      takeUntil(this.destroyed$),
      map(value => value.fillType),
      distinctUntilChanged()
    ).subscribe(value => this.styleChanged(value));
  }

  styleChanged(newValue: string) : void {
    if (newValue === 'solid') {
      this.shaderForm.get('opacity').setValue(0.25);
    } else {
      this.shaderForm.get('opacity').setValue(0.75);
    }
  }
}
