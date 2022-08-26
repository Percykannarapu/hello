import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { changeNetworkStatus } from '@val/esri';
import { map } from 'rxjs/operators';
import * as ApplicationStateActions from './application-state.actions';


@Injectable()
export class ApplicationStateEffects {

  // Notify the esri module of the network status change
  changeNetworkStatus$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ApplicationStateActions.setNetworkStatus),
      map(({ isOnline }) => changeNetworkStatus({ isOnline }))
    );
  });

  constructor(private actions$: Actions) {}

}
