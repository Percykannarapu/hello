import { Action } from '@ngrx/store';

export enum AppActionTypes {
  ClearUI = '[Application] Clear UI'
}

export class ClearUI implements Action {
    readonly type = AppActionTypes.ClearUI;
}

