import { AfterViewInit, Component, forwardRef, Input, ViewChild, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { getUuid, isNotNil } from '@val/common';
import { RgbaTuple, RgbTuple } from '@val/esri';
import { OverlayPanel } from 'primeng/overlaypanel';
import { BehaviorSubject } from 'rxjs';

interface Rgb { r: number; g: number; b: number; }

function tupleToRgb(color: RgbTuple | RgbaTuple) : Rgb {
  return { r: color?.[0] ?? 0, g: color?.[1] ?? 0, b: color?.[2] || 0 };
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

  @Input() defaultColor: RgbaTuple = [0, 0, 0, 1];
  @Input() swatchHeight: number = 20;
  @Input() autoOpen: boolean = false;

  controlId = getUuid();
  isDisabled: boolean;

  rgbValue$ = new BehaviorSubject<Rgb | null>(tupleToRgb(this.defaultColor));

  esriValue: RgbaTuple;

  onChange = (value: any) => {};
  onTouch = () => {};

  constructor() {}

  // ControlValueAccessor impl
  registerOnChange(fn: any) : void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any) : void {
    this.onTouch = fn;
  }

  setDisabledState(isDisabled: boolean) : void {
    this.isDisabled = isDisabled;
  }

  writeValue(obj: RgbaTuple) : void {
    if (obj != null) {
      this.esriValue = obj;
      this.rgbValue$.next(tupleToRgb(this.esriValue));
    }
  }

  // AfterViewInit impl
  ngAfterViewInit() {
    if (this.autoOpen) {
      this.openPicker(null);
    }
  }

  // Component methods
  haltClickPropagation(event: MouseEvent) {
    if (isNotNil(event)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
    }
  }

  openPicker(event: MouseEvent) {
    if (!this.isDisabled) {
      this.overlay.toggle(event);
      this.haltClickPropagation(event);
    }
  }

  setComponent(component: keyof Rgb, value: string) {
    const newValue = {
      ...this.rgbValue$.getValue(),
      [component]: Number(value)
    };
    this.setValue(newValue);
  }

  setValue(newValue: Rgb) {
    const defaultAlpha = this.esriValue?.[3] ?? this.defaultColor?.[3] ?? 1;
    this.esriValue = [newValue.r, newValue.g, newValue.b, defaultAlpha];
    this.rgbValue$.next(newValue);
    this.onChange(this.esriValue);
    this.onTouch();
  }

  resetToDefault() {
    this.setValue(tupleToRgb(this.defaultColor));
  }
}
