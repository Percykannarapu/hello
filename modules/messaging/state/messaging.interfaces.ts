import { busyReducer, BusyState } from './busyIndicator/busy.state';
import { confirmationReducer, ConfirmationState } from './confirmation/confirmation.reducer';
import { ActionReducerMap } from '@ngrx/store';

export interface AppState {
  messaging: MessagingState;
}

export interface MessagingState {
  busyIndicator: BusyState;
  confirmation: ConfirmationState;
}

export const messagingReducers: ActionReducerMap<MessagingState> = {
  busyIndicator: busyReducer,
  confirmation: confirmationReducer
};
