import { Action } from '@ngrx/store';

export enum SharedActionTypes {
  SetGroupId = '[Shared Actions] Set Media Plan Group ID',
  SetAppReady = '[Shared Actions] Sett App Ready'
}

export class SetGroupId implements Action {
  readonly type = SharedActionTypes.SetGroupId;
  constructor(public payload: number) { }
}

export class SetAppReady implements Action {
  readonly type = SharedActionTypes.SetAppReady;
  constructor(public payload: boolean) { }
}

export type SharedActions =
  SetGroupId
  | SetAppReady;