import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { TargetAudiencePref } from '../../../val-modules/mediaexpress/models/TargetAudiencePref';

export enum TargetAudienceActionTypes {
  LoadTargetAudiences = '[TargetAudience] Load TargetAudiences',
  AddTargetAudience = '[TargetAudience] Add TargetAudience',
  UpsertTargetAudience = '[TargetAudience] Upsert TargetAudience',
  AddTargetAudiences = '[TargetAudience] Add TargetAudiences',
  UpsertTargetAudiences = '[TargetAudience] Upsert TargetAudiences',
  UpdateTargetAudience = '[TargetAudience] Update TargetAudience',
  UpdateTargetAudiences = '[TargetAudience] Update TargetAudiences',
  DeleteTargetAudience = '[TargetAudience] Delete TargetAudience',
  DeleteTargetAudiences = '[TargetAudience] Delete TargetAudiences',
  ClearTargetAudiences = '[TargetAudience] Clear TargetAudiences'
}

export class LoadTargetAudiences implements Action {
  readonly type = TargetAudienceActionTypes.LoadTargetAudiences;

  constructor(public payload: { targetAudiences: TargetAudiencePref[] }) {}
}

export class AddTargetAudience implements Action {
  readonly type = TargetAudienceActionTypes.AddTargetAudience;

  constructor(public payload: { targetAudience: TargetAudiencePref }) {}
}

export class UpsertTargetAudience implements Action {
  readonly type = TargetAudienceActionTypes.UpsertTargetAudience;

  constructor(public payload: { targetAudience: TargetAudiencePref }) {}
}

export class AddTargetAudiences implements Action {
  readonly type = TargetAudienceActionTypes.AddTargetAudiences;

  constructor(public payload: { targetAudiences: TargetAudiencePref[] }) {}
}

export class UpsertTargetAudiences implements Action {
  readonly type = TargetAudienceActionTypes.UpsertTargetAudiences;

  constructor(public payload: { targetAudiences: TargetAudiencePref[] }) {}
}

export class UpdateTargetAudience implements Action {
  readonly type = TargetAudienceActionTypes.UpdateTargetAudience;

  constructor(public payload: { targetAudience: Update<TargetAudiencePref> }) {}
}

export class UpdateTargetAudiences implements Action {
  readonly type = TargetAudienceActionTypes.UpdateTargetAudiences;

  constructor(public payload: { targetAudiences: Update<TargetAudiencePref>[] }) {}
}

export class DeleteTargetAudience implements Action {
  readonly type = TargetAudienceActionTypes.DeleteTargetAudience;

  constructor(public payload: { id: string }) {}
}

export class DeleteTargetAudiences implements Action {
  readonly type = TargetAudienceActionTypes.DeleteTargetAudiences;

  constructor(public payload: { ids: string[] }) {}
}

export class ClearTargetAudiences implements Action {
  readonly type = TargetAudienceActionTypes.ClearTargetAudiences;
}

export type TargetAudienceActions =
 LoadTargetAudiences
 | AddTargetAudience
 | UpsertTargetAudience
 | AddTargetAudiences
 | UpsertTargetAudiences
 | UpdateTargetAudience
 | UpdateTargetAudiences
 | DeleteTargetAudience
 | DeleteTargetAudiences
 | ClearTargetAudiences;
