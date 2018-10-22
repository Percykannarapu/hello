import { Actions, Effect, ofType } from '@ngrx/effects';
import { MessagingActionTypes, ErrorNotification, SuccessNotification, WarningNotification, StartSpinner, StopSpinner } from './messaging.actions';
import { tap } from 'rxjs/operators';
import { AppMessagingService } from '../../services/app-messaging.service';
import { Injectable } from '@angular/core';

@Injectable()
export class MessagingEffects {

  @Effect({ dispatch: false })
  errorNotifier$ = this.actions$.pipe(
    ofType<ErrorNotification>(MessagingActionTypes.ErrorNotification),
    tap(action => this.messagingService.showErrorNotification(action.payload.toastTitle, action.payload.message))
  );

  @Effect({ dispatch: false })
  warnNotifier$ = this.actions$.pipe(
    ofType<WarningNotification>(MessagingActionTypes.WarningNotification),
    tap(action => this.messagingService.showWarningNotification(action.payload.toastTitle, action.payload.message))
  );

  @Effect({ dispatch: false })
  successNotifier$ = this.actions$.pipe(
    ofType<SuccessNotification>(MessagingActionTypes.SuccessNotification),
    tap(action => this.messagingService.showSuccessNotification(action.payload.toastTitle, action.payload.message))
  );

  @Effect({ dispatch: false })
  handleStartSpinner$ = this.actions$.pipe(
    ofType<StartSpinner>(MessagingActionTypes.StartSpinner),
    tap(action => this.messagingService.startSpinnerDialog(action.payload.key, action.payload.message))
  );

  @Effect({ dispatch: false })
  handleStopSpinner$ = this.actions$.pipe(
    ofType<StopSpinner>(MessagingActionTypes.StopSpinner),
    tap(action => this.messagingService.stopSpinnerDialog(action.payload.key))
  );

  constructor(private actions$: Actions,
              private messagingService: AppMessagingService) { }

}
