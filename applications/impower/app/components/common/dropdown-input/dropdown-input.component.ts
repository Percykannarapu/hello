/* tslint:disable:component-selector */
import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { getUuid } from '@val/common';
import { SelectItem } from 'primeng/api';

@Component({
  selector: 'dropdown-input',
  templateUrl: './dropdown-input.component.html',
  styleUrls: ['./dropdown-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DropdownInputComponent),
      multi: true
    }
  ]
})
export class DropdownInputComponent implements ControlValueAccessor {
  @Output() selectionChanged: EventEmitter<any> = new EventEmitter<any>();

  @Input() labelText: string;
  @Input() options: SelectItem[];
  @Input() includeUnselected: boolean;
  @Input() tabIndex: number;
  @Input() readOnly: boolean = false;
  @Input() inputClass: string;
  @Input() allowTruncation: boolean = true;
  @Input() truncateLength: number = 75;
  @Input() truncateSuffix: string = '...';

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

  constructor() {}

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
