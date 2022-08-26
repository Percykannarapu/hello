import { Injectable } from '@angular/core';
import { NotificationProvider } from '@val/messaging';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class AppMessagingService implements NotificationProvider {

  constructor(private toastService: MessageService) { }

  public showErrorNotification(message: string, title: string = 'Error', sticky: boolean = false, life: number = 8000) : void {
    this.addMessage('error', title, message, sticky, life);
  }

  public showWarningNotification(message: string, title: string = 'Warning', sticky: boolean = false, life: number = 8000) : void {
    this.addMessage('warn', title, message, sticky, life);
  }

  public showSuccessNotification(message: string, title: string = 'Success', sticky: boolean = false, life: number = 8000) : void {
    this.addMessage('success', title, message, sticky, life);
  }

  public showInfoNotification(message: string, title: string = 'Information', sticky: boolean = false, life: number = 8000) : void {
    this.addMessage('info', title, message, sticky, life);
  }

  hideAllNotifications() : void {
    this.toastService.clear();
  }

  private addMessage(severity: 'info' | 'success' | 'warn' | 'error', summary: string, detail: string, sticky: boolean, life: number) : void {
    this.toastService.add({ severity, summary, detail, sticky, life });
  }
}
