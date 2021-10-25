import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ControlContainer, FormGroup } from '@angular/forms';

@Component({
  selector: 'val-radius-entry',
  templateUrl: './radius-entry.component.html'
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

  hasError(errorCode: string) : boolean {
    return this.currentRoot.hasError(errorCode, 'radius');
  }

  getError(errorCode: string) : string {
    return this.currentRoot.getError(errorCode, 'radius')[errorCode];
  }
}
