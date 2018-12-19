import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { NotificationProvider } from '@val/messaging';

@Injectable()
export class AppMessagingService implements NotificationProvider {

  constructor(private toastService: MessageService) { }

  public showErrorNotification(message: string, title: string = 'Error', sticky: boolean = true) : void {
    this.toastService.add({ severity: 'error', summary: title, detail: message, sticky: sticky });
  }

  public showWarningNotification(message: string, title: string = 'Warning', sticky: boolean = true) : void {
    this.toastService.add({ severity: 'warn', summary: title, detail: message, sticky: sticky });
  }

  public showSuccessNotification(message: string, title: string = 'Success', sticky: boolean = true) : void {
    this.toastService.add({ severity: 'success', summary: title, detail: message, sticky: sticky });
  }

  public showInfoNotification(message: string, title: string = 'Information', sticky: boolean = true) : void {
    this.toastService.add({ severity: 'info', summary: title, detail: message, sticky: sticky });
  }

  clearAllNotifications() : void {
    this.toastService.clear();
  }
}
