import { InjectionToken } from '@angular/core';

export const NotificationProviderToken = new InjectionToken<NotificationProvider>('notification-provider-service');

export interface NotificationProvider {
  showErrorNotification(message: string, title?: string, sticky?: boolean) : void;
  showWarningNotification(message: string, title?: string, sticky?: boolean) : void;
  showInfoNotification(message: string, title?: string, sticky?: boolean) : void;
  showSuccessNotification(message: string, title?: string, sticky?: boolean) : void;
  clearAllNotifications() : void;
}
