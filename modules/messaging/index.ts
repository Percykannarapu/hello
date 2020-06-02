import { busyIndicatorMessage, busySlice, confirmationSlice, showBusyIndicator } from './state/messaging.selectors';

export { NotificationProvider } from './core/notification-provider.interface';
export { MessagingActionTypes, ErrorNotification, WarningNotification, InfoNotification, SuccessNotification, ClearAllNotifications } from './state/messaging.actions';
export { ConfirmationPayload, ShowConfirmation, AcceptConfirmation, RejectConfirmation, HideConfirmation } from './state/confirmation/confirmation.actions';
export { StartBusyIndicator, StopBusyIndicator, StartLiveIndicator, StopLiveIndicator, CrashStopBusyIndicator } from './state/busyIndicator/busy.state';
export { AppState } from './state/messaging.interfaces';

export const selectors = {
  confirmationSlice,
  busySlice,
  showBusyIndicator,
  busyIndicatorMessage
};

export { MessagingModule } from './messaging.module';
