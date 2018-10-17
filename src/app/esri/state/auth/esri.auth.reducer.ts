import * as fromActions from './esri.auth.actions';
import { TokenResponse } from '../../core/esri-utils';

export interface EsriAuthState {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  tokenResponse: TokenResponse;
  errorResponse: any;
}

const initialState: EsriAuthState = {
  isAuthenticated: false,
  isAuthenticating: false,
  tokenResponse: null,
  errorResponse: null
};

export function authReducer(state = initialState, action: fromActions.EsriAuthActions) : EsriAuthState {
  switch (action.type) {
    case fromActions.EsriAuthActionTypes.Authenticate:
      return { ...state, isAuthenticating: true };
    case fromActions.EsriAuthActionTypes.AuthenticateFailure:
      return {
        ...state,
        isAuthenticating: false,
        isAuthenticated: false,
        tokenResponse: null,
        errorResponse: action.payload.errorResponse
      };
    case fromActions.EsriAuthActionTypes.AuthenticateSuccess:
      return {
        ...state,
        isAuthenticating: false,
        isAuthenticated: true,
        tokenResponse: action.payload.tokenResponse,
        errorResponse: null
      };
    default:
      return state;
  }
}
