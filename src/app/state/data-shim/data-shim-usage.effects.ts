import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { DataShimActionTypes, ProjectLoadSuccess, ProjectSaveSuccess } from './data-shim.actions';
import { map } from 'rxjs/operators';
import { CreateProjectUsageMetric } from '../usage/targeting-usage.actions';

@Injectable({ providedIn: 'root' })
export class DataShimUsageEffects {
  @Effect()
  saveUsage$ = this.actions$.pipe(
    ofType<ProjectSaveSuccess>(DataShimActionTypes.ProjectSaveSuccess),
    map(action => new CreateProjectUsageMetric('project', 'save', null, action.payload.projectId))
  );

  @Effect()
  newUsage$ = this.actions$.pipe(
    ofType(DataShimActionTypes.ProjectCreateNewComplete),
    map(() => new CreateProjectUsageMetric('project', 'create'))
  );

  @Effect()
  loadUsage$ = this.actions$.pipe(
    ofType<ProjectLoadSuccess>(DataShimActionTypes.ProjectLoadSuccess),
    map(action => new CreateProjectUsageMetric('project', 'load', null, action.payload.projectId))
  );

  constructor(private actions$: Actions) {}
}
