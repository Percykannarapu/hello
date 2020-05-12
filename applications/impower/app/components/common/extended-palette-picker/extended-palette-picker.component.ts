import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { getUuid, rgbToHex } from '@val/common';
import { ColorPalette, getColorPalette, RgbaTuple, RgbTuple } from '@val/esri';
import { SelectItem } from 'primeng/api';

@Component({
  selector: 'val-extended-palette-picker',
  templateUrl: './extended-palette-picker.component.html',
  styleUrls: ['./extended-palette-picker.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ExtendedPalettePickerComponent),
      multi: true
    }
  ]
})
export class ExtendedPalettePickerComponent implements ControlValueAccessor {

  @Input()
  public set palette(value: ColorPalette) {
    this._palette = value;
    this.updatePaletteOptions();
  }
  @Input()
  public set reversePalette(value: boolean) {
    this._reversePalette = value;
    this.updatePaletteOptions();
  }
  @Input()
  public set allowCustom(value: boolean) {
    this._allowCustom = value;
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

  get selectionValue() : RgbaTuple | 'custom' {
    return this._selectionValue;
  }

  set selectionValue(value: RgbaTuple | 'custom') {
    if (value !== 'custom') {
      this.value = value;
    }
  }

  get value() : RgbaTuple {
    return this._value;
  }

  set value(value: RgbaTuple) {
    this.propagateTouch(value);
    this.propagateChange(value);
    this.writeValue(value);
  }

  private _palette: ColorPalette;
  private _reversePalette: boolean = false;
  private _allowCustom: boolean = true;
  private _value: RgbaTuple;
  private _selectionValue: RgbaTuple | 'custom';

  propagateChange = (value: any) => this.writeValue(value);
  propagateTouch = (_: any) => {};

  constructor() {}

  private updatePaletteOptions() {
    const colors = getColorPalette(this._palette, this._reversePalette);
    let options: SelectItem[];
    if (colors == null) {
      options = [{
        title: 'color',
        value: RgbTuple.withAlpha([0, 0, 0], 1),
        label: rgbToHex([0, 0, 0])
      }];
    } else {
      options = colors.map(tuple => ({
        title: 'color',
        value: RgbTuple.withAlpha(tuple, 1),
        label: rgbToHex(tuple)
      }));
    }
    if (this._allowCustom) {
      options.push({
        title: 'text',
        value: 'custom',
        label: 'Custom...'
      });
    }
    this.options = options;
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
    const matching = this.getMatchingOption(obj);
    this._value = matching;
    this.writeToSecondaryFields(matching);
  }

  private writeToSecondaryFields(obj: RgbaTuple) : void {
    if (obj != null) {
      this._selectionValue = obj;
    } else {
      this._selectionValue = 'custom';
    }
  }

  private getMatchingOption(obj: RgbaTuple) : RgbaTuple {
    const matching = this.options.filter(i => i.title === 'color' && RgbTuple.matches(i.value, obj))[0];
    if (matching != null) {
      return matching.value;
    } else {
      return null;
    }
  }
}
