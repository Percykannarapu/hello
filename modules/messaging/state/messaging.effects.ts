import { Inject, Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { tap } from 'rxjs/operators';
import { NotificationProvider, NotificationProviderToken } from '../core/notification-provider.interface';
import { ErrorNotification, InfoNotification, MessagingActionTypes, SuccessNotification, WarningNotification } from './messaging.actions';

@Injectable()
export class MessagingEffects {

  @Effect({ dispatch: false })
  errorNotifier$ = this.actions$.pipe(
    ofType<ErrorNotification>(MessagingActionTypes.ErrorNotification),
    tap(a => this.notifications.showErrorNotification(a.payload.message, a.payload.notificationTitle, a.payload.sticky)),
    tap(a => {
      if (a.payload['additionalErrorInfo'] != null) {
        console.groupCollapsed('%cAdditional Error Info - ' + a.payload.notificationTitle, 'color: red');
        console.error(a.payload.message, a.payload['additionalErrorInfo']);
        console.groupEnd();
      }
    })
  );

  @Effect({ dispatch: false })
  warnNotifier$ = this.actions$.pipe(
    ofType<WarningNotification>(MessagingActionTypes.WarningNotification),
    tap(a => this.notifications.showWarningNotification(a.payload.message, a.payload.notificationTitle, a.payload.sticky))
  );

  @Effect({ dispatch: false })
  infoNotifier$ = this.actions$.pipe(
    ofType<InfoNotification>(MessagingActionTypes.InfoNotification),
    tap(a => this.notifications.showInfoNotification(a.payload.message, a.payload.notificationTitle, a.payload.sticky, a.payload.life))
  );

  @Effect({ dispatch: false })
  successNotifier$ = this.actions$.pipe(
    ofType<SuccessNotification>(MessagingActionTypes.SuccessNotification),
    tap(a => this.notifications.showSuccessNotification(a.payload.message, a.payload.notificationTitle, a.payload.sticky))
  );

  @Effect({ dispatch: false })
  clearNotifications$ = this.actions$.pipe(
    ofType(MessagingActionTypes.ClearAllNotifications),
    tap(() => this.notifications.clearAllNotifications())
  );

  constructor(private actions$: Actions,
              @Inject(NotificationProviderToken) private notifications: NotificationProvider) { }
}
