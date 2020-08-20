import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { merge, of } from 'rxjs';
import { catchError, map, reduce, switchMap, tap } from 'rxjs/operators';
import { RestDataService } from '../../../../../val-modules/common/services/restdata.service';
import { fixupEntityId, OfflineAudienceResponse, OfflineCategoryResponse } from '../audience-definitions.model';
import { definitionFetchFailure } from '../audience-definitions.reducer';
import { fetchAudienceDefinitions, loadAudienceCategories, loadAudienceDefinitions } from './tda-audience.actions';

@Injectable()
export class TdaAudienceEffects {

  fetchCategories$ = createEffect(() => this.actions$.pipe(
    ofType(fetchAudienceDefinitions),
    switchMap(() => this.restService.get('v1/targeting/base/amtabledesc/search?q=amtabledesc').pipe(
      map(response => response.payload.rows as OfflineCategoryResponse[]),
      tap(categories => categories.forEach(category => fixupEntityId(category))),
      map(categories => loadAudienceCategories({ categories })),
      catchError(err => of(definitionFetchFailure({
        message: 'There was an error during retrieval of the Offline Audience descriptions. Please refresh your browser to try again.',
        err
      })))
    )),
  ));

  fetchDefinitions$ = createEffect(() => this.actions$.pipe(
    ofType(loadAudienceCategories),
    map(action => action.categories.map(category => this.restService.get(`v1/targeting/base/cldesctab/search?q=cldesctab&tablename=${category.tablename}&includeInImp=1`))),
    switchMap(apiCalls => merge(...apiCalls, 4).pipe(
      map(response => response.payload.rows as OfflineAudienceResponse[]),
      tap(definitions => definitions.forEach(def => fixupEntityId(def))),
      reduce((acc, result) => [...acc, ...result], [] as OfflineAudienceResponse[])
    )),
    map(definitions => loadAudienceDefinitions({ definitions }))
  ));

  constructor(private actions$: Actions,
              private restService: RestDataService) {}

}
