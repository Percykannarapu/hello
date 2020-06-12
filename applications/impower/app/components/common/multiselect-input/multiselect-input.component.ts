/* tslint:disable:component-selector */
import { Component, EventEmitter, forwardRef, Input, Output, ɵCompiler_compileModuleSync__POST_R3__, ViewEncapsulation, ViewChildren, QueryList } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { getUuid } from '@val/common';
import { SelectItem } from 'primeng/api';
import { MultiSelect } from 'primeng/multiselect';

@Component({
  selector: 'multiselect-input',
  templateUrl: './multiselect-input.component.html',
  styleUrls:  ['./multiselect-input.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiselectInputComponent),
      multi: true
    }
  ]
})
export class MultiselectInputComponent implements ControlValueAccessor  {
  @Output() selectionChanged: EventEmitter<any> = new EventEmitter<any>();
  @Output() onPanelShow: EventEmitter<any> = new EventEmitter<any>();
  @Output() onPanelHide: EventEmitter<any> = new EventEmitter<any>();

  @Input() labelText: string;
  @Input() options: SelectItem[];
  @Input() includeUnselected: boolean;
  @Input() tabIndex: number;
  @Input() readOnly: boolean = false;
  @Input() inputClass: string;

  @ViewChildren(MultiSelect) multiSelectInputs: QueryList<MultiSelect>;
  private multiSelect: MultiSelect;

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

  public clearSelection() {
    // Find the multiSelect component
    if (this.multiSelectInputs != null) {
      this.multiSelectInputs.forEach(msInput => {
        if (msInput.el.nativeElement.id == 'multiselect-input-' + this.controlId) {
          this.multiSelect = msInput;
          return;
        }
      });
    }

    this.multiSelect.value = null;
    this.multiSelect.valuesAsString = null;
    this.multiSelect.filterValue = null;

    // Trigger a grid change without filters
    this.selectionChanged.emit(null);
  }
}
