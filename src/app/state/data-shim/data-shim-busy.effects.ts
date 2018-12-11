import { Injectable } from '@angular/core';
import { StartBusyIndicator, StopBusyIndicator } from '../../messaging';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { DataShimActionTypes, ProjectLoad } from './data-shim.actions';
import { filter, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DataShimBusyEffects {

  @Effect()
  projectSaving$ = this.actions$.pipe(
    ofType(DataShimActionTypes.ProjectSaveAndNew, DataShimActionTypes.ProjectSaveAndLoad, DataShimActionTypes.ProjectSaveAndReload),
    map(() => new StartBusyIndicator({ key: this.busyKey, message: 'Saving Project' }))
  );

  @Effect()
  projectLoading$ = this.actions$.pipe(
    ofType<ProjectLoad>(DataShimActionTypes.ProjectLoad),
    filter(action => !action.payload.isReload),
    map(action => new StartBusyIndicator({ key: this.busyKey, message: `Loading Project ${action.payload.projectId}`}))
  );

  @Effect()
  stopConditions$ = this.actions$.pipe(
    ofType(DataShimActionTypes.ProjectSaveSuccess, DataShimActionTypes.ProjectSaveFailure, DataShimActionTypes.ProjectLoadSuccess, DataShimActionTypes.ProjectLoadFailure, DataShimActionTypes.ProjectCreateNewComplete),
    map(() => new StopBusyIndicator({ key: this.busyKey }))
  );

  private busyKey = 'DataShimBusyIndicator';

  constructor(private actions$: Actions) {}
}
