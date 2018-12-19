import { Component } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { LocalAppState } from '../../../state/app.interfaces';
import { HideConfirmation, AcceptConfirmation, selectors, RejectConfirmation } from '@val/messaging';
import { map } from 'rxjs/operators';

@Component({
  selector: 'val-confirmation-dialog',
  template: `<val-confirmation-ui (accepted)="onAccepted()" (rejected)="onRejected()" (closed)="onClosed()"
                      [isVisible]="visible$ | async"
                      [title]="title$ | async"
                      [message]="message$ | async"
                      [acceptLabel]="acceptLabel$ | async"
                      [rejectLabel]="rejectLabel$ | async"
                      [canBeClosed]="canBeClosed$ | async">
</val-confirmation-ui>`
})
export class ConfirmationContainerComponent {
  confirmation$ = this.store$.pipe(select(selectors.confirmationSlice));
  visible$ = this.confirmation$.pipe(map(c => c.isVisible));
  title$ = this.confirmation$.pipe(map(c => c.title));
  message$ = this.confirmation$.pipe(map(c => c.message));
  acceptLabel$ = this.confirmation$.pipe(map(c => c.acceptLabel));
  rejectLabel$ = this.confirmation$.pipe(map(c => c.rejectLabel));
  canBeClosed$ = this.confirmation$.pipe(map(c => c.explicitlyClosable));

  constructor(private store$: Store<LocalAppState>){}

  onClosed() {
    this.store$.dispatch(new HideConfirmation());
  }

  onAccepted() {
    this.store$.dispatch(new AcceptConfirmation());
  }

  onRejected() {
    this.store$.dispatch(new RejectConfirmation());
  }
}
