import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { isEmpty } from '@val/common';
import { StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { of } from 'rxjs';
import { catchError, filter, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { AppLoggingService } from '../../../../services/app-logging.service';
import { AppStateService } from '../../../../services/app-state.service';
import { FullAppState } from '../../../../state/app.interfaces';
import { AudienceFetchService } from '../../../services/audience-fetch.service';
import { fetchableAudiences } from '../audience/audience.selectors';
import { FetchGeoVarsComplete, FetchGeoVarsFailed, GeoVarActions, GeoVarActionTypes } from './geo-vars.actions';

@Injectable({ providedIn: 'root' })
export class GeoVarsEffects {

  fetch$ = createEffect(() => this.actions$.pipe(
    ofType(GeoVarActionTypes.FetchGeoVars),
    withLatestFrom(this.store$.select(fetchableAudiences), this.appStateService.analysisLevel$),
    filter(([action, , analysisLevel]) => !isEmpty(action.payload.audiences) && action.payload.txId != null && !isEmpty(analysisLevel)),
    tap(() => this.store$.dispatch(new StartBusyIndicator({ key: this.key , message: 'Retrieving Audience Data for Grid' }) )),
    switchMap(([action, allAudiences, analysisLevel]) => this.audienceService.getCachedAudienceData(action.payload.audiences, allAudiences, analysisLevel, action.payload.txId, false).pipe(
      tap(() => this.store$.dispatch(new StopBusyIndicator({ key: this.key }))),
      map(geoVars => new FetchGeoVarsComplete({ geoVars })),
      catchError(err => of(new FetchGeoVarsFailed({ err })))
    ))
  ));

  logError$ = createEffect(() => this.actions$.pipe(
    ofType(GeoVarActionTypes.FetchGeoVarsFailed),
    tap(action => this.logger.error.log('There was an error fetching grid data', action.payload.err))
  ), { dispatch: false });

  private key = 'AUDIENCE_FETCH_SPINNER';

  constructor(private actions$: Actions<GeoVarActions>,
              private logger: AppLoggingService,
              private appStateService: AppStateService,
              private audienceService: AudienceFetchService,
              private store$: Store<FullAppState>) {}
}
