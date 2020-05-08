import { Inject, Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { groupByExtended, skipUntilNonZeroBecomesZero } from '@val/common';
import { EsriAppSettings, EsriAppSettingsToken, EsriPoiService, selectors } from '@val/esri';
import { StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { concatMap, filter, map, tap, withLatestFrom } from 'rxjs/operators';
import { AppStateService } from '../../services/app-state.service';
import { PoiRenderingService } from '../../services/poi-rendering.service';
import { TradeAreaTypeCodes } from '../../val-modules/targeting/targeting.enums';
import { FullAppState } from '../app.interfaces';
import { ClearTradeAreas, RenderAudienceTradeAreas, RenderAudienceTradeAreasComplete, RenderingActionTypes, RenderLocations, RenderRadiusTradeAreas, RenderRadiusTradeAreasComplete, RenderTradeAreas } from './rendering.actions';
import { RenderingService } from './rendering.service';
import { prepareAudienceTradeAreas, prepareRadiusTradeAreas } from './trade-area.transform';

@Injectable()
export class RenderingEffects {

  renderingKey = 'TRADE_AREA_RENDERING';

  // Trade areas
  tradeAreaSplit$ = this.actions$.pipe(
    ofType<RenderTradeAreas>(RenderingActionTypes.RenderTradeAreas),
    withLatestFrom(this.store$.pipe(select(selectors.getMapReady))),
    filter(([, mapReady]) => mapReady),
    map(([action]) => groupByExtended(action.payload.tradeAreas, ta => TradeAreaTypeCodes.parse(ta.taType))),
  );

  @Effect()
  tradeAreaClear$ = this.tradeAreaSplit$.pipe(
    map(typeMap => typeMap.size),
    skipUntilNonZeroBecomesZero(),
    map(() => new ClearTradeAreas())
  );

  @Effect({ dispatch: false })
  clearTradeAreas$ = this.actions$.pipe(
    ofType(RenderingActionTypes.ClearTradeAreas),
    tap(() => this.renderingService.clearTradeAreas())
  );

  @Effect()
  tradeAreaRender$ = this.tradeAreaSplit$.pipe(
    filter(typeMap => typeMap.size > 0 && ((typeMap.get(TradeAreaTypeCodes.Radius) || []).length > 0 || (typeMap.get(TradeAreaTypeCodes.Audience) || []).length > 0)),
    concatMap(typeMap => [
      new StartBusyIndicator({ key: this.renderingKey, message: 'Rendering Trade Area Rings...' }),
      new RenderRadiusTradeAreas({ tradeAreas: typeMap.get(TradeAreaTypeCodes.Radius) }),
      new RenderAudienceTradeAreas({ tradeAreas: typeMap.get(TradeAreaTypeCodes.Audience) })
    ])
  );

  @Effect()
  renderRadii$ = this.actions$.pipe(
    ofType<RenderRadiusTradeAreas>(RenderingActionTypes.RenderRadiusTradeAreas),
    filter(action => action.payload.tradeAreas != null && action.payload.tradeAreas.length > 0),
    withLatestFrom(this.appStateService.currentProject$),
    map(([action, currentProject]) => prepareRadiusTradeAreas(action.payload.tradeAreas, currentProject, this.esriSettings.defaultSpatialRef)),
    concatMap(definitions => this.renderingService.renderTradeAreas(definitions)),
    concatMap(() => [
      new RenderRadiusTradeAreasComplete(),
      new StopBusyIndicator({ key: this.renderingKey })
    ])
  );

  @Effect()
  autoCompleteRadii$ = this.actions$.pipe(
    ofType<RenderRadiusTradeAreas>(RenderingActionTypes.RenderRadiusTradeAreas),
    filter(action => action.payload.tradeAreas == null || action.payload.tradeAreas.length === 0),
    map(() => new RenderRadiusTradeAreasComplete())
  );

  @Effect()
  renderAudience$ = this.actions$.pipe(
    ofType<RenderAudienceTradeAreas>(RenderingActionTypes.RenderAudienceTradeAreas),
    filter(action => action.payload.tradeAreas != null &&  action.payload.tradeAreas.length > 0),
    withLatestFrom(this.appStateService.currentProject$),
    map(([action, currentProject]) => prepareAudienceTradeAreas(action.payload.tradeAreas, currentProject, this.esriSettings.defaultSpatialRef)),
    concatMap(definitions => this.renderingService.renderTradeAreas(definitions)),
    concatMap(() => [
      new RenderAudienceTradeAreasComplete(),
      new StopBusyIndicator({ key: this.renderingKey })
    ])
  );

  @Effect()
  autoCompleteAudience$ = this.actions$.pipe(
    ofType<RenderAudienceTradeAreas>(RenderingActionTypes.RenderAudienceTradeAreas),
    filter(action => action.payload.tradeAreas == null || action.payload.tradeAreas.length === 0),
    map(() => new RenderAudienceTradeAreasComplete())
  );

  // Locations

  @Effect({ dispatch: false })
  renderLocations$ = this.actions$.pipe(
    ofType<RenderLocations>(RenderingActionTypes.RenderLocations),
    filter(action => action.payload.locations != null),
    withLatestFrom(this.store$.select(selectors.getMapReady), this.esriPoiService.allPoiConfigurations$),
    filter(([, mapReady]) => mapReady),
    map(([action, , configs]) => [action.payload.locations, configs] as const),
    tap(([locations, configs]) => this.poiRenderingService.renderSites(locations, configs))
  );

  constructor(private actions$: Actions,
              private store$: Store<FullAppState>,
              @Inject(EsriAppSettingsToken) private esriSettings: EsriAppSettings,
              private appStateService: AppStateService,
              private poiRenderingService: PoiRenderingService,
              private esriPoiService: EsriPoiService,
              private renderingService: RenderingService) {}
}
