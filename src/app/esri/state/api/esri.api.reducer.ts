import { EsriApiActionTypes, EsriApiActions } from './esri.api.actions';

export interface EsriApiState {
  isLoading: boolean;
  isLoaded: boolean;
  errorResponse: any;
}

export const initialState: EsriApiState = {
  isLoaded: false,
  isLoading: false,
  errorResponse: null
};

export function apiReducer(state = initialState, action: EsriApiActions) : EsriApiState {
  switch (action.type) {
    case EsriApiActionTypes.InitializeApi:
      return {
        ...state,
        isLoading: true,
        isLoaded: false
      };
    case EsriApiActionTypes.InitializeApiFailure:
      return {
        isLoaded: false,
        isLoading: false,
        errorResponse: action.payload.errorResponse
      };
    case EsriApiActionTypes.InitializeApiSuccess:
      return {
        isLoading: false,
        isLoaded: true,
        errorResponse: null
      };
    default:
      return state;
  }
}
