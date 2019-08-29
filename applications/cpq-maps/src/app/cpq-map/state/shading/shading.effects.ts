import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, concatMap, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { AppLayerService } from '../../services/app-layer-service';
import { AppMessagingService } from '../../services/app-messaging.service';
import { ShadingService } from '../../services/shading.service';
import { localSelectors } from '../app.selectors';
import { LocalState } from '../index';
import { SetAppReady } from '../shared/shared.actions';
import { InitializeVariableOptions, RenderShading, ShadingActions, ShadingActionTypes, SetClassBreakValues } from './shading.actions';

@Injectable()
export class ShadingEffects {

  @Effect()
  initialize$ = this.actions$.pipe(
    ofType(ShadingActionTypes.InitializeShading),
    withLatestFrom(this.store$.select(localSelectors.getRfpUiEditDetailEntities)),
    tap(() => this.appLayerService.setupLegend()),
    map(([, details]) => this.shadingService.initializeVariables(details)),
    concatMap((definitions) => [
      new InitializeVariableOptions({ definitions }),
      new RenderShading({ recreateLayer: true }),
      new SetAppReady(true)
    ])
  );

  @Effect({ dispatch: false })
  setMapShading = this.actions$.pipe(
    ofType(ShadingActionTypes.RenderShading),
    withLatestFrom(this.store$.select(localSelectors.getShadingState),
                   this.store$.select(localSelectors.getRfpUiEditEntities),
                   this.store$.select(localSelectors.getRfpUiEditDetailEntities),
                   this.store$.select(localSelectors.getSelectedAnalysisLevel)),
    switchMap(([action, shadingData, edits, details, analysisLevel]) => this.shadingService.setShader(analysisLevel, shadingData, edits, details, action.payload.recreateLayer).pipe(
      tap(graphics => this.appLayerService.initializeGraphicGroup(graphics, 'Shading', 'Selected Geos', true)),
      tap(() => this.appLayerService.setupAnneSoloLayers(shadingData.shadeAnne, shadingData.shadeSolo, 'Shading', analysisLevel)),
      catchError(err => {
        console.error(err);
        this.messagingService.showErrorNotification('There was an error retrieving shading data');
        return of(null);
      })
    ))
  );

  @Effect()
  render$ = this.actions$.pipe(
    ofType(ShadingActionTypes.SetNonVariableShading, ShadingActionTypes.SetVariableShading),
    map(() => new RenderShading({ recreateLayer: false }))
  );

  @Effect()
  calculateEqualIntervals = this.actions$.pipe(
    ofType(ShadingActionTypes.CalculateEqualIntervals),
    map(action => this.shadingService.calculateEqualIntervals(action.payload)),
    map(payload => new SetClassBreakValues(payload))
  );

  @Effect()
  changeAnneSoloShading$ = this.actions$.pipe(
    ofType(ShadingActionTypes.SetAnneShading, ShadingActionTypes.SetSoloShading),
    map(() => new RenderShading({ recreateLayer: false }))
  );

  constructor(private actions$: Actions<ShadingActions>,
              private store$: Store<LocalState>,
              private shadingService: ShadingService,
              private appLayerService: AppLayerService,
              private messagingService: AppMessagingService) {}

}
