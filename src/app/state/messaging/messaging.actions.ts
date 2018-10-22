import { Action } from '@ngrx/store';

export enum MessagingActionTypes {
  ErrorNotification = '[Messaging] Error Notification',
  WarningNotification = '[Messaging] Warning Notification',
  SuccessNotification = '[Messaging] Success Notification',
  StartSpinner = '[Messaging] Start Spinner',
  StopSpinner = '[Messaging] Stop Spinner'
}

abstract class NotificationBase implements Action {
  abstract type: string;
  // noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
  constructor(public payload: { message: string, toastTitle: string }){}
}

export class ErrorNotification extends NotificationBase {
  readonly type = MessagingActionTypes.ErrorNotification;
}

export class WarningNotification extends NotificationBase {
  readonly type = MessagingActionTypes.WarningNotification;
}

export class SuccessNotification extends NotificationBase {
  readonly type = MessagingActionTypes.SuccessNotification;
}

export class StartSpinner implements Action {
  readonly type = MessagingActionTypes.StartSpinner;
  constructor(public payload: { key: string, message: string }){}
}

export class StopSpinner implements Action {
  readonly type = MessagingActionTypes.StopSpinner;
  constructor(public payload: { key: string }){}
}
