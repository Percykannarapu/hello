import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { FullAppState } from '../../../state/app.interfaces';
import { ImpowerLoaderService } from '../../services/impower-loader.service';
import { persistentSlice } from '../impower-datastore.selectors';
import { EntityCreateSuccessful, EntityLoadFailure, EntityLoadSuccessful, LoadEntitiesFromServer, PersistentActionTypes } from './persistent.actions';

@Injectable()
export class PersistentEffects {

  @Effect()
  loadEntities$ = this.actions$.pipe(
    ofType<LoadEntitiesFromServer>(PersistentActionTypes.LoadEntitiesFromServer),
    switchMap(action => this.impowerLoader.loadFullProject(action.payload.projectId).pipe(
      map(fuseResult => this.impowerLoader.normalizeProject(fuseResult)),
      map(normalizedEntities => new EntityLoadSuccessful({ normalizedEntities })),
      catchError(err => of(new EntityLoadFailure({ err })))
    )),
  );

  @Effect()
  newEntities$ = this.actions$.pipe(
    ofType(PersistentActionTypes.CreateNewEntities),
    map(() => this.impowerLoader.createNewProject()),
    map(normalizedEntities => new EntityCreateSuccessful({ normalizedEntities }))
  );

  @Effect({ dispatch: false })
  saveEntities$ = this.actions$.pipe(
    ofType(PersistentActionTypes.SaveEntitiesToServer),
    withLatestFrom(this.store$.pipe(select(persistentSlice))),
    map(([action, datastore]) => this.impowerLoader.denormalizeProject(datastore)),
    // switchMap(project => this.impowerLoader.saveFullProject(project).pipe(
    //   map(projectId => new EntitySaveSuccessful({ projectId })),
    //   catchError(err => of(new EntitySaveFailure({ err })))
    // )),
  );

  constructor(private actions$: Actions,
              private store$: Store<FullAppState>,
              private impowerLoader: ImpowerLoaderService) {
  }
}
