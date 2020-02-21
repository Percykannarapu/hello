/* tslint:disable:component-selector */
import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { getUuid, rgbToHex } from '@val/common';
import { ColorPalette, getColorPalette, RgbaTuple, RgbTuple } from '@val/esri';
import { SelectItem } from 'primeng/api';

@Component({
  selector: 'palette-color-picker',
  templateUrl: './palette-color-picker.component.html',
  styleUrls: ['./palette-color-picker.component.scss']
})
export class PaletteColorPickerComponent implements OnInit {
  private _currentPalette: ColorPalette;

  public get currentPalette() : ColorPalette {
    return this._currentPalette;
  }
  @Input()
  public set currentPalette(value: ColorPalette) {
    this._currentPalette = value;
    this.updatePaletteOptions();
  }

  @Input() parentForm: FormGroup;
  @Input() valueName: string;
  controlId = getUuid();

  options: SelectItem[];

  constructor() { }

  ngOnInit() {
    this.updatePaletteOptions();
    this.updateListWithCurrentColor();
  }

  private updatePaletteOptions() {
    const colors = getColorPalette(this._currentPalette, false);
    this.options = colors.map(tuple => ({
      value: RgbTuple.withAlpha(tuple, 1),
      label: rgbToHex(tuple)
    }));
  }

  private updateListWithCurrentColor() {
    const currentColor = this.parentForm.get(this.valueName).value as RgbaTuple;
    const matches = this.options.some(opt => RgbTuple.matches(currentColor, opt.value));
    if (!matches) {
      this.options.push({
        value: currentColor,
        label: rgbToHex(currentColor)
      });
    }
  }

  public updateValue(value: RgbaTuple) {
    this.parentForm.get(this.valueName).setValue(value);
  }
}
