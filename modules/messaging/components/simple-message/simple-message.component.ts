import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppState } from '../../state/messaging.interfaces';
import { simpleMessageButton, simpleMessageDisplay, simpleMessageHeader, simpleMessageMessage } from '../../state/messaging.selectors';
import { HideSimpleMessageBox } from '../../state/simple-message/simple-message.state';

@Component({
  selector: 'val-simple-message',
  templateUrl: './simple-message.component.html',
  styleUrls: ['./simple-message.component.scss']
})
export class SimpleMessageComponent implements OnInit {

  showDialog: boolean = false;

  headerText$: Observable<string>;
  messageText$: Observable<string>;
  buttonText$: Observable<string>;
  showSimpleMessage$: Observable<boolean>;

  constructor(private store$: Store<AppState>) { }

  ngOnInit() : void {
    this.headerText$ = this.store$.select(simpleMessageHeader);
    this.messageText$ = this.store$.select(simpleMessageMessage);
    this.buttonText$ = this.store$.select(simpleMessageButton);
    this.showSimpleMessage$ = this.store$.select(simpleMessageDisplay).pipe(
      tap(show => this.showDialog = show)
    );
  }

  onClose() : void {
    this.store$.dispatch(new HideSimpleMessageBox());
  }

  closeDialog(evt: MouseEvent) : void {
    evt.stopPropagation();
    this.showDialog = false;
  }
}
