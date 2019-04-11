import { Action } from '@ngrx/store';
import { ImpGeofootprintTradeArea } from '../../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { TradeAreaMergeTypeCodes } from '../../val-modules/targeting/targeting.enums';

export enum RenderingActionTypes {
  RenderTradeAreas = '[Rendering] Render All Trade Areas',
  ClearTradeAreas = '[Rendering] Clear All Trade Areas',

  RenderAudienceTradeAreas = '[Rendering] Render Audience TAs',
  RenderRadiusTradeAreas = '[Rendering] Render Radius TAs'
}

export class RenderTradeAreas implements Action {
  readonly type = RenderingActionTypes.RenderTradeAreas;
  constructor(public payload: { audienceTradeAreas: ImpGeofootprintTradeArea[], radiusTradeAreas: ImpGeofootprintTradeArea[], mergeType: TradeAreaMergeTypeCodes }) {}
}

export class ClearTradeAreas implements Action {
  readonly type = RenderingActionTypes.ClearTradeAreas;
}

export class RenderAudienceTradeAreas implements Action {
  readonly type = RenderingActionTypes.RenderAudienceTradeAreas;
  constructor(public payload: { tradeAreas: ImpGeofootprintTradeArea[] }) {}
}

export class RenderRadiusTradeAreas implements Action {
  readonly type = RenderingActionTypes.RenderRadiusTradeAreas;
  constructor(public payload: { tradeAreas: ImpGeofootprintTradeArea[], mergeType: TradeAreaMergeTypeCodes }) {}
}

export type RenderingActions =
  RenderTradeAreas |
  ClearTradeAreas |
  RenderAudienceTradeAreas |
  RenderRadiusTradeAreas
  ;
