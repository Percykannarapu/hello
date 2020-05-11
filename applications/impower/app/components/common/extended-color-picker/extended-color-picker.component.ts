import { Component, forwardRef, Input, ViewChild, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NgModel } from '@angular/forms';
import { getUuid, isConvertibleToInteger, rgbToHex } from '@val/common';
import { RgbaTuple } from '@val/esri';
import { OverlayPanel } from 'primeng/overlaypanel';

interface Rgb { r: number; g: number; b: number; }

function esriToRgb(esriColor: RgbaTuple) : Rgb {
  const sanitized = esriColor || [null, null, null, null];
  return { r: sanitized[0] || 0, g: sanitized[1] || 0, b: sanitized[2] || 0 };
}

function rgbToEsri(rgbColor: Rgb) : RgbaTuple {
  return [rgbColor.r, rgbColor.g, rgbColor.b, 1.0];
}

@Component({
  selector: 'val-extended-color-picker',
  templateUrl: './extended-color-picker.component.html',
  styleUrls: ['./extended-color-picker.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ExtendedColorPickerComponent),
      multi: true
    }
  ]
})
export class ExtendedColorPickerComponent implements ControlValueAccessor {

  @ViewChild(OverlayPanel, { static: true }) panel: OverlayPanel;

  @Input() defaultColor: RgbaTuple;
  @Input() swatchHeight: number = 20;

  controlId = getUuid();
  isDisabled: boolean;
  validationErrors: any = null;

  value0: string;
  value1: string;
  value2: string;

  get swatchHex() : string {
    if (this._value == null) return rgbToHex(this.defaultColor || [0, 0, 0, 1]);
    return rgbToHex(this._value);
  }

  get pickerValue() : Rgb {
    return this._pickerValue;
  }

  set pickerValue(value: Rgb) {
    this.value = rgbToEsri(value);
  }

  get value() : RgbaTuple {
    return this._value;
  }

  set value(value: RgbaTuple) {
    this.propagateTouch(value);
    this.propagateChange(value);
    this.writeValue(value);
  }

  private _pickerValue: Rgb;
  private _value: RgbaTuple;

  propagateChange = (_: any) => {};
  propagateTouch = (_: any) => {};

  constructor() {}

  haltClickPropagation(event: MouseEvent) {
    event.stopPropagation();
  }

  openPicker(event: MouseEvent) {
    this.panel.toggle(event);
    this.haltClickPropagation(event);
  }

  updateRgbComponent(component: keyof Rgb, model: NgModel) {
    const userValue = model.model;
    if (isConvertibleToInteger(userValue)) {
      const newValue = Number(userValue);
      if (newValue >= 0 && newValue <= 255) {
        const newRgb = { ...this._pickerValue, [component]: newValue };
        this.value = rgbToEsri(newRgb);
        this.validationErrors = null;
        model.control.setErrors(null);
      } else {
        const rangeError = { [component]: 'Must be 0 - 255' };
        this.validationErrors = { ...this.validationErrors, ...rangeError };
        model.control.setErrors(rangeError);
      }
    } else {
      const typeError = { [component]: 'Not a Number' };
      this.validationErrors = { ...this.validationErrors, ...typeError };
      model.control.setErrors(typeError);
    }
  }

  resetToDefault() {
    this.value = [...this.defaultColor] as RgbaTuple;
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
    this._value = obj;
    const rgb = esriToRgb(this._value);
    this._pickerValue = { ...rgb };
    this.value0 = `${rgb.r}`;
    this.value1 = `${rgb.g}`;
    this.value2 = `${rgb.b}`;
  }
}
