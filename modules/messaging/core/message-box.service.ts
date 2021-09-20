import { Inject, Injectable, InjectionToken } from '@angular/core';
import { PrimeIcons } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { MessageBoxComponent } from '../components/message-box/message-box.component';

export const DialogServiceToken = new InjectionToken('DialogService');

export interface MessageBoxData {
  message: string | string[];
  icon: string;
  acceptText: string;
  rejectText?: string;
  buttonCount: 1 | 2;
}

export interface MessageBoxServiceConfig {
  data?: MessageBoxData;
  header?: string;
  footer?: string;
  width?: string;
  height?: string;
  closeOnEscape?: boolean;
  baseZIndex?: number;
  autoZIndex?: boolean;
  dismissableMask?: boolean;
  rtl?: boolean;
  style?: any;
  contentStyle?: any;
  styleClass?: string;
  transitionOptions?: string;
  closable?: boolean;
  showHeader?: boolean;
  modal?: boolean;
}

@Injectable()
export class MessageBoxService {

  public messageIsOpen$ = new BehaviorSubject<boolean>(false);

  constructor(@Inject(DialogServiceToken) private dialogService: DialogService) { }

  public showDeleteConfirmModal(message: string | string[], header: string = 'Delete Confirmation', icon: string = PrimeIcons.TRASH, acceptText: string = 'Yes', rejectText: string = 'No') : Observable<boolean> {
    return this.showTwoButtonModal(message, header, icon, acceptText, rejectText);
  }

  public showTwoButtonModal(message: string | string[], header: string, icon: string = PrimeIcons.QUESTION_CIRCLE, acceptText: string = 'OK', rejectText: string = 'Cancel') : Observable<boolean> {
    const config: MessageBoxServiceConfig = {
      header,
      modal: true,
      closable: false,
      closeOnEscape: false,
      width: '25vw',
      data: {
        message,
        icon,
        acceptText,
        rejectText,
        buttonCount: 2
      }
    };
    return this.showMessageBox(config);
  }

  public showSingleButtonModal(message: string | string[], header: string, icon: string = PrimeIcons.QUESTION_CIRCLE, acceptText: string = 'OK') : Observable<boolean> {
    const config: MessageBoxServiceConfig = {
      header,
      modal: true,
      closable: false,
      closeOnEscape: false,
      width: '25vw',
      data: {
        message,
        icon,
        acceptText,
        buttonCount: 1
      }
    };
    return this.showMessageBox(config);
  }

  public showMessageBox(configuration: MessageBoxServiceConfig) : Observable<boolean> {
    this.messageIsOpen$.next(true);
    const ref = this.dialogService.open(MessageBoxComponent, configuration);

    return ref.onClose.pipe(
      tap(() => this.messageIsOpen$.next(false)),
      map(result => result ?? false),
    );
  }
}
