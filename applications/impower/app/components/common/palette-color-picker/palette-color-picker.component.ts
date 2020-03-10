/* tslint:disable:component-selector */
import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { getUuid, rgbToHex } from '@val/common';
import { ColorPalette, getColorPalette, RgbaTuple, RgbTuple } from '@val/esri';
import { SelectItem } from 'primeng/api';

@Component({
  selector: 'palette-color-picker',
  templateUrl: './palette-color-picker.component.html',
  styleUrls: ['./palette-color-picker.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PaletteColorPickerComponent),
      multi: true
    }
  ]
})
export class PaletteColorPickerComponent implements ControlValueAccessor {

  public get palette() : ColorPalette {
    return this._palette;
  }
  @Input()
  public set palette(value: ColorPalette) {
    this._palette = value;
    this.updatePaletteOptions();
  }

  @Input() labelText: string;
  @Input() includeUnselected: boolean;
  @Input() tabIndex: number;
  @Input() readOnly: boolean = false;
  @Input() inputClass: string;

  @Output() selectionChanged: EventEmitter<RgbaTuple> = new EventEmitter<RgbaTuple>();

  controlId = getUuid();
  options: SelectItem[];
  isDisabled: boolean;

  get value() : RgbaTuple {
    return this._value;
  }

  set value(value: RgbaTuple) {
    this._value = value;
    this.propagateTouch(this._value);
    this.propagateChange(this._value);
  }

  private _palette: ColorPalette;
  private _value: RgbaTuple;

  propagateChange = (_: any) => {};
  propagateTouch = (_: any) => {};

  constructor() {}

  private updatePaletteOptions() {
    const colors = getColorPalette(this._palette, false);
    if (colors == null) {
      this.options = [{
        value: RgbTuple.withAlpha([0, 0, 0], 1),
        label: rgbToHex([0, 0, 0])
      }];
    } else {
      this.options = colors.map(tuple => ({
        value: RgbTuple.withAlpha(tuple, 1),
        label: rgbToHex(tuple)
      }));
    }
  }

  registerOnChange(fn: any) : void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any) : void {
    this.propagateTouch = fn;
  }

  setDisabledState(isDisabled: boolean) : void {
    this.isDisabled = isDisabled;
  }

  writeValue(obj: any) : void {
    this.value = obj;
  }
}
