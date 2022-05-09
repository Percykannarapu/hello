import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { isEmpty, isNotNil } from '@val/common';
import { ValMetricsService } from 'app/services/app-metrics.service';
import { of } from 'rxjs';
import { catchError, filter, map, mergeMap, tap, withLatestFrom } from 'rxjs/operators';
import { AppLoggingService } from '../../../../services/app-logging.service';
import { AppStateService } from '../../../../services/app-state.service';
import { FullAppState } from '../../../../state/app.interfaces';
import { AudienceFetchService } from '../../../services/audience-fetch.service';
import { fetchableAudiences } from '../audience/audience.selectors';
import { geoTransactionId } from '../transactions/transactions.reducer';
import * as fromAction from './metric-vars.action';


@Injectable({ providedIn: 'root' })
export class MetricVarsEffects {

  fetch$ = createEffect(() => this.actions$.pipe(
    ofType(fromAction.FetchMetricVars),
    withLatestFrom(this.store$.select(fetchableAudiences), this.appStateService.analysisLevel$, this.store$.select(geoTransactionId)),
    filter(([action, , analysisLevel, txId]) => !isEmpty(action.audiences) && isNotNil(txId) && !isEmpty(analysisLevel)),
    mergeMap(([action, allAudiences, analysisLevel, txId]) => this.audienceService.getCachedAudienceData(action.audiences, allAudiences, analysisLevel, txId, true).pipe(
      map(metricVars => fromAction.FetchMetricVarsComplete({metricVars})),
      catchError(err => of(fromAction.FetchMetricVarsFailed({err})))
    ))
  ));

  logError$ = createEffect(() => this.actions$.pipe(
    ofType(fromAction.FetchMetricVarsFailed),
    tap(action => this.logger.error.log('There was an error fetching map data', action.err))
  ), { dispatch: false });

  /*@Effect()
  fetchMetricVarsComplete$ = this.actions$.pipe(
    ofType(MetricVarActionTypes.FetchMetricVarsComplete),
    withLatestFrom(this.store$.select(getMetricVars)),
    map((metricVars) => console.log('fetch metric vars complete', metricVars))
  );*/

  constructor(private actions$: Actions,
    private logger: AppLoggingService,
    private appStateService: AppStateService,
    private audienceService: AudienceFetchService,
    private appMetricService: ValMetricsService,
    private store$: Store<FullAppState>) {}

}
