/* tslint:disable:component-selector */
import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'boolean-input',
  templateUrl: './boolean-input.component.html',
  styleUrls: ['./boolean-input.component.scss']
})
export class BooleanInputComponent {

  @Input() parentForm: FormGroup;
  @Input() valueName: string;
  @Input() labelText: string;

  constructor() { }

}
