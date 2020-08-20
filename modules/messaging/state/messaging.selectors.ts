import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AppState, MessagingState } from './messaging.interfaces';

const messagingStateSlice = createFeatureSelector<AppState, MessagingState>('messaging');

export const busySlice = createSelector(messagingStateSlice, state => state.busyIndicator);
export const showBusyIndicator = createSelector(busySlice, state => state.keys.length > 0);
export const busyIndicatorMessage = createSelector(busySlice, showBusyIndicator, (state, hasKey) => hasKey ? state.messages[state.keys[state.keys.length - 1]] : '');

export const confirmationSlice = createSelector(messagingStateSlice, state => state.confirmation);
export const confirmationAcceptResult = createSelector(confirmationSlice, state => state.acceptResult);
export const confirmationRejectResult = createSelector(confirmationSlice, state => state.rejectResult);

export const simpleMessageSlice = createSelector(messagingStateSlice, state => state.simpleMessage);
export const simpleMessageHeader = createSelector(simpleMessageSlice, state => state.header);
export const simpleMessageMessage = createSelector(simpleMessageSlice, state => state.message);
export const simpleMessageButton = createSelector(simpleMessageSlice, state => state.button);
export const simpleMessageDisplay = createSelector(simpleMessageSlice, state => state.display);
