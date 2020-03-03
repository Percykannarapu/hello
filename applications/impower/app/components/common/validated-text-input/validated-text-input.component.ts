/* tslint:disable:component-selector */
import { Component, Input, Optional, Self } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { getUuid } from '@val/common';

@Component({
  selector: 'validated-text-input',
  templateUrl: './validated-text-input.component.html',
  styleUrls: ['./validated-text-input.component.scss']
})
export class ValidatedTextInputComponent implements ControlValueAccessor {

  @Input() validationMessage: string;
  @Input() labelText: string;
  @Input() tabIndex: number;
  @Input() readOnly: boolean = false;
  @Input() inputClass: string;

  controlId = getUuid();
  isDisabled: boolean;

  get value() : string {
    return this._value;
  }

  set value(value: string) {
    this._value = value;
    this.propagateChange(this._value);
  }

  private _value: string;

  propagateChange = (_: any) => {};
  propagateTouch = (_: any) => {};

  constructor(@Optional() @Self() private controlContainer: NgControl) {
    if (this.controlContainer != null) {
      this.controlContainer.valueAccessor = this;
    }
  }

  hasErrors() : boolean {
    if (this.controlContainer != null) {
      const control = this.controlContainer.control;
      return control.touched && !control.valid && (this.validationMessage != null);
    }
    return false;
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
