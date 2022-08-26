import { createReducer, on } from '@ngrx/store';
import * as fromActions from './esri.init.actions';

export interface EsriInitState {
  isInitialized: boolean;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  isRefreshing: boolean;
  tokenResponse: __esri.IdentityManagerRegisterTokenProperties;
  isOnline: boolean;
}

const initialState: EsriInitState = {
  isInitialized: false,
  isAuthenticated: false,
  isAuthenticating: false,
  isRefreshing: false,
  tokenResponse: null,
  isOnline: true,
};

export const initReducer = createReducer(
  initialState,

  on(fromActions.initializeComplete, (state) => {
    return { ...state, isInitialized: true };
  }),

  on(fromActions.authenticate, (state) => {
    return { ...state, isAuthenticating: true };
  }),
  on(fromActions.authenticateSuccess, (state, { tokenResponse }) => {
    return {
      ...state,
      isAuthenticating: false,
      isAuthenticated: true,
      tokenResponse: tokenResponse
    };
  }),

  on(fromActions.tokenRefresh, (state) => {
    return { ...state, isRefreshing: true };
  }),
  on(fromActions.refreshSuccess, (state, { tokenResponse }) => {
    return {
      ...state,
      isRefreshing: false,
      tokenResponse: tokenResponse
    };
  }),

  on(fromActions.authenticateFailure,
     fromActions.refreshFailure, state => {
    return {
      ...state,
      isAuthenticating: false,
      isRefreshing: false,
      isAuthenticated: false,
      tokenResponse: null
    };
  })
);
