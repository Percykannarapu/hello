import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { ErrorNotification, SuccessNotification } from '@val/messaging';
import { of } from 'rxjs';
import { catchError, debounceTime, filter, map, switchMap, take, withLatestFrom } from 'rxjs/operators';
import { AppStateService } from '../../services/app-state.service';
import { BatchMapService } from '../../services/batch-map.service';
import { UserService } from '../../services/user.service';
import { LocalAppState } from '../app.interfaces';
import { DataShimActionTypes } from '../data-shim/data-shim.actions';
import { getTypedBatchQueryParams } from '../shared/router.interfaces';
import { BatchMapActions, BatchMapActionTypes, MoveToSite, SiteMoved } from './batch-map.actions';
import { getBatchMapReady, getBatchMode } from './batch-map.selectors';

@Injectable({ providedIn: 'root' })
export class BatchMapEffects {

  @Effect()
  createBatchMap$ = this.actions$.pipe(
    ofType(BatchMapActionTypes.CreateBatchMap),
    withLatestFrom(this.appStateService.currentProject$),
    filter(([, project]) => this.batchMapService.validateProjectReadiness(project, this.userService.userHasGrants(['IMPOWER_PDF_FULL']))),
    switchMap(([action, project]) => this.batchMapService.requestBatchMap(action.payload.templateFields, project).pipe(
      map(response => SuccessNotification({ notificationTitle: 'Batch Map', message: `The Batch Map is processing, id ${response.results[0].result.jobId}`})),
      catchError(e => of(ErrorNotification({ notificationTitle: 'Batch Map', message: 'There was an error requesting the Batch Map', additionalErrorInfo: e})))
    ))
  );

  @Effect()
  batchModeProjectLoad$ = this.actions$.pipe(
    ofType(DataShimActionTypes.ProjectLoadFinish),
    withLatestFrom(this.store$.select(getBatchMode)),
    filter(([, batchMode]) => batchMode),
    withLatestFrom(this.store$.select(getTypedBatchQueryParams)),
    map(([, params]) => params.startingSite),
    map(siteNum => new MoveToSite({ siteNum: siteNum }))
  );

  @Effect()
  loadBatchMaps$ = this.actions$.pipe(
    ofType(BatchMapActionTypes.MoveToSite),
    withLatestFrom(this.appStateService.currentProject$, this.store$.select(getTypedBatchQueryParams)),
    filter(([, project]) => project != null && project.projectId != null),
    switchMap(([action, project, query]) => this.batchMapService.startBatchMaps(project, action.payload.siteNum, query)),
    switchMap((payload) => this.store$.select(getBatchMapReady).pipe(
      debounceTime(50),
      filter(ready => ready),
      take(1),
      map(() => new SiteMoved(payload))
    )),
  );

  constructor(private actions$: Actions<BatchMapActions>,
              private store$: Store<LocalAppState>,
              private appStateService: AppStateService,
              private batchMapService: BatchMapService,
              private userService: UserService) {}

}
