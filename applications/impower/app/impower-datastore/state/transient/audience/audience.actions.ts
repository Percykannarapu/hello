import { Update } from '@ngrx/entity';
import { Action } from '@ngrx/store';
import { Audience } from './audience.model';

export enum AudienceActionTypes {
  LoadAudiences                      = '[Audience] Load Audiences',
  AddAudience                        = '[Audience] Add Audience',
  UpsertAudience                     = '[Audience] Upsert Audience',
  AddAudiences                       = '[Audience] Add Audiences',
  UpsertAudiences                    = '[Audience] Upsert Audiences',
  UpdateAudience                     = '[Audience] Update Audience',
  UpdateAudiences                    = '[Audience] Update Audiences',
  DeleteAudience                     = '[Audience] Delete Audience',
  DeleteAudiences                    = '[Audience] Delete Audiences',
  ClearAudiences                     = '[Audience] Clear Audiences',

  MoveAudienceUp                     = '[Audience] Move audience sequence up',
  MoveAudienceDn                     = '[Audience] Move audience sequence down',
}

export class LoadAudiences implements Action {
  readonly type = AudienceActionTypes.LoadAudiences;
  constructor(public payload: { audiences: Audience[] }) {}
}

export class AddAudience implements Action {
  readonly type = AudienceActionTypes.AddAudience;
  constructor(public payload: { audience: Audience }) {}
}

export class UpsertAudience implements Action {
  readonly type = AudienceActionTypes.UpsertAudience;
  constructor(public payload: { audience: Audience }) {}
}

export class AddAudiences implements Action {
  readonly type = AudienceActionTypes.AddAudiences;
  constructor(public payload: { audiences: Audience[] }) {}
}

export class UpsertAudiences implements Action {
  readonly type = AudienceActionTypes.UpsertAudiences;
  constructor(public payload: { audiences: Audience[] }) {}
}

export class UpdateAudience implements Action {
  readonly type = AudienceActionTypes.UpdateAudience;
  constructor(public payload: { audience: Update<Audience> }) {}
}

export class UpdateAudiences implements Action {
  readonly type = AudienceActionTypes.UpdateAudiences;
  constructor(public payload: { audiences: Update<Audience>[] }) {}
}

export class DeleteAudience implements Action {
  readonly type = AudienceActionTypes.DeleteAudience;
  constructor(public payload: { id: string }) {}
}

export class DeleteAudiences implements Action {
  readonly type = AudienceActionTypes.DeleteAudiences;
  constructor(public payload: { ids: string[] }) {}
}

export class ClearAudiences implements Action {
  readonly type = AudienceActionTypes.ClearAudiences;
}

export class MoveAudienceUp implements Action {
  readonly type = AudienceActionTypes.MoveAudienceUp;
  constructor(public payload: {audienceIdentifier: string}) {}
}

export class MoveAudienceDn implements Action {
  readonly type = AudienceActionTypes.MoveAudienceDn;
  constructor(public payload: {audienceIdentifier: string}) {}
}

export type AudienceActions =
    LoadAudiences
  | AddAudience
  | UpsertAudience
  | AddAudiences
  | UpsertAudiences
  | UpdateAudience
  | UpdateAudiences
  | DeleteAudience
  | DeleteAudiences
  | ClearAudiences
  | MoveAudienceUp
  | MoveAudienceDn
  ;
