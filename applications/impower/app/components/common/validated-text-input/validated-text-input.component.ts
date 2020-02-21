/* tslint:disable:component-selector */
import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { getUuid } from '@val/common';

@Component({
  selector: 'validated-text-input',
  templateUrl: './validated-text-input.component.html',
  styleUrls: ['./validated-text-input.component.scss']
})
export class ValidatedTextInputComponent {

  @Input() parentForm: FormGroup;
  @Input() valueName: string;
  @Input() validationMessage: string;
  @Input() labelText: string;

  controlId = getUuid();

  constructor() { }

  hasErrors() : boolean {
    const control = this.parentForm.get(this.valueName);
    return control.touched && !control.valid && (this.validationMessage != null);
  }
}
