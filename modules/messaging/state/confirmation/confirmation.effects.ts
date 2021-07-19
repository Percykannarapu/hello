import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { ErrorNotification } from '../message-center/message-center.actions';
import { ConfirmationActionTypes, HideConfirmation } from './confirmation.actions';
import { catchError, filter, map, mergeMap, withLatestFrom } from 'rxjs/operators';
import { select, Store } from '@ngrx/store';
import { AppState } from '../messaging.interfaces';
import { confirmationAcceptResult, confirmationRejectResult } from '../messaging.selectors';
import { of, throwError } from 'rxjs';

@Injectable()
export class ConfirmationEffects {

  @Effect()
  processAccept$ = this.actions$.pipe(
    ofType(ConfirmationActionTypes.AcceptConfirmation),
    withLatestFrom(this.store$.pipe(select(confirmationAcceptResult))),
    map(([, result]) => result),
    map(acceptResult => {
      if (acceptResult == null) throwError('There was an error processing the accept action list');
      return Array.isArray(acceptResult) ? acceptResult : [acceptResult];
    }),
    mergeMap(actions => [...actions, new HideConfirmation()]),
    catchError(err => of(ErrorNotification({ message: err })))
  );

  @Effect()
  processReject$ = this.actions$.pipe(
    ofType(ConfirmationActionTypes.RejectConfirmation),
    withLatestFrom(this.store$.pipe(select(confirmationRejectResult))),
    map(([, result]) => result),
    filter(rejectResult => rejectResult != null),
    map(rejectResult => Array.isArray(rejectResult) ? rejectResult : [rejectResult]),
    mergeMap(actions => [...actions, new HideConfirmation()])
  );

  constructor(private actions$: Actions,
              private store$: Store<AppState>) {}
}
