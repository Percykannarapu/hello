import { AfterViewInit, Component, ElementRef, forwardRef, Input, ViewChild, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NgModel } from '@angular/forms';
import { getUuid, isConvertibleToInteger, rgbToHex } from '@val/common';
import { RgbaTuple, RgbTuple } from '@val/esri';
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
export class ExtendedColorPickerComponent implements ControlValueAccessor, AfterViewInit {

  @ViewChild('picker', { static: true }) overlay: OverlayPanel;
  @ViewChild('panelParent', { static: true }) panelParent: ElementRef;
  @ViewChild('redInput', { static: true }) redInput: NgModel;
  @ViewChild('greenInput', { static: true }) greenInput: NgModel;
  @ViewChild('blueInput', { static: true }) blueInput: NgModel;

  @Input() defaultColor: RgbaTuple;
  @Input() swatchHeight: number = 20;
  @Input() autoOpen: boolean = false;

  controlId = getUuid();
  isDisabled: boolean;
  validationErrors: any = null;

  get swatchHex() : string {
    return rgbToHex(this.esriValue || this.defaultColor || [0, 0, 0, 1]);
  }

  get redComponent() : string {
    return this._redComponent;
  }

  set redComponent(_: string) {
    this.updateRgbComponent('r', this.redInput);
  }

  get greenComponent() : string {
    return this._greenComponent;
  }

  set greenComponent(_: string) {
    this.updateRgbComponent('g', this.greenInput);
  }

  get blueComponent() : string {
    return this._blueComponent;
  }

  set blueComponent(_: string) {
    this.updateRgbComponent('b', this.blueInput);
  }

  get pickerValue() : Rgb {
    return esriToRgb(this.esriValue);
  }

  set pickerValue(value: Rgb) {
    const newEsriValue = rgbToEsri(value);
    this.writeValue(newEsriValue);
    this.propagateTouch(newEsriValue);
    this.propagateChange(newEsriValue);
  }

  private esriValue: RgbaTuple;
  private _redComponent: string = '';
  private _greenComponent: string = '';
  private _blueComponent: string = '';

  propagateChange = (value: any) => this.writeValue(value);
  propagateTouch = (_: any) => {};

  constructor() {}

  ngAfterViewInit() {
    if (this.autoOpen) {
      this.openPicker(null);
    }
  }

  haltClickPropagation(event: MouseEvent) {
    event.stopPropagation();
  }

  openPicker(event: MouseEvent) {
    if (event != null) {
      this.overlay.toggle(event);
      this.haltClickPropagation(event);
    } else {
      this.overlay.toggle(null, this.panelParent.nativeElement);
    }
  }

  updateRgbComponent(component: keyof Rgb, model: NgModel) {
    const userValue = model.value;
    if (isConvertibleToInteger(userValue)) {
      const newValue = Number(userValue);
      if (newValue >= 0 && newValue <= 255) {
        const oldRgb = esriToRgb(this.esriValue);
        const newRgb = { ...oldRgb, [component]: newValue };
        this.validationErrors = null;
        model.control.setErrors(null);
        const newEsriValue = rgbToEsri(newRgb);
        this.writeValue(newEsriValue);
        this.propagateTouch(newEsriValue);
        this.propagateChange(newEsriValue);
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
    this.writeValue(RgbTuple.duplicate(this.defaultColor));
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
    if (obj != null) {
      this.esriValue = obj;
      this._redComponent = `${obj[0]}`;
      this._greenComponent = `${obj[1]}`;
      this._blueComponent = `${obj[2]}`;
    }
  }
}
