import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { ErrorNotification } from '@val/messaging';
import { map } from 'rxjs/operators';
import { definitionFetchFailure } from './audience-definitions.reducer';

@Injectable()
export class AudienceDefinitionsEffects {

  fetchFailureHandler$ = createEffect(() => this.actions$.pipe(
    ofType(definitionFetchFailure),
    map(action => new ErrorNotification({
        message: action.message,
        notificationTitle: 'Audience Fetch Error',
        additionalErrorInfo: action.err
      })
    )
  ));

  constructor(private actions$: Actions) {}

}
