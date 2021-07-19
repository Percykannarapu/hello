import { busyIndicatorMessage, busySlice, confirmationSlice, showBusyIndicator, simpleMessageDisplay } from './state/messaging.selectors';

export { NotificationProvider } from './core/notification-provider.interface';
export { ErrorNotification, WarningNotification, InfoNotification, SuccessNotification, HideAllNotifications, isErrorNotification } from './state/message-center/message-center.actions';
export { ConfirmationPayload, ShowConfirmation, AcceptConfirmation, RejectConfirmation, HideConfirmation } from './state/confirmation/confirmation.actions';
export { StartBusyIndicator, StopBusyIndicator, StartLiveIndicator, StopLiveIndicator, CrashStopBusyIndicator } from './state/busyIndicator/busy.state';
export { ShowSimpleMessageBox } from './state/simple-message/simple-message.state';
export { AppState, MessageCenterData } from './state/messaging.interfaces';

export const selectors = {
  confirmationSlice,
  busySlice,
  showBusyIndicator,
  busyIndicatorMessage,
  simpleMessageDisplay
};

export { MessagingModule } from './messaging.module';
