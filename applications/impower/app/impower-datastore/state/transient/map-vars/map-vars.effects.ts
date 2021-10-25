import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { isEmpty, isNotNil } from '@val/common';
import { of } from 'rxjs';
import { catchError, filter, map, mergeMap, tap, withLatestFrom } from 'rxjs/operators';
import { AppLoggingService } from '../../../../services/app-logging.service';
import { AppStateService } from '../../../../services/app-state.service';
import { FullAppState } from '../../../../state/app.interfaces';
import { AudienceFetchService } from '../../../services/audience-fetch.service';
import { fetchableAudiences } from '../audience/audience.selectors';
import { FetchMapVarsComplete, FetchMapVarsFailed, MapVarActions, MapVarActionTypes } from './map-vars.actions';

@Injectable({ providedIn: 'root' })
export class MapVarsEffects {

  fetch$ = createEffect(() => this.actions$.pipe(
    ofType(MapVarActionTypes.FetchMapVars),
    withLatestFrom(this.store$.select(fetchableAudiences), this.appStateService.analysisLevel$),
    filter(([action, , analysisLevel]) => !isEmpty(action.payload.audiences) && isNotNil(action.payload.txId) && !isEmpty(analysisLevel)),
    mergeMap(([action, allAudiences, analysisLevel]) => this.audienceService.getCachedAudienceData(action.payload.audiences, allAudiences, analysisLevel, action.payload.txId, true).pipe(
      map(mapVars => new FetchMapVarsComplete({ mapVars })),
      catchError(err => of(new FetchMapVarsFailed({ err })))
    ))
  ));

  logError$ = createEffect(() => this.actions$.pipe(
    ofType(MapVarActionTypes.FetchMapVarsFailed),
    tap(action => this.logger.error.log('There was an error fetching map data', action.payload.err))
  ), { dispatch: false });

  constructor(private actions$: Actions<MapVarActions>,
              private logger: AppLoggingService,
              private appStateService: AppStateService,
              private audienceService: AudienceFetchService,
              private store$: Store<FullAppState>) {}
}
