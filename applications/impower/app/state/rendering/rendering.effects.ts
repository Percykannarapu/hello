import { Inject, Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { groupByExtended, skipUntilNonZeroBecomesZero } from '@val/common';
import { EsriAppSettings, EsriAppSettingsToken, EsriPoiService, selectors } from '@val/esri';
import { StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { concatMap, filter, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { AppStateService } from '../../services/app-state.service';
import { PoiRenderingService } from '../../services/poi-rendering.service';
import { ImpClientLocationTypeCodes, TradeAreaTypeCodes } from '../../val-modules/targeting/targeting.enums';
import { FullAppState } from '../app.interfaces';
import { RenderAudienceTradeAreas, RenderingActionTypes, RenderLocations, RenderRadiusTradeAreas, RenderTradeAreas } from './rendering.actions';
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

  @Effect({ dispatch: false })
  tradeAreaClear$ = this.tradeAreaSplit$.pipe(
    map(typeMap => typeMap.size),
    skipUntilNonZeroBecomesZero(),
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
    map(() => new StopBusyIndicator({ key: this.renderingKey }))
  );

  @Effect()
  renderAudience$ = this.actions$.pipe(
    ofType<RenderAudienceTradeAreas>(RenderingActionTypes.RenderAudienceTradeAreas),
    filter(action => action.payload.tradeAreas != null &&  action.payload.tradeAreas.length > 0),
    withLatestFrom(this.appStateService.currentProject$),
    map(([action, currentProject]) => prepareAudienceTradeAreas(action.payload.tradeAreas, currentProject, this.esriSettings.defaultSpatialRef)),
    switchMap(definitions => this.renderingService.renderTradeAreas(definitions)),
    map(() => new StopBusyIndicator({ key: this.renderingKey }))
  );

  // Locations

  locationSplit$ = this.actions$.pipe(
    ofType<RenderLocations>(RenderingActionTypes.RenderLocations),
    filter(action => action.payload.locations.length > 0),
    map(action => groupByExtended(action.payload.locations, l => l.clientLocationTypeCode)),
    map(locMap => ([(locMap.get(ImpClientLocationTypeCodes.Site) || []), (locMap.get(ImpClientLocationTypeCodes.Competitor) || [])] as const))
  );

  @Effect({ dispatch: false })
  siteClear$ = this.locationSplit$.pipe(
    map(([sites]) => sites.length),
    skipUntilNonZeroBecomesZero(),
    tap(() => this.renderingService.clearLocations(ImpClientLocationTypeCodes.Site)),
  );

  @Effect({ dispatch: false })
  competitorClear$ = this.locationSplit$.pipe(
    map(([, competitors]) => competitors.length),
    skipUntilNonZeroBecomesZero(),
    tap(() => this.renderingService.clearLocations(ImpClientLocationTypeCodes.Competitor)),
  );

  @Effect({ dispatch: false })
  renderLocations$ = this.actions$.pipe(
    ofType<RenderLocations>(RenderingActionTypes.RenderLocations),
    filter(action => action.payload.locations.length > 0),
    withLatestFrom(this.store$.select(selectors.getMapReady), this.esriPoiService.allPoiConfigurations$),
    filter(([, mapReady]) => mapReady),
    map(([action, , configs]) => [action.payload.locations, configs] as const),
    concatMap(([locations, configs]) => this.poiRenderingService.renderSites(locations, configs)),
    filter(pois => pois.length > 0),
    map(pois => this.esriPoiService.updatePoiConfig(pois))
  );

  constructor(private actions$: Actions,
              private store$: Store<FullAppState>,
              @Inject(EsriAppSettingsToken) private esriSettings: EsriAppSettings,
              private appStateService: AppStateService,
              private poiRenderingService: PoiRenderingService,
              private esriPoiService: EsriPoiService,
              private renderingService: RenderingService) {}
}
