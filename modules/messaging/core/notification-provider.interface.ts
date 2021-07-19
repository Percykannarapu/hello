import { InjectionToken } from '@angular/core';

export const NotificationProviderToken = new InjectionToken<NotificationProvider>('notification-provider-service');

export interface NotificationProvider {
  showErrorNotification(message: string, title?: string, sticky?: boolean, life?: number) : void;
  showWarningNotification(message: string, title?: string, sticky?: boolean, life?: number) : void;
  showInfoNotification(message: string, title?: string, sticky?: boolean, life?: number) : void;
  showSuccessNotification(message: string, title?: string, sticky?: boolean, life?: number) : void;
  hideAllNotifications() : void;
}
