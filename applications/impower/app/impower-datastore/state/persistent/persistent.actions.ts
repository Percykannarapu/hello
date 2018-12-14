import {Action} from '@ngrx/store';
import { NormalizedPayload } from '../../services/normalized-payload';

export enum PersistentActionTypes {
  LoadEntitiesFromServer = '[Persistent Entities] Load from Server',
  EntityLoadSuccessful = '[Persistent Entities] Load Successful',
  EntityLoadFailure = '[Persistent Entities] Load Failed',

  SaveEntitiesToServer = '[Persistent Entities] Save to Server',
  EntitySaveSuccessful = '[Persistent Entities] Save Successful',
  EntitySaveFailure = '[Persistent Entities] Save Failed',

  CreateNewEntities = '[Persistent Entities] Create New',
  EntityCreateSuccessful = '[Persistent Entities] Create New Successful',
}

export class LoadEntitiesFromServer implements Action {
  readonly type = PersistentActionTypes.LoadEntitiesFromServer;
  constructor(public payload: { projectId: number }) {}
}

export class EntityLoadSuccessful implements Action {
  readonly type = PersistentActionTypes.EntityLoadSuccessful;
  constructor(public payload: { normalizedEntities: NormalizedPayload }) {}
}

export class EntityLoadFailure implements Action {
  readonly type = PersistentActionTypes.EntityLoadFailure;
  constructor(public payload: { err: any }) {}
}

export class SaveEntitiesToServer implements Action {
  readonly type = PersistentActionTypes.SaveEntitiesToServer;
}

export class EntitySaveSuccessful implements Action {
  readonly type = PersistentActionTypes.EntitySaveSuccessful;
  constructor(public payload: { projectId: number }) {}
}

export class EntitySaveFailure implements Action {
  readonly type = PersistentActionTypes.EntitySaveFailure;
  constructor(public payload: { err: any }) {}
}

export class CreateNewEntities implements Action {
    readonly type = PersistentActionTypes.CreateNewEntities;
}

export class EntityCreateSuccessful implements Action {
    readonly type = PersistentActionTypes.EntityCreateSuccessful;
    constructor(public payload: { normalizedEntities: NormalizedPayload }) {}
}
