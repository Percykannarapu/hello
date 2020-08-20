import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { rgbToHex } from '@val/common';
import { MarkerSymbolDefinition, markerTypeFriendlyNames, RgbaTuple, SimplePoiConfiguration } from '@val/esri';
import { Subject } from 'rxjs';
import { ValassisValidators } from '../../../../../common/valassis-validators';

@Component({
  selector: 'val-simple-location-shader',
  templateUrl: './simple-location-shader.component.html',
})
export class SimpleLocationShaderComponent implements OnInit, OnDestroy {

  @Input() isEditing: boolean;
  @Input() configuration: SimplePoiConfiguration;
  @Input() defaultColor: RgbaTuple;
  @Input() defaultHalo: RgbaTuple;
  @Input() parentForm: FormGroup;

  private destroyed$ = new Subject<void>();

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    if (this.isEditing) this.setupForm();
  }

  ngOnDestroy() : void {
    if (this.parentForm) {
      this.parentForm.removeControl('symbolDefinition');
    }
    this.destroyed$.next();
  }

  getMarkerDescription(symbolDef: MarkerSymbolDefinition) : string {
    return markerTypeFriendlyNames[symbolDef.markerType];
  }

  getMarkerColor(symbolDef: MarkerSymbolDefinition) : string {
    return rgbToHex(symbolDef.color || this.defaultColor || [0, 0, 0, 1]);
  }

  getMarkerHalo(symbolDef: MarkerSymbolDefinition) : string {
    return rgbToHex(symbolDef.outlineColor || this.defaultHalo || [255, 255, 255, 1]);
  }

  private setupForm() : void {
    const defaultSymbol: Partial<MarkerSymbolDefinition> = this.configuration.symbolDefinition || {};
    this.parentForm.addControl('symbolDefinition', this.fb.group({
      legendName: new FormControl(defaultSymbol.legendName, [Validators.required]),
      outlineColor: new FormControl(defaultSymbol.outlineColor),
      color: new FormControl(defaultSymbol.color, { updateOn: 'change' }),
      size: new FormControl(defaultSymbol.size || 10, [Validators.required, ValassisValidators.numeric]),
      markerType: new FormControl(defaultSymbol.markerType, { updateOn: 'change' })
    }));
  }
}
