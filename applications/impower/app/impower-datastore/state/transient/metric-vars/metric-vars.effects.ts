import { Injectable } from '@angular/core';
import { Actions, createEffect, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { isEmpty, isNotNil } from '@val/common';
import { ValMetricsService } from 'app/services/app-metrics.service';
import { of } from 'rxjs';
import { catchError, filter, map, mergeMap, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { AppLoggingService } from '../../../../services/app-logging.service';
import { AppStateService } from '../../../../services/app-state.service';
import { FullAppState } from '../../../../state/app.interfaces';
import { AudienceFetchService } from '../../../services/audience-fetch.service';
import { fetchableAudiences } from '../audience/audience.selectors';
import { FetchMapVarsComplete } from '../map-vars/map-vars.actions';
import { geoTransactionId } from '../transactions/transactions.reducer';
import { MetricVarActions, MetricVarActionTypes, FetchMetricVarsComplete, FetchMetricVarsFailed } from './metric-vars.action';
import { getMetricVars } from './metric-vars.selectors';

@Injectable({ providedIn: 'root' })
export class MetricVarsEffects {

  fetch$ = createEffect(() => this.actions$.pipe(
    ofType(MetricVarActionTypes.FetchMetricVars),
    withLatestFrom(this.store$.select(fetchableAudiences), this.appStateService.analysisLevel$, this.store$.select(geoTransactionId)),
    filter(([action, , analysisLevel, txId]) => !isEmpty(action.payload.audiences) && isNotNil(txId) && !isEmpty(analysisLevel)),
    mergeMap(([action, allAudiences, analysisLevel, txId]) => this.audienceService.getCachedAudienceData(action.payload.audiences, allAudiences, analysisLevel, txId, true).pipe(
      map(metricVars => new FetchMetricVarsComplete({ metricVars })),
      catchError(err => of(new FetchMetricVarsFailed({ err })))
    ))
  ));

  logError$ = createEffect(() => this.actions$.pipe(
    ofType(MetricVarActionTypes.FetchMetricVarsFailed),
    tap(action => this.logger.error.log('There was an error fetching map data', action.payload.err))
  ), { dispatch: false });

  /*@Effect()
  fetchMetricVarsComplete$ = this.actions$.pipe(
    ofType(MetricVarActionTypes.FetchMetricVarsComplete),
    withLatestFrom(this.store$.select(getMetricVars)),
    map((metricVars) => console.log('fetch metric vars complete', metricVars))
  );*/

  constructor(private actions$: Actions<MetricVarActions>,
    private logger: AppLoggingService,
    private appStateService: AppStateService,
    private audienceService: AudienceFetchService,
    private appMetricService: ValMetricsService,
    private store$: Store<FullAppState>) {}

}