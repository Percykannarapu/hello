import { ActionCreator, createAction, props } from '@ngrx/store';

export interface NotificationProps {
  message: string;
  notificationTitle?: string;
  sticky?: boolean;
  life?: number;
}

export interface ErrorProps extends NotificationProps {
  additionalErrorInfo?: any;
}

export function isErrorNotification(p: any) : p is ReturnType<typeof ErrorNotification> {
  return p.hasOwnProperty('type') && p.type === '[Messaging - Notification] Show Error';
}

export const ErrorNotification = createAction(
  '[Messaging - Notification] Show Error',
  props<ErrorProps>()
);

export const WarningNotification = createAction(
  '[Messaging - Notification] Show Warning',
  props<NotificationProps>()
);

export const InfoNotification = createAction(
  '[Messaging - Notification] Show Info',
  props<NotificationProps>()
);

export const SuccessNotification = createAction(
  '[Messaging - Notification] Show Success',
  props<NotificationProps>()
);

export const HideAllNotifications = createAction(
  '[Messaging - Notification] Hide All'
);

export const ClearNotifications = createAction(
  '[Messaging - Notification] Clear',
  props<{ ids?: string[] }>()
);
