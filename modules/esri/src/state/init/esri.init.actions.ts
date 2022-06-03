import { Action } from '@ngrx/store';

export enum EsriInitActionTypes {
  Initialize = '[Esri] Initialize Configuration',
  InitializeComplete = '[Esri] Initialization Complete',
  Authenticate = '[Esri] Authenticate',
  AuthenticateSuccess = '[Esri] Authenticate Success',
  AuthenticateFailure = '[Esri] Authenticate Failure',
  TokenRefresh = '[Esri] Token Refresh',
  RefreshSuccess = '[Esri] Refresh Success',
  RefreshFailure = '[Esri] Refresh Failure',
}

export class Initialize implements Action {
    readonly type = EsriInitActionTypes.Initialize;
}

export class InitializeComplete implements Action {
  readonly type = EsriInitActionTypes.InitializeComplete;
}

export class Authenticate implements Action {
  readonly type = EsriInitActionTypes.Authenticate;
}

export class AuthenticateSuccess implements Action {
  readonly type = EsriInitActionTypes.AuthenticateSuccess;
  constructor(public payload: { tokenResponse: __esri.IdentityManagerRegisterTokenProperties }){}
}

export class AuthenticateFailure implements Action {
  readonly type = EsriInitActionTypes.AuthenticateFailure;
  constructor(public payload: { errorResponse: any }){}
}

export class TokenRefresh implements Action {
  readonly type = EsriInitActionTypes.TokenRefresh;
}

export class RefreshSuccess implements Action {
  readonly type = EsriInitActionTypes.RefreshSuccess;
  constructor(public payload: { tokenResponse: __esri.IdentityManagerRegisterTokenProperties }){}
}

export class RefreshFailure implements Action {
  readonly type = EsriInitActionTypes.RefreshFailure;
  constructor(public payload: { errorResponse: any }){}
}

export type EsriInitActions = Initialize | InitializeComplete |
  Authenticate | AuthenticateSuccess | AuthenticateFailure |
  TokenRefresh | RefreshSuccess | RefreshFailure;
