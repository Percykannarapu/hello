import { Action } from '@ngrx/store';

export enum AppActionTypes {
  ClearUI = '[Application] Clear UI',
  ChangeAnalysisLevel = '[Application] Change Analysis Level'
}

export class ClearUI implements Action {
    readonly type = AppActionTypes.ClearUI;
}

export class ChangeAnalysisLevel implements Action {
    readonly type = AppActionTypes.ChangeAnalysisLevel;
    constructor(public payload: { analysisLevel: string }) {}
}
