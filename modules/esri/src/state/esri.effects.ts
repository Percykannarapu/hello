import { Injectable } from '@angular/core';
import { Effect } from '@ngrx/effects';
import { defer, of } from 'rxjs';
import { InitializeApi } from './api/esri.api.actions';

@Injectable()
export class EsriEffects {
  @Effect()
  init$ = defer(() => {
    return of(new InitializeApi());
  });
}
