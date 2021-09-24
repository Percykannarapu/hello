/* tslint:disable:component-selector */
import { Component, Input, Optional, Self } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { getUuid } from '@val/common';

@Component({
  selector: 'validated-text-input',
  templateUrl: './validated-text-input.component.html',
})
export class ValidatedTextInputComponent implements ControlValueAccessor {

  @Input() validationMessage: string;
  @Input() validationMessageKey: string;
  @Input() labelText: string;
  @Input() tabIndex: number;
  @Input() inputClass: string;

  controlId = getUuid();
  isDisabled: boolean;

  public get readOnly() : boolean {
    return this._readOnly;
  }
  @Input()
  public set readOnly(value: boolean) {
    this._readOnly = value;
  }

  get value() : string {
    return this._value;
  }

  set value(value: string) {
    if (this.touchOnChange) this.propagateTouch(value);
    this.propagateChange(value);
    this.writeValue(value);
  }

  get touchOnChange() : boolean {
    return this.controlContainer?.control?.updateOn === 'change';
  }

  get validationOutput() : string {
    return this.validationMessage ?? this.controlContainer?.control?.errors?.[this.validationMessageKey] ?? null;
  }

  private _value: string;
  private _readOnly: boolean = false;

  propagateChange = (value: any) => this.writeValue(value);
  propagateTouch = (_: any) => {};

  constructor(@Optional() @Self() private controlContainer: NgControl) {
    if (this.controlContainer != null) {
      this.controlContainer.valueAccessor = this;
    }
  }

  hasErrors() : boolean {
    if (this.controlContainer != null) {
      const control = this.controlContainer.control;
      return control.root.touched && !control.valid && (this.validationOutput != null);
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
    this._value = obj;
  }
}
