import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { NotificationProvider } from '@val/messaging';

@Injectable()
export class AppMessagingService implements NotificationProvider {

  constructor(private toastService: MessageService) { }

  public showErrorNotification(message: string, title: string = 'Error', sticky: boolean = false, life: number = 3000) : void {
    this.toastService.add({ severity: 'error', summary: title, detail: message, sticky: sticky, life: life });
  }

  public showWarningNotification(message: string, title: string = 'Warning', sticky: boolean = false, life: number = 3000) : void {
    this.toastService.add({ severity: 'warn', summary: title, detail: message, sticky: sticky, life: life });
  }

  public showSuccessNotification(message: string, title: string = 'Success', sticky: boolean = false, life: number = 3000) : void {
    this.toastService.add({ severity: 'success', summary: title, detail: message, sticky: sticky, life: life });
  }

  public showInfoNotification(message: string, title: string = 'Information', sticky: boolean = false, life: number = 3000) : void {
    this.toastService.add({ severity: 'info', summary: title, detail: message, sticky: sticky, life: life });
  }

  hideAllNotifications() : void {
    this.toastService.clear();
  }
}
