import { Inject, Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { groupByExtended } from '@val/common';
import { EsriAppSettings, EsriAppSettingsToken, selectors } from '@val/esri';
import { concatMap, filter, map, tap, withLatestFrom } from 'rxjs/operators';
import { AppRendererService } from '../../services/app-renderer.service';
import { AppStateService } from '../../services/app-state.service';
import { TradeAreaTypeCodes } from '../../val-modules/targeting/targeting.enums';
import { FullAppState } from '../app.interfaces';
import { prepareLocations } from './location.transform';
import { ClearLocations, ClearTradeAreas, RenderAudienceTradeAreas, RenderingActionTypes, RenderLocations, RenderRadiusTradeAreas, RenderTradeAreas } from './rendering.actions';
import { RenderingService } from './rendering.service';
import { prepareAudienceTradeAreas, prepareRadiusTradeAreas } from './trade-area.transform';

@Injectable()
export class RenderingEffects {

  tradeAreaSplit$ = this.actions$.pipe(
    ofType<RenderTradeAreas>(RenderingActionTypes.RenderTradeAreas),
    withLatestFrom(this.store$.pipe(select(selectors.getMapReady))),
    filter(([, mapReady]) => mapReady),
    map(([action]) => groupByExtended(action.payload.tradeAreas, ta => TradeAreaTypeCodes.parse(ta.taType))),
    // withLatestFrom(this.store$.pipe(select(getRenderingSlice))),
    // filter(([typeMap, counts]) => (typeMap.get(TradeAreaTypeCodes.Radius) || []).length !== counts.lastRadiusRenderCount || (typeMap.get(TradeAreaTypeCodes.Audience) || []).length !== counts.lastAudienceRenderCount),
    // map(([typeMap]) => typeMap)
  );

  @Effect()
  tradeAreaClear$ = this.tradeAreaSplit$.pipe(
    filter(typeMap => typeMap.size === 0),
    map(() => new ClearTradeAreas())
  );

  @Effect()
  tradeAreaRender$ = this.tradeAreaSplit$.pipe(
    filter(typeMap => typeMap.size > 0),
    concatMap(typeMap => [
      new ClearTradeAreas(),
      new RenderRadiusTradeAreas({ tradeAreas: typeMap.get(TradeAreaTypeCodes.Radius) }),
      new RenderAudienceTradeAreas({ tradeAreas: typeMap.get(TradeAreaTypeCodes.Audience) })
    ])
  );

  @Effect({ dispatch: false })
  renderLocations$ = this.actions$.pipe(
    ofType<RenderLocations>(RenderingActionTypes.RenderLocations),
    withLatestFrom(this.store$.pipe(select(selectors.getMapReady))),
    filter(([action, mapReady]) => mapReady && action.payload.locations.length > 0),
    map(([action]) => prepareLocations(action.payload.locations, action.payload.impProjectPrefs)),
    tap(definitions => this.renderingService.renderLocations(definitions))
  );

  @Effect({ dispatch: false })
  clearTradeAreas$ = this.actions$.pipe(
    ofType(RenderingActionTypes.ClearTradeAreas),
    tap(() => this.renderingService.clearTradeAreas())
  );

  @Effect({ dispatch: false })
  clearLocations$ = this.actions$.pipe(
    ofType<ClearLocations>(RenderingActionTypes.ClearLocations),
    tap(action => this.renderingService.clearLocations(action.payload.type))
  );

  @Effect({ dispatch: false })
  renderRadii$ = this.actions$.pipe(
    ofType<RenderRadiusTradeAreas>(RenderingActionTypes.RenderRadiusTradeAreas),
    filter(action => action.payload.tradeAreas != null &&  action.payload.tradeAreas.length > 0),
    withLatestFrom(this.appStateService.currentProject$),
    map(([action, currentProject]) => prepareRadiusTradeAreas(action.payload.tradeAreas, currentProject, this.esriSettings.defaultSpatialRef)),
    tap(definitions => this.renderingService.renderTradeAreas(definitions))
  );

  @Effect({ dispatch: false })
  renderAudience$ = this.actions$.pipe(
    ofType<RenderAudienceTradeAreas>(RenderingActionTypes.RenderAudienceTradeAreas),
    filter(action => action.payload.tradeAreas != null &&  action.payload.tradeAreas.length > 0),
    withLatestFrom(this.appStateService.currentProject$),
    map(([action, currentProject]) => prepareAudienceTradeAreas(action.payload.tradeAreas, currentProject, this.esriSettings.defaultSpatialRef)),
    tap(definitions => this.renderingService.renderTradeAreas(definitions))
  );

  constructor(private actions$: Actions,
              private store$: Store<FullAppState>,
              @Inject(EsriAppSettingsToken) private esriSettings: EsriAppSettings,
              private appStateService: AppStateService,
              private renderingService: RenderingService,
              private appRenderingService: AppRendererService) {}
}
