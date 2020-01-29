import { TokenResponse } from '../../core/esri-utils';
import * as fromActions from './esri.init.actions';

export interface EsriInitState {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  tokenResponse: TokenResponse;
}

const initialState: EsriInitState = {
  isAuthenticated: false,
  isAuthenticating: false,
  tokenResponse: null
};

export function initReducer(state = initialState, action: fromActions.EsriInitActions) : EsriInitState {
  switch (action.type) {
    case fromActions.EsriInitActionTypes.Authenticate:
      return { ...state, isAuthenticating: true };
    case fromActions.EsriInitActionTypes.AuthenticateFailure:
      return {
        ...state,
        isAuthenticating: false,
        isAuthenticated: false,
        tokenResponse: null
      };
    case fromActions.EsriInitActionTypes.AuthenticateSuccess:
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
