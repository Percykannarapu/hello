import { ActionReducerMap } from '@ngrx/store';
import { busyReducer, BusyState } from './busyIndicator/busy.state';
import { confirmationReducer, ConfirmationState } from './confirmation/confirmation.reducer';
import { simpleMessageReducer, SimpleMessageState } from './simple-message/simple-message.state';

export interface AppState {
  messaging: MessagingState;
}

export interface MessagingState {
  busyIndicator: BusyState;
  confirmation: ConfirmationState;
  simpleMessage: SimpleMessageState;
}

export const messagingReducers: ActionReducerMap<MessagingState> = {
  busyIndicator: busyReducer,
  confirmation: confirmationReducer,
  simpleMessage: simpleMessageReducer,
};
