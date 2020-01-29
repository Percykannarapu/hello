import { Action } from '@ngrx/store';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintTradeArea } from '../../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { SuccessfulLocationTypeCodes } from '../../val-modules/targeting/targeting.enums';

export enum RenderingActionTypes {
  RenderTradeAreas = '[Rendering] Render All Trade Areas',
  ClearTradeAreas = '[Rendering] Clear All Trade Areas',
  RenderAudienceTradeAreas = '[Rendering] Render Audience TAs',
  RenderRadiusTradeAreas = '[Rendering] Render Radius TAs',

  RenderLocations = '[Rendering] Render Locations',
  ClearLocations = '[Rendering] Clear Locations',
}

export class RenderTradeAreas implements Action {
  readonly type = RenderingActionTypes.RenderTradeAreas;
  constructor(public payload: { tradeAreas: ImpGeofootprintTradeArea[] }) {}
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
  constructor(public payload: { tradeAreas: ImpGeofootprintTradeArea[] }) {}
}

export class RenderLocations implements Action {
    readonly type = RenderingActionTypes.RenderLocations;
    constructor(public payload: { locations: ImpGeofootprintLocation[] }) {}
}

export class ClearLocations implements Action {
    readonly type = RenderingActionTypes.ClearLocations;
    constructor(public payload: { type: SuccessfulLocationTypeCodes }) {}
}

export type RenderingActions =
  RenderTradeAreas |
  ClearTradeAreas |
  RenderAudienceTradeAreas |
  RenderRadiusTradeAreas |
  RenderLocations |
  ClearLocations
  ;
