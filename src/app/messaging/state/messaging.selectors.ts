import { AppState, MessagingState } from './messaging.interfaces';
import { createFeatureSelector, createSelector } from '@ngrx/store';

const messagingStateSlice = createFeatureSelector<AppState, MessagingState>('messaging');

export const confirmationSlice = createSelector(messagingStateSlice, state => state.confirmation);

export const busySlice = createSelector(messagingStateSlice, state => state.busyIndicator);
export const showBusyIndicator = createSelector(busySlice, state => state.keys.length > 0);
export const busyIndicatorMessage = createSelector(busySlice, showBusyIndicator, (state, hasKey) => hasKey ? state.messages[state.keys[0]] : '');

export const confirmationAcceptResult = createSelector(confirmationSlice, state => state.acceptResult);
export const confirmationRejectResult = createSelector(confirmationSlice, state => state.rejectResult);
