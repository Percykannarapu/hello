import { busyReducer, BusyState } from './busyIndicator/busy.state';
import { confirmationReducer, ConfirmationState } from './confirmation/confirmation.reducer';
import { ActionReducerMap } from '@ngrx/store';
import * as fromRoot from '../../../applications/impower/app/state/app.interfaces';

export interface AppState extends fromRoot.LocalAppState {
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
