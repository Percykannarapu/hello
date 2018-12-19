import { Action } from '@ngrx/store';

export enum MessagingActionTypes {
  ErrorNotification = '[Messaging - Notification] Show Error',
  WarningNotification = '[Messaging - Notification] Show Warning',
  InfoNotification = '[Messaging - Notification] Show Info',
  SuccessNotification = '[Messaging - Notification] Show Success',
  ClearAllNotifications = '[Messaging - Notification] Clear All',
}

abstract class NotificationBase implements Action {
  abstract type: string;
  constructor(public payload: { message: string, notificationTitle?: string, sticky?: boolean }){}
}

export class ErrorNotification extends NotificationBase {
  readonly type = MessagingActionTypes.ErrorNotification;
  constructor(payload: { message: string, notificationTitle?: string, sticky?: boolean, additionalErrorInfo?: any }) {
    super(payload);
  }
}

export class WarningNotification extends NotificationBase {
  readonly type = MessagingActionTypes.WarningNotification;
}

export class InfoNotification extends NotificationBase {
  readonly type = MessagingActionTypes.InfoNotification;
}

export class SuccessNotification extends NotificationBase {
  readonly type = MessagingActionTypes.SuccessNotification;
}

export class ClearAllNotifications implements Action {
  readonly type = MessagingActionTypes.ClearAllNotifications;
}
