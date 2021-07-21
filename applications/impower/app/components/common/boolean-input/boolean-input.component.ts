/* tslint:disable:component-selector */
import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { getUuid } from '@val/common';

@Component({
  selector: 'boolean-input',
  templateUrl: './boolean-input.component.html',
  styleUrls: ['./boolean-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BooleanInputComponent),
      multi: true
    }
  ]
})
export class BooleanInputComponent implements ControlValueAccessor {
  private _value: boolean;

  @Input() displayType: 'slider' | 'checkbox' = 'slider';
  @Input() labelText: string;
  @Input() tabIndex: number;
  @Input() readOnly: boolean = false;

  public get value() : boolean {
    return this._value;
  }

  public set value(value: boolean) {
    this.writeValue(value);
    this.propagateTouch(value);
    this.propagateChange(value);
  }

  controlId = getUuid();
  isDisabled: boolean;

  propagateChange = (value: any) => { this.writeValue(value); };
  propagateTouch = (_: any) => {};

  constructor() { }

  public registerOnChange(fn: any) : void {
    this.propagateChange = fn;
  }

  public registerOnTouched(fn: any) : void {
    this.propagateTouch = fn;
  }

  public setDisabledState(isDisabled: boolean) : void {
    this.isDisabled = isDisabled;
  }

  public writeValue(obj: any) : void {
    this._value = !!obj;
  }
}
