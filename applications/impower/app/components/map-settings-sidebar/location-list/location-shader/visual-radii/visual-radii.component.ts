import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { FormGroup, ControlContainer } from '@angular/forms';
import { isConvertibleToInteger, isString } from '@val/common';

@Component({
  selector: 'val-visual-radii',
  templateUrl: './visual-radii.component.html',
  styleUrls: ['./visual-radii.component.scss']
})
export class VisualRadiiComponent implements OnInit {

  @Input() readonly: boolean;
  @Input() tabIndex: number;
  @Input() showAddNew: boolean;
  @Input() showDelete: boolean;

  @Output() addNewClicked = new EventEmitter<void>();
  @Output() deleteClicked = new EventEmitter<void>();

  currentRoot: FormGroup;

  get radiusIdentifier() : number {
    return this.controlContainer != null && isConvertibleToInteger(this.controlContainer.name)
      ? Number(this.controlContainer.name) + 1
      : 0;
  }

  constructor(private controlContainer: ControlContainer) { }

  ngOnInit() {
    this.currentRoot = this.controlContainer.control as FormGroup;
  }

  getValidationMessage() : string {
    const errorObject = this.currentRoot == null ? null : this.currentRoot.get('radius').errors;
    if (errorObject == null || (this.currentRoot != null && this.currentRoot.get('radius').untouched)) {
      return null;
    } else {
      const validationErrors: string[] = Object.values(errorObject).filter(v => isString(v));
      return validationErrors.join('<br/>');
    }
  }

}
