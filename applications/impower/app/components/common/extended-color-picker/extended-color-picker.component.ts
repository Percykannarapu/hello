import { Component, Input, Optional, Self, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, NgControl, NgModel } from '@angular/forms';
import { getUuid, isConvertibleToInteger, rgbToHex } from '@val/common';
import { RgbaTuple } from '@val/esri';

interface Rgb { r: number; g: number; b: number; }

function esriToRgb(esriColor: RgbaTuple) : Rgb {
  return { r: esriColor[0] || 0, g: esriColor[1] || 0, b: esriColor[2] || 0 };
}

function rgbToEsri(rgbColor: Rgb) : RgbaTuple {
  return [rgbColor.r, rgbColor.g, rgbColor.b, 1.0];
}

@Component({
  selector: 'val-extended-color-picker',
  templateUrl: './extended-color-picker.component.html',
  styleUrls: ['./extended-color-picker.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ExtendedColorPickerComponent implements ControlValueAccessor {

  @Input() defaultColor: RgbaTuple;

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

  get value() : Rgb {
    return this._value != null ? esriToRgb(this._value) : esriToRgb(this.defaultColor || [0, 0, 0, 1]);
  }

  set value(value: Rgb) {
    const esriValue = rgbToEsri(value);
    this.writeValue(esriValue);
    this.propagateTouch(esriValue);
    this.propagateChange(esriValue);
  }

  private _value: RgbaTuple;

  propagateChange = (_: any) => { this.writeValue(_); };
  propagateTouch = (_: any) => {};

  constructor(@Optional() @Self() private controlContainer: NgControl) {
    if (this.controlContainer != null) {
      this.controlContainer.valueAccessor = this;
    }
  }

  updateRgbComponent(component: keyof Rgb, model: NgModel) {
    const userValue = model.model;
    if (isConvertibleToInteger(userValue)) {
      const newValue = Number(userValue);
      if (newValue >= 0 && newValue <= 255) {
        this.value = { ...this.value as any, [component]: newValue };
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
    this.value = esriToRgb(this.defaultColor);
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
    this._value = obj;
    if (this._value != null) {
      this.updateLocalValues(esriToRgb(this._value));
    }
  }

  private updateLocalValues(newValue: Rgb) {
    this.value0 = `${newValue.r}`;
    this.value1 = `${newValue.g}`;
    this.value2 = `${newValue.b}`;
  }
}
