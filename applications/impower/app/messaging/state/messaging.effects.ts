import { Actions, Effect, ofType } from '@ngrx/effects';
import { MessagingActionTypes, ErrorNotification, SuccessNotification, WarningNotification, InfoNotification } from './messaging.actions';
import { tap } from 'rxjs/operators';
import { Inject, Injectable } from '@angular/core';
import { NotificationProvider, NotificationProviderToken } from '..';
import { toPayload } from '@val/common';

@Injectable()
export class MessagingEffects {

  @Effect({ dispatch: false })
  errorNotifier$ = this.actions$.pipe(
    ofType<ErrorNotification>(MessagingActionTypes.ErrorNotification),
    toPayload(),
    tap(p => this.notifications.showErrorNotification(p.message, p.notificationTitle, p.sticky)),
    tap(p => {
      if (p['additionalErrorInfo'] != null) {
        console.groupCollapsed(p.notificationTitle);
        console.error(p.message, p['additionalErrorInfo']);
        console.groupEnd();
      }
    })
  );

  @Effect({ dispatch: false })
  warnNotifier$ = this.actions$.pipe(
    ofType<WarningNotification>(MessagingActionTypes.WarningNotification),
    toPayload(),
    tap(p => this.notifications.showWarningNotification(p.message, p.notificationTitle, p.sticky))
  );

  @Effect({ dispatch: false })
  infoNotifier$ = this.actions$.pipe(
    ofType<InfoNotification>(MessagingActionTypes.InfoNotification),
    toPayload(),
    tap(p => this.notifications.showInfoNotification(p.message, p.notificationTitle, p.sticky))
  );

  @Effect({ dispatch: false })
  successNotifier$ = this.actions$.pipe(
    ofType<SuccessNotification>(MessagingActionTypes.SuccessNotification),
    toPayload(),
    tap(p => this.notifications.showSuccessNotification(p.message, p.notificationTitle, p.sticky))
  );

  @Effect({ dispatch: false })
  clearNotifications$ = this.actions$.pipe(
    ofType(MessagingActionTypes.ClearAllNotifications),
    tap(() => this.notifications.clearAllNotifications())
  );

  constructor(private actions$: Actions,
              @Inject(NotificationProviderToken) private notifications: NotificationProvider) { }
}
