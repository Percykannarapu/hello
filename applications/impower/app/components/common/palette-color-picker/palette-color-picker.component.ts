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

  @Input()
  public set palette(value: ColorPalette) {
    this._palette = value;
    this.updatePaletteOptions(this._palette, this._reversePalette);
  }
  @Input()
  public set reversePalette(value: boolean) {
    this._reversePalette = value;
    this.updatePaletteOptions(this._palette, this._reversePalette);
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
    const match = this.getMatchingOption(value);
    this.propagateTouch(match);
    this.propagateChange(match);
    this.writeValue(value);
  }

  private _palette: ColorPalette;
  private _reversePalette: boolean;
  private _value: RgbaTuple;

  propagateChange = (value: any) => this.writeValue(value);
  propagateTouch = (_: any) => {};

  constructor() {}

  private updatePaletteOptions(palette: ColorPalette, reversed: boolean) {
    const colors = getColorPalette(palette, reversed);
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

  writeValue(obj: RgbaTuple) : void {
    this._value = this.getMatchingOption(obj);
  }

  getMatchingOption(obj: RgbaTuple) : RgbaTuple {
    const matching = this.options.filter(i => i.title === 'color' && RgbTuple.matches(i.value, obj))[0];
    if (matching != null) {
      return matching.value;
    } else {
      return null;
    }
  }
}
