import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { Goal } from '../../../val-modules/mediaexpress/models/Goal';

export enum GoalActionTypes {
  LoadGoals = '[Goal] Load Goals',
  AddGoal = '[Goal] Add Goal',
  UpsertGoal = '[Goal] Upsert Goal',
  AddGoals = '[Goal] Add Goals',
  UpsertGoals = '[Goal] Upsert Goals',
  UpdateGoal = '[Goal] Update Goal',
  UpdateGoals = '[Goal] Update Goals',
  DeleteGoal = '[Goal] Delete Goal',
  DeleteGoals = '[Goal] Delete Goals',
  ClearGoals = '[Goal] Clear Goals'
}

export class LoadGoals implements Action {
  readonly type = GoalActionTypes.LoadGoals;

  constructor(public payload: { goals: Goal[] }) {}
}

export class AddGoal implements Action {
  readonly type = GoalActionTypes.AddGoal;

  constructor(public payload: { goal: Goal }) {}
}

export class UpsertGoal implements Action {
  readonly type = GoalActionTypes.UpsertGoal;

  constructor(public payload: { goal: Goal }) {}
}

export class AddGoals implements Action {
  readonly type = GoalActionTypes.AddGoals;

  constructor(public payload: { goals: Goal[] }) {}
}

export class UpsertGoals implements Action {
  readonly type = GoalActionTypes.UpsertGoals;

  constructor(public payload: { goals: Goal[] }) {}
}

export class UpdateGoal implements Action {
  readonly type = GoalActionTypes.UpdateGoal;

  constructor(public payload: { goal: Update<Goal> }) {}
}

export class UpdateGoals implements Action {
  readonly type = GoalActionTypes.UpdateGoals;

  constructor(public payload: { goals: Update<Goal>[] }) {}
}

export class DeleteGoal implements Action {
  readonly type = GoalActionTypes.DeleteGoal;

  constructor(public payload: { id: string }) {}
}

export class DeleteGoals implements Action {
  readonly type = GoalActionTypes.DeleteGoals;

  constructor(public payload: { ids: string[] }) {}
}

export class ClearGoals implements Action {
  readonly type = GoalActionTypes.ClearGoals;
}

export type GoalActions =
 LoadGoals
 | AddGoal
 | UpsertGoal
 | AddGoals
 | UpsertGoals
 | UpdateGoal
 | UpdateGoals
 | DeleteGoal
 | DeleteGoals
 | ClearGoals;
