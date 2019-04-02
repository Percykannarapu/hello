import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, concatMap, map, switchMap, tap } from 'rxjs/operators';
import { AppMapService } from '../../services/app-map.service';
import { ApplicationStartup, GetMapData, MapSetupComplete, MapSetupFailed, SharedActions, SharedActionTypes } from './shared.actions';
import { StartBusyIndicator } from '@val/messaging';
import { AppConfig } from '../../../app.config';

@Injectable()
export class SharedEffects {

  @Effect()
  applicationStartup$ = this.actions$.pipe(
    ofType<ApplicationStartup>(SharedActionTypes.ApplicationStartup),
    switchMap(action => this.appMapService.setupApplication(action.payload.analysisLevel).pipe(
      map(() => new MapSetupComplete({ groupId: action.payload.groupId, mediaPlanId: action.payload.mediaPlanId })),
      catchError(err => of(new MapSetupFailed({ err })))
    ))
  );

  @Effect()
  mapSetupComplete$ = this.actions$.pipe(
    ofType<MapSetupComplete>(SharedActionTypes.MapSetupComplete),
    tap(() => this.appMapService.updateLabelExpressions(false)),
    concatMap(action => [
      new StartBusyIndicator({ key: this.config.ApplicationBusyKey, message: 'Loading Media Plan...' }),
      new GetMapData({ ...action.payload })
    ])
  );

  constructor(private actions$: Actions<SharedActions>,
              private appMapService: AppMapService,
              private config: AppConfig) {}

}
