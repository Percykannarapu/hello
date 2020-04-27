import { Action } from '@ngrx/store';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintTradeArea } from '../../val-modules/targeting/models/ImpGeofootprintTradeArea';

export enum RenderingActionTypes {
  RenderTradeAreas = '[Rendering] Render All Trade Areas',
  RenderAudienceTradeAreas = '[Rendering] Render Audience TAs',
  RenderRadiusTradeAreas = '[Rendering] Render Radius TAs',

  RenderLocations = '[Rendering] Render Locations',
}

export class RenderTradeAreas implements Action {
  readonly type = RenderingActionTypes.RenderTradeAreas;
  constructor(public payload: { tradeAreas: ImpGeofootprintTradeArea[] }) {}
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

export type RenderingActions =
  RenderTradeAreas |
  RenderAudienceTradeAreas |
  RenderRadiusTradeAreas |
  RenderLocations
  ;
