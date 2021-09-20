import { ActionReducerMap } from '@ngrx/store';
import { busyReducer, BusyState } from './busyIndicator/busy.state';
import { messageCenterReducer, MessageCenterState } from './message-center/message-center.reducer';

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
  messageCenter: MessageCenterState;
}

export const messagingReducers: ActionReducerMap<MessagingState> = {
  busyIndicator: busyReducer,
  messageCenter: messageCenterReducer
};
