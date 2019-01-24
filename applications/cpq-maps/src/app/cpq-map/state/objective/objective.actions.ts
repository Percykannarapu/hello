import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { Objective } from '../../../val-modules/mediaexpress/models/Objective';

export enum ObjectiveActionTypes {
  LoadObjectives = '[Objective] Load Objectives',
  AddObjective = '[Objective] Add Objective',
  UpsertObjective = '[Objective] Upsert Objective',
  AddObjectives = '[Objective] Add Objectives',
  UpsertObjectives = '[Objective] Upsert Objectives',
  UpdateObjective = '[Objective] Update Objective',
  UpdateObjectives = '[Objective] Update Objectives',
  DeleteObjective = '[Objective] Delete Objective',
  DeleteObjectives = '[Objective] Delete Objectives',
  ClearObjectives = '[Objective] Clear Objectives'
}

export class LoadObjectives implements Action {
  readonly type = ObjectiveActionTypes.LoadObjectives;

  constructor(public payload: { objectives: Objective[] }) {}
}

export class AddObjective implements Action {
  readonly type = ObjectiveActionTypes.AddObjective;

  constructor(public payload: { objective: Objective }) {}
}

export class UpsertObjective implements Action {
  readonly type = ObjectiveActionTypes.UpsertObjective;

  constructor(public payload: { objective: Objective }) {}
}

export class AddObjectives implements Action {
  readonly type = ObjectiveActionTypes.AddObjectives;

  constructor(public payload: { objectives: Objective[] }) {}
}

export class UpsertObjectives implements Action {
  readonly type = ObjectiveActionTypes.UpsertObjectives;

  constructor(public payload: { objectives: Objective[] }) {}
}

export class UpdateObjective implements Action {
  readonly type = ObjectiveActionTypes.UpdateObjective;

  constructor(public payload: { objective: Update<Objective> }) {}
}

export class UpdateObjectives implements Action {
  readonly type = ObjectiveActionTypes.UpdateObjectives;

  constructor(public payload: { objectives: Update<Objective>[] }) {}
}

export class DeleteObjective implements Action {
  readonly type = ObjectiveActionTypes.DeleteObjective;

  constructor(public payload: { id: string }) {}
}

export class DeleteObjectives implements Action {
  readonly type = ObjectiveActionTypes.DeleteObjectives;

  constructor(public payload: { ids: string[] }) {}
}

export class ClearObjectives implements Action {
  readonly type = ObjectiveActionTypes.ClearObjectives;
}

export type ObjectiveActions =
 LoadObjectives
 | AddObjective
 | UpsertObjective
 | AddObjectives
 | UpsertObjectives
 | UpdateObjective
 | UpdateObjectives
 | DeleteObjective
 | DeleteObjectives
 | ClearObjectives;
