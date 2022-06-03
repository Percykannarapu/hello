import * as fromActions from './esri.init.actions';

export interface EsriInitState {
  isInitialized: boolean;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  isRefreshing: boolean;
  tokenResponse: __esri.IdentityManagerRegisterTokenProperties;
}

const initialState: EsriInitState = {
  isInitialized: false,
  isAuthenticated: false,
  isAuthenticating: false,
  isRefreshing: false,
  tokenResponse: null
};

export function initReducer(state = initialState, action: fromActions.EsriInitActions) : EsriInitState {
  switch (action.type) {
    case fromActions.EsriInitActionTypes.InitializeComplete:
      return {
        ...state,
        isInitialized: true,
      };
    case fromActions.EsriInitActionTypes.Authenticate:
      return { ...state, isAuthenticating: true };
    case fromActions.EsriInitActionTypes.AuthenticateSuccess:
      return {
        ...state,
        isAuthenticating: false,
        isAuthenticated: true,
        tokenResponse: action.payload.tokenResponse
      };
    case fromActions.EsriInitActionTypes.TokenRefresh:
      return { ...state, isRefreshing: true };
    case fromActions.EsriInitActionTypes.RefreshSuccess:
      return {
        ...state,
        isRefreshing: false,
        tokenResponse: action.payload.tokenResponse
      };
    case fromActions.EsriInitActionTypes.AuthenticateFailure:
    case fromActions.EsriInitActionTypes.RefreshFailure:
      return {
        ...state,
        isAuthenticating: false,
        isRefreshing: false,
        isAuthenticated: false,
        tokenResponse: null
      };
    default:
      return state;
  }
}
