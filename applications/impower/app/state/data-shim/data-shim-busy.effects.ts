import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { map } from 'rxjs/operators';
import { DataShimActionTypes, ProjectLoad } from './data-shim.actions';

@Injectable({
  providedIn: 'root'
})
export class DataShimBusyEffects {

  @Effect()
  projectSaving$ = this.actions$.pipe(
    ofType(DataShimActionTypes.ProjectSaveAndNew, DataShimActionTypes.ProjectSaveAndLoad, DataShimActionTypes.ProjectSave),
    map(() => new StartBusyIndicator({ key: this.busyKey, message: 'Saving Project' }))
  );

  @Effect()
  projectLoading$ = this.actions$.pipe(
    ofType<ProjectLoad>(DataShimActionTypes.ProjectLoad),
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
