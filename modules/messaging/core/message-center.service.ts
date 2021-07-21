import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { ClearNotifications } from '../state/message-center/message-center.actions';
import { AppState, MessageCenterData } from '../state/messaging.interfaces';
import { getMessageCount, getMessageData } from '../state/messaging.selectors';

@Injectable()
export class MessageCenterService {

  constructor(private store$: Store<AppState>) {}

  getMessageCount() : Observable<number> {
    return this.store$.select(getMessageCount);
  }

  getMessages() : Observable<MessageCenterData[]> {
    return this.store$.select(getMessageData);
  }

  clearMessages(ids?: string[]) : void {
    this.store$.dispatch(ClearNotifications({ ids }));
  }
}
