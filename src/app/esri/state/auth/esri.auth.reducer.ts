import * as fromActions from './esri.auth.actions';
import { TokenResponse } from '../../core/esri-utils';

export interface EsriAuthState {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  tokenResponse: TokenResponse;
}

const initialState: EsriAuthState = {
  isAuthenticated: false,
  isAuthenticating: false,
  tokenResponse: null
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
        tokenResponse: null
      };
    case fromActions.EsriAuthActionTypes.AuthenticateSuccess:
      return {
        ...state,
        isAuthenticating: false,
        isAuthenticated: true,
        tokenResponse: action.payload.tokenResponse
      };
    default:
      return state;
  }
}
