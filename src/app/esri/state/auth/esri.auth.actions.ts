import { Action } from '@ngrx/store';
import { TokenResponse } from '../../core/esri-utils';

export enum EsriAuthActionTypes {
  Authenticate = '[Esri] Authenticate',
  AuthenticateSuccess = '[Esri] Authenticate Success',
  AuthenticateFailure = '[Esri] Authenticate Failure',
}

export class Authenticate implements Action {
  readonly type = EsriAuthActionTypes.Authenticate;
}

export class AuthenticateSuccess implements Action {
  readonly type = EsriAuthActionTypes.AuthenticateSuccess;
  constructor(public payload: { tokenResponse: TokenResponse }){}
}

export class AuthenticateFailure implements Action {
  readonly type = EsriAuthActionTypes.AuthenticateFailure;
  constructor(public payload: { errorResponse: any }){}
}

export type EsriAuthActions = Authenticate | AuthenticateSuccess | AuthenticateFailure;
