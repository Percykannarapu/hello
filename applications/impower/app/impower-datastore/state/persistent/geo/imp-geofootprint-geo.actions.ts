import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { ImpGeofootprintGeoState } from '../../models/imp-geofootprint-geo-state';

export enum ImpGeofootprintGeoActionTypes {
  AddImpGeofootprintGeo = '[ImpGeofootprintGeo] Add ImpGeofootprintGeo',
  AddImpGeofootprintGeos = '[ImpGeofootprintGeo] Add ImpGeofootprintGeos',
  UpdateImpGeofootprintGeo = '[ImpGeofootprintGeo] Update ImpGeofootprintGeo',
  UpdateImpGeofootprintGeos = '[ImpGeofootprintGeo] Update ImpGeofootprintGeos',
  DeleteImpGeofootprintGeo = '[ImpGeofootprintGeo] Delete ImpGeofootprintGeo',
  DeleteImpGeofootprintGeos = '[ImpGeofootprintGeo] Delete ImpGeofootprintGeos',
  ClearImpGeofootprintGeos = '[ImpGeofootprintGeo] Clear ImpGeofootprintGeos'
}

export class AddImpGeofootprintGeo implements Action {
  readonly type = ImpGeofootprintGeoActionTypes.AddImpGeofootprintGeo;

  constructor(public payload: { impGeofootprintGeo: ImpGeofootprintGeoState }) {}
}

export class AddImpGeofootprintGeos implements Action {
  readonly type = ImpGeofootprintGeoActionTypes.AddImpGeofootprintGeos;

  constructor(public payload: { impGeofootprintGeos: ImpGeofootprintGeoState[] }) {}
}

export class UpdateImpGeofootprintGeo implements Action {
  readonly type = ImpGeofootprintGeoActionTypes.UpdateImpGeofootprintGeo;

  constructor(public payload: { impGeofootprintGeo: Update<ImpGeofootprintGeoState> }) {}
}

export class UpdateImpGeofootprintGeos implements Action {
  readonly type = ImpGeofootprintGeoActionTypes.UpdateImpGeofootprintGeos;

  constructor(public payload: { impGeofootprintGeos: Update<ImpGeofootprintGeoState>[] }) {}
}

export class DeleteImpGeofootprintGeo implements Action {
  readonly type = ImpGeofootprintGeoActionTypes.DeleteImpGeofootprintGeo;

  constructor(public payload: { id: number }) {}
}

export class DeleteImpGeofootprintGeos implements Action {
  readonly type = ImpGeofootprintGeoActionTypes.DeleteImpGeofootprintGeos;

  constructor(public payload: { ids: number[] }) {}
}

export class ClearImpGeofootprintGeos implements Action {
  readonly type = ImpGeofootprintGeoActionTypes.ClearImpGeofootprintGeos;
}

export type ImpGeofootprintGeoActionsAffectingParent =
  | AddImpGeofootprintGeo
  | AddImpGeofootprintGeos
  | DeleteImpGeofootprintGeo
  | DeleteImpGeofootprintGeos
  | ClearImpGeofootprintGeos;


export type ImpGeofootprintGeoActions =
 ImpGeofootprintGeoActionsAffectingParent
 | AddImpGeofootprintGeos
 | UpdateImpGeofootprintGeo
 | UpdateImpGeofootprintGeos
 | DeleteImpGeofootprintGeo
 | DeleteImpGeofootprintGeos
 | ClearImpGeofootprintGeos;
