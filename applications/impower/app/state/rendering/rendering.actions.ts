import { Action } from '@ngrx/store';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintTradeArea } from '../../val-modules/targeting/models/ImpGeofootprintTradeArea';

export enum RenderingActionTypes {
  RenderTradeAreas = '[Rendering] Render All Trade Areas',
  ClearTradeAreas = '[Rendering] Clear All Trade Areas',
  RenderAudienceTradeAreas = '[Rendering] Render Audience TAs',
  RenderAudienceTradeAreasComplete = '[Rendering] Render Audience TAs Complete',
  RenderRadiusTradeAreas = '[Rendering] Render Radius TAs',
  RenderRadiusTradeAreasComplete = '[Rendering] Render Radius TAs Complete',

  RenderLocations = '[Rendering] Render Locations',
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

export class RenderAudienceTradeAreasComplete implements Action {
  readonly type = RenderingActionTypes.RenderAudienceTradeAreasComplete;
}

export class RenderRadiusTradeAreas implements Action {
  readonly type = RenderingActionTypes.RenderRadiusTradeAreas;
  constructor(public payload: { tradeAreas: ImpGeofootprintTradeArea[] }) {}
}

export class RenderRadiusTradeAreasComplete implements Action {
  readonly type = RenderingActionTypes.RenderRadiusTradeAreasComplete;
}

export class RenderLocations implements Action {
    readonly type = RenderingActionTypes.RenderLocations;
    constructor(public payload: { locations: ImpGeofootprintLocation[] }) {}
}

export type RenderingActions =
  RenderTradeAreas |
  ClearTradeAreas |
  RenderAudienceTradeAreas |
  RenderAudienceTradeAreasComplete |
  RenderRadiusTradeAreas |
  RenderRadiusTradeAreasComplete |
  RenderLocations
  ;
