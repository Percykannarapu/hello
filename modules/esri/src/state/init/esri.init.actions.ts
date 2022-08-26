import { createAction, props } from '@ngrx/store';

export const initialize = createAction('[Esri] Initialize Configuration');
export const initializeComplete = createAction('[Esri] Initialization Complete');

export const authenticate = createAction('[Esri] Authenticate');
export const authenticateSuccess = createAction(
  '[Esri] Authenticate Success',
  props<{ tokenResponse: __esri.IdentityManagerRegisterTokenProperties }>()
);
export const authenticateFailure = createAction(
  '[Esri] Authenticate Failure',
  props<{ errorResponse: any }>()
);

export const tokenRefresh = createAction('[Esri] Token Refresh');
export const refreshSuccess = createAction(
  '[Esri] Refresh Success',
  props<{ tokenResponse: __esri.IdentityManagerRegisterTokenProperties }>()
);
export const refreshFailure = createAction(
  '[Esri] Refresh Failure',
  props<{ errorResponse: any }>()
);

export const changeNetworkStatus = createAction(
  '[Esri] Change Network Status',
  props<{ isOnline: boolean }>()
);
