import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { ImpGeofootprintTradeAreaState } from '../../models/imp-geofootprint-trade-area-state';

export enum ImpGeofootprintTradeAreaActionTypes {
  AddImpGeofootprintTradeArea = '[ImpGeofootprintTradeArea] Add ImpGeofootprintTradeArea',
  AddImpGeofootprintTradeAreas = '[ImpGeofootprintTradeArea] Add ImpGeofootprintTradeAreas',
  UpdateImpGeofootprintTradeArea = '[ImpGeofootprintTradeArea] Update ImpGeofootprintTradeArea',
  UpdateImpGeofootprintTradeAreas = '[ImpGeofootprintTradeArea] Update ImpGeofootprintTradeAreas',
  DeleteImpGeofootprintTradeArea = '[ImpGeofootprintTradeArea] Delete ImpGeofootprintTradeArea',
  DeleteImpGeofootprintTradeAreas = '[ImpGeofootprintTradeArea] Delete ImpGeofootprintTradeAreas',
  ClearImpGeofootprintTradeAreas = '[ImpGeofootprintTradeArea] Clear ImpGeofootprintTradeAreas'
}

export class AddImpGeofootprintTradeArea implements Action {
  readonly type = ImpGeofootprintTradeAreaActionTypes.AddImpGeofootprintTradeArea;

  constructor(public payload: { impGeofootprintTradeArea: ImpGeofootprintTradeAreaState }) {}
}

export class AddImpGeofootprintTradeAreas implements Action {
  readonly type = ImpGeofootprintTradeAreaActionTypes.AddImpGeofootprintTradeAreas;

  constructor(public payload: { impGeofootprintTradeAreas: ImpGeofootprintTradeAreaState[] }) {}
}

export class UpdateImpGeofootprintTradeArea implements Action {
  readonly type = ImpGeofootprintTradeAreaActionTypes.UpdateImpGeofootprintTradeArea;

  constructor(public payload: { impGeofootprintTradeArea: Update<ImpGeofootprintTradeAreaState> }) {}
}

export class UpdateImpGeofootprintTradeAreas implements Action {
  readonly type = ImpGeofootprintTradeAreaActionTypes.UpdateImpGeofootprintTradeAreas;

  constructor(public payload: { impGeofootprintTradeAreas: Update<ImpGeofootprintTradeAreaState>[] }) {}
}

export class DeleteImpGeofootprintTradeArea implements Action {
  readonly type = ImpGeofootprintTradeAreaActionTypes.DeleteImpGeofootprintTradeArea;

  constructor(public payload: { id: number }) {}
}

export class DeleteImpGeofootprintTradeAreas implements Action {
  readonly type = ImpGeofootprintTradeAreaActionTypes.DeleteImpGeofootprintTradeAreas;

  constructor(public payload: { ids: number[] }) {}
}

export class ClearImpGeofootprintTradeAreas implements Action {
  readonly type = ImpGeofootprintTradeAreaActionTypes.ClearImpGeofootprintTradeAreas;
}

export type ImpGeofootprintTradeAreaActionsAffectingChildren =
  DeleteImpGeofootprintTradeArea
  | DeleteImpGeofootprintTradeAreas
  | ClearImpGeofootprintTradeAreas;

export type ImpGeofootprintTradeAreaActionsAffectingParent =
  ImpGeofootprintTradeAreaActionsAffectingChildren
  | AddImpGeofootprintTradeArea
  | AddImpGeofootprintTradeAreas;

export type ImpGeofootprintTradeAreaActions =
  ImpGeofootprintTradeAreaActionsAffectingParent
  | UpdateImpGeofootprintTradeArea
  | UpdateImpGeofootprintTradeAreas;
