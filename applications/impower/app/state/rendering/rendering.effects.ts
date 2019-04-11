import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { ClearTradeAreas, RenderAudienceTradeAreas, RenderingActionTypes, RenderRadiusTradeAreas, RenderTradeAreas } from './rendering.actions';
import { concatMap, map, tap } from 'rxjs/operators';
import { RenderingService } from '../../services/rendering.service';
import { filter } from 'rxjs/internal/operators/filter';

@Injectable()
export class RenderingEffects {

  @Effect()
  tradeAreaRender$ = this.actions$.pipe(
    ofType<RenderTradeAreas>(RenderingActionTypes.RenderTradeAreas),
    tap(() => console.log('Effect Fired')),
    concatMap(action => [
      new ClearTradeAreas(),
      new RenderRadiusTradeAreas({ tradeAreas: action.payload.radiusTradeAreas, mergeType: action.payload.mergeType }),
      new RenderAudienceTradeAreas({ tradeAreas: action.payload.audienceTradeAreas })
    ])
  );

  @Effect({ dispatch: false })
  clearTradeAreas$ = this.actions$.pipe(
    ofType(RenderingActionTypes.ClearTradeAreas),
    tap(() => this.renderingService.clearTradeAreas())
  );

  @Effect({ dispatch: false })
  renderRadii$ = this.actions$.pipe(
    ofType<RenderRadiusTradeAreas>(RenderingActionTypes.RenderRadiusTradeAreas),
    filter(action => action.payload.tradeAreas.length > 0),
    map(action => this.renderingService.prepareRadiusTradeAreas(action.payload.tradeAreas, action.payload.mergeType)),
    tap(definitions => this.renderingService.renderTradeAreas(definitions))
  );

  @Effect({ dispatch: false })
  renderAudience$ = this.actions$.pipe(
    ofType<RenderAudienceTradeAreas>(RenderingActionTypes.RenderAudienceTradeAreas),
    filter(action => action.payload.tradeAreas.length > 0),
    map(action => this.renderingService.prepareAudienceTradeAreas(action.payload.tradeAreas)),
    tap(definitions => this.renderingService.renderTradeAreas(definitions))
  );

  constructor(private actions$: Actions,
              private renderingService: RenderingService) {}
}
