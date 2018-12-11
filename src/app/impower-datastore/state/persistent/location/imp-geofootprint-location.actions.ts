import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { ImpGeofootprintLocationState } from '../../models/imp-geofootprint-location-state';

export enum ImpGeofootprintLocationActionTypes {
  AddImpGeofootprintLocation = '[ImpGeofootprintLocation Entity] Add ImpGeofootprintLocation',
  AddImpGeofootprintLocations = '[ImpGeofootprintLocation Entity] Add ImpGeofootprintLocations',
  UpdateImpGeofootprintLocation = '[ImpGeofootprintLocation Entity] Update ImpGeofootprintLocation',
  UpdateImpGeofootprintLocations = '[ImpGeofootprintLocation Entity] Update ImpGeofootprintLocations',
  DeleteImpGeofootprintLocation = '[ImpGeofootprintLocation Entity] Delete ImpGeofootprintLocation',
  DeleteImpGeofootprintLocations = '[ImpGeofootprintLocation Entity] Delete ImpGeofootprintLocations',
  ClearImpGeofootprintLocations = '[ImpGeofootprintLocation Entity] Clear ImpGeofootprintLocations'
}

export class AddImpGeofootprintLocation implements Action {
  readonly type = ImpGeofootprintLocationActionTypes.AddImpGeofootprintLocation;

  constructor(public payload: { impGeofootprintLocation: ImpGeofootprintLocationState }) {}
}

export class AddImpGeofootprintLocations implements Action {
  readonly type = ImpGeofootprintLocationActionTypes.AddImpGeofootprintLocations;

  constructor(public payload: { impGeofootprintLocations: ImpGeofootprintLocationState[] }) {}
}

export class UpdateImpGeofootprintLocation implements Action {
  readonly type = ImpGeofootprintLocationActionTypes.UpdateImpGeofootprintLocation;

  constructor(public payload: { impGeofootprintLocation: Update<ImpGeofootprintLocationState> }) {}
}

export class UpdateImpGeofootprintLocations implements Action {
  readonly type = ImpGeofootprintLocationActionTypes.UpdateImpGeofootprintLocations;

  constructor(public payload: { impGeofootprintLocations: Update<ImpGeofootprintLocationState>[] }) {}
}

export class DeleteImpGeofootprintLocation implements Action {
  readonly type = ImpGeofootprintLocationActionTypes.DeleteImpGeofootprintLocation;

  constructor(public payload: { id: number }) {}
}

export class DeleteImpGeofootprintLocations implements Action {
  readonly type = ImpGeofootprintLocationActionTypes.DeleteImpGeofootprintLocations;

  constructor(public payload: { ids: number[] }) {}
}

export class ClearImpGeofootprintLocations implements Action {
  readonly type = ImpGeofootprintLocationActionTypes.ClearImpGeofootprintLocations;
}

export type ImpGeofootprintLocationActionsAffectingChildren =
  DeleteImpGeofootprintLocation
  | DeleteImpGeofootprintLocations
  | ClearImpGeofootprintLocations;

export type ImpGeofootprintLocationActionsAffectingParent =
  ImpGeofootprintLocationActionsAffectingChildren
  | AddImpGeofootprintLocation
  | AddImpGeofootprintLocations;

export type ImpGeofootprintLocationActions =
  ImpGeofootprintLocationActionsAffectingParent
  | UpdateImpGeofootprintLocation
  | UpdateImpGeofootprintLocations;
