import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AppState, MessagingState } from './messaging.interfaces';

const messagingStateSlice = createFeatureSelector<AppState, MessagingState>('messaging');

export const busySlice = createSelector(messagingStateSlice, state => state.busyIndicator);
export const showBusyIndicator = createSelector(busySlice, state => state.keys.length > 0);
export const busyIndicatorMessage = createSelector(busySlice, showBusyIndicator, (state, hasKey) => hasKey ? state.messages[state.keys[state.keys.length - 1]] : '');

const messageCenterSlice = createSelector(messagingStateSlice, state => state?.messageCenter);
export const getMessageData = createSelector(messageCenterSlice, state => state?.messageQueue ?? []);
export const getMessageCount = createSelector(messageCenterSlice, state => state?.messageQueue?.length ?? 0);
