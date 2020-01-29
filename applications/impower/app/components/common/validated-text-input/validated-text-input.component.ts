/* tslint:disable:component-selector */
import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

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

  constructor() { }

  hasErrors() : boolean {
    const control = this.parentForm.get(this.valueName);
    return (control.dirty || control.touched) && (control.errors != null) && (this.validationMessage != null);
  }
}
