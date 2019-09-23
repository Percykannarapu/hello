import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { ErrorNotification, SuccessNotification } from '@val/messaging';
import { of } from 'rxjs';
import { catchError, debounceTime, filter, map, switchMap, take, withLatestFrom } from 'rxjs/operators';
import { AppStateService } from '../../services/app-state.service';
import { BatchMapService } from '../../services/batch-map.service';
import { LocalAppState } from '../app.interfaces';
import { DataShimActionTypes } from '../data-shim/data-shim.actions';
import { BatchMapActions, BatchMapActionTypes, MoveToSite, SiteMoved } from './batch-map.actions';
import { getBatchMapReady, getBatchMode } from './batch-map.selectors';

@Injectable()
export class BatchMapEffects {

  @Effect()
  createBatchMap$ = this.actions$.pipe(
    ofType(BatchMapActionTypes.CreateBatchMap),
    withLatestFrom(this.appStateService.currentProject$),
    filter(([, project]) => this.batchMapService.validateProjectReadiness(project)),
    switchMap(([, project]) => this.batchMapService.requestBatchMap(project).pipe(
      map(() => new SuccessNotification({ notificationTitle: 'Batch Map', message: 'The Batch Map is processing...'})),
      catchError(e => of(new ErrorNotification({ notificationTitle: 'Batch Map', message: 'There was an error requesting the Batch Map', additionalErrorInfo: e})))
    ))
  );

  @Effect()
  batchModeProjectLoad$ = this.actions$.pipe(
    ofType(DataShimActionTypes.ProjectLoadFinish),
    withLatestFrom(this.store$.select(getBatchMode)),
    filter(([, batchMode]) => batchMode),
    map(() => new MoveToSite({ siteNum: null }))
  );

  @Effect()
  loadBatchMaps$ = this.actions$.pipe(
    ofType(BatchMapActionTypes.MoveToSite),
    withLatestFrom(this.appStateService.currentProject$),
    filter(([, project]) => project != null && project.projectId != null),
    switchMap(([action, project]) => this.store$.select(getBatchMapReady).pipe(
      debounceTime(500),
      filter(ready => ready),
      take(1),
      map(() => this.batchMapService.moveToSite(project, action.payload.siteNum)),
      map(payload => new SiteMoved(payload))
    )),
  );

  constructor(private actions$: Actions<BatchMapActions>,
              private store$: Store<LocalAppState>,
              private batchMapService: BatchMapService,
              private appStateService: AppStateService) {}

}
