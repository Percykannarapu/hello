import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { AppActionTypes } from './app.actions';
import { AppStateService } from '../services/app-state.service';
import { tap } from 'rxjs/operators';

@Injectable()
export class AppEffects {

  @Effect()
  clearUI$ = this.actions$.pipe(
    ofType(AppActionTypes.ClearUI),
    tap(() => this.appStateService.clearUserInterface())
  );

  constructor(private actions$: Actions,
              private appStateService: AppStateService) { }

}
