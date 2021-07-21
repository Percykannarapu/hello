import { ActionReducerMap } from '@ngrx/store';
import { busyReducer, BusyState } from './busyIndicator/busy.state';
import { confirmationReducer, ConfirmationState } from './confirmation/confirmation.reducer';
import { messageCenterReducer, MessageCenterState } from './message-center/message-center.reducer';
import { simpleMessageReducer, SimpleMessageState } from './simple-message/simple-message.state';

export interface AppState {
  messaging: MessagingState;
}

export interface MessageCenterData {
  id: string;
  timeStamp: Date;
  severity: 'error' | 'warn' | 'info' | 'success';
  title: string;
  message: string;
  otherData?: any;
}

export interface MessagingState {
  busyIndicator: BusyState;
  confirmation: ConfirmationState;
  simpleMessage: SimpleMessageState;
  messageCenter: MessageCenterState;
}

export const messagingReducers: ActionReducerMap<MessagingState> = {
  busyIndicator: busyReducer,
  confirmation: confirmationReducer,
  simpleMessage: simpleMessageReducer,
  messageCenter: messageCenterReducer
};
