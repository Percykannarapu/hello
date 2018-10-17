import { Action } from '@ngrx/store';

export enum EsriApiActionTypes {
  InitializeApi = '[Esri] Initialize API',
  InitializeApiSuccess = '[Esri] Initialize Api Success',
  InitializeApiFailure = '[Esri] Initialize Api Failure',
}

export class InitializeApi implements Action {
  readonly type = EsriApiActionTypes.InitializeApi;
}

export class InitializeApiSuccess implements Action {
  readonly type = EsriApiActionTypes.InitializeApiSuccess;
}

export class InitializeApiFailure implements Action {
  readonly type = EsriApiActionTypes.InitializeApiFailure;
  constructor(public payload: { errorResponse: any }){}
}

export type EsriApiActions = InitializeApi | InitializeApiSuccess | InitializeApiFailure;
