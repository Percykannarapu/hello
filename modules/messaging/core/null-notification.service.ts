import { Injectable } from '@angular/core';
import { NotificationProvider } from './notification-provider.interface';

@Injectable()
export class NullNotificationService implements NotificationProvider {

  constructor() { }

  clearAllNotifications() : void {
  }

  showErrorNotification(message: string, title?: string, sticky?: boolean) : void {
  }

  showInfoNotification(message: string, title?: string, sticky?: boolean) : void {
  }

  showSuccessNotification(message: string, title?: string, sticky?: boolean) : void {
  }

  showWarningNotification(message: string, title?: string, sticky?: boolean) : void {
  }

}
