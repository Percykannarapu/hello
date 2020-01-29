import { Action } from '@ngrx/store';
import { TokenResponse } from '../../core/esri-utils';

export enum EsriInitActionTypes {
  Initialize = '[Esri] Initialize Configuration',
  Authenticate = '[Esri] Authenticate',
  AuthenticateSuccess = '[Esri] Authenticate Success',
  AuthenticateFailure = '[Esri] Authenticate Failure',
}

export class Initialize implements Action {
    readonly type = EsriInitActionTypes.Initialize;
}

export class Authenticate implements Action {
  readonly type = EsriInitActionTypes.Authenticate;
}

export class AuthenticateSuccess implements Action {
  readonly type = EsriInitActionTypes.AuthenticateSuccess;
  constructor(public payload: { tokenResponse: TokenResponse }){}
}

export class AuthenticateFailure implements Action {
  readonly type = EsriInitActionTypes.AuthenticateFailure;
  constructor(public payload: { errorResponse: any }){}
}

export type EsriInitActions = Initialize | Authenticate | AuthenticateSuccess | AuthenticateFailure;
