import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'val-confirmation-ui',
  templateUrl: './confirmation-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmationDialogComponent {

  @Input() isVisible: boolean;

  // This is a workaround for a PrimeNg bug where dialogs aren't firing onHide() properly
  public get dialogVisible() : boolean { return this.isVisible; }
  public set dialogVisible(newValue: boolean) {
    if (newValue !== this.isVisible && newValue === false) {
      this.closed.emit();
    }
    this.isVisible = newValue;
  }
  @Input() title: string;
  @Input() message: string;
  @Input() acceptLabel: string;
  @Input() rejectLabel: string;
  @Input() canBeClosed: boolean;

  @Output() closed = new EventEmitter();
  @Output() accepted = new EventEmitter();
  @Output() rejected = new EventEmitter();

}
