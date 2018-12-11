import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { ImpProjectState } from '../../models/imp-project-state';

export enum ImpProjectActionTypes {
  UpdateImpProject = '[ImpProject Entity] Update ImpProject',
}

export class UpdateImpProject implements Action {
  readonly type = ImpProjectActionTypes.UpdateImpProject;

  constructor(public payload: { impProject: Update<ImpProjectState> }) {}
}

export type ImpProjectActions = UpdateImpProject;
