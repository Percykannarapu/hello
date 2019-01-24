import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { ImpGeofootprintMasterState } from '../../models/imp-geofootprint-master-state';

export enum ImpGeofootprintMasterActionTypes {
  UpdateImpGeofootprintMaster = '[ImpGeofootprintMaster Entity] Update ImpGeofootprintMaster',
}

export class UpdateImpGeofootprintMaster implements Action {
  readonly type = ImpGeofootprintMasterActionTypes.UpdateImpGeofootprintMaster;

  constructor(public payload: { impGeofootprintMaster: Update<ImpGeofootprintMasterState> }) {}
}

export type ImpGeofootprintMasterActions = UpdateImpGeofootprintMaster;
