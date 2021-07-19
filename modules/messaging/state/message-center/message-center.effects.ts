import { Inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { tap } from 'rxjs/operators';
import { NotificationProvider, NotificationProviderToken } from '../../core/notification-provider.interface';
import { HideAllNotifications, ErrorNotification, InfoNotification, SuccessNotification, WarningNotification } from './message-center.actions';

@Injectable()
export class MessageCenterEffects {

  errorNotifier$ = createEffect(() => this.actions$.pipe(
    ofType(ErrorNotification),
    tap(a => this.notifications.showErrorNotification(a.message, a.notificationTitle, a.sticky, a.life)),
    tap(a => {
      if (a['additionalErrorInfo'] != null) {
        console.groupCollapsed('%cAdditional Error Info - ' + a.notificationTitle, 'color: red');
        console.error(a.message);
        console.error(a['additionalErrorInfo']);
        console.groupEnd();
      }
    })
  ), { dispatch: false });

  warnNotifier$ = createEffect(() => this.actions$.pipe(
    ofType(WarningNotification),
    tap(a => this.notifications.showWarningNotification(a.message, a.notificationTitle, a.sticky, a.life))
  ), { dispatch: false });

  infoNotifier$ = createEffect(() => this.actions$.pipe(
    ofType(InfoNotification),
    tap(a => this.notifications.showInfoNotification(a.message, a.notificationTitle, a.sticky, a.life))
  ), { dispatch: false });

  successNotifier$ = createEffect(() => this.actions$.pipe(
    ofType(SuccessNotification),
    tap(a => this.notifications.showSuccessNotification(a.message, a.notificationTitle, a.sticky, a.life))
  ), { dispatch: false });

  hideNotifications$ = createEffect(() => this.actions$.pipe(
    ofType(HideAllNotifications),
    tap(a => this.notifications.hideAllNotifications())
  ), { dispatch: false });

  constructor(private actions$: Actions,
              @Inject(NotificationProviderToken) private notifications: NotificationProvider) {}

}
