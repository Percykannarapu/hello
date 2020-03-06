import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ControlContainer, FormGroup } from '@angular/forms';
import { isString } from '@val/common';

@Component({
  selector: 'val-radius-entry',
  templateUrl: './radius-entry.component.html',
  styleUrls: ['./radius-entry.component.scss']
})
export class RadiusEntryComponent implements OnInit {
  get radiusIdentifier() : number {
    return this.currentRoot == null ? null : this.currentRoot.get('tradeAreaNumber').value;
  }

  @Input() readonly: boolean;
  @Input() tabIndex: number;
  @Input() showAddNew: boolean;
  @Input() showDelete: boolean;

  @Output() addNewClicked = new EventEmitter<void>();
  @Output() deleteClicked = new EventEmitter<void>();

  currentRoot: FormGroup;

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
