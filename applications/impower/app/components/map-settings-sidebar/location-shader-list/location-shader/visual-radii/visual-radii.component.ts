import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ControlContainer, FormGroup } from '@angular/forms';
import { isConvertibleToInteger } from '@val/common';

@Component({
  selector: 'val-visual-radii',
  templateUrl: './visual-radii.component.html',
  styleUrls: ['./visual-radii.component.scss']
})
export class VisualRadiiComponent implements OnInit {

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

  hasError(errorCode: string) : boolean {
    return this.currentRoot.hasError(errorCode, 'radius');
  }

  getError(errorCode: string) : string {
    return this.currentRoot.getError(errorCode, 'radius')[errorCode];
  }
}
