/* tslint:disable:component-selector */
import { Component, EventEmitter, Input, Optional, Output, Self } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { getUuid } from '@val/common';
import { SelectItem } from 'primeng/api';

@Component({
  selector: 'dropdown-input',
  templateUrl: './dropdown-input.component.html',
  styleUrls: ['./dropdown-input.component.scss']
})
export class DropdownInputComponent implements ControlValueAccessor {
  @Output() selectionChanged: EventEmitter<any> = new EventEmitter<any>();

  @Input() labelText: string;
  @Input() options: SelectItem[];
  @Input() includeUnselected: boolean;
  @Input() tabIndex: number;
  @Input() readOnly: boolean = false;
  @Input() inputClass: string;
  @Input() allowTruncation: boolean = false;
  @Input() truncateLength: number = 75;
  @Input() truncateSuffix: string = '...';
  @Input() validationMessage: string;

  controlId = getUuid();
  isDisabled: boolean;

  get value() : any {
    return this._value;
  }

  set value(value: any) {
    this.propagateTouch(value);
    this.propagateChange(value);
    this.writeValue(value);
  }

  private _value: any;

  propagateChange = (value: any) => this.writeValue(value);
  propagateTouch = (_: any) => {};

  constructor(@Optional() @Self() private controlContainer: NgControl) {
    if (this.controlContainer != null) {
      this.controlContainer.valueAccessor = this;
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
    this._value = obj;
  }

  hasErrors() : boolean {
    if (this.controlContainer != null) {
      const control = this.controlContainer.control;
      return control.touched && !control.valid && (this.validationMessage != null);
    }
    return false;
  }
}
