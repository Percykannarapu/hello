/* tslint:disable:component-selector */
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SelectItem } from 'primeng/api';

@Component({
  selector: 'dropdown-input',
  templateUrl: './dropdown-input.component.html',
  styleUrls: ['./dropdown-input.component.scss']
})
export class DropdownInputComponent {

  @Input() parentForm: FormGroup;
  @Input() valueName: string;
  @Input() labelText: string;
  @Input() options: SelectItem[];
  @Input() includeUnselected: boolean;

  @Output() selectionChanged: EventEmitter<any> = new EventEmitter<any>();

  constructor() { }

  handleChange(evt: any) : any {
    this.selectionChanged.emit(evt.value);
    return evt;
  }
}
