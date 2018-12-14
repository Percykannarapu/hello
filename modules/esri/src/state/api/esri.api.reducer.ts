import { EsriApiActionTypes, EsriApiActions } from './esri.api.actions';

export interface EsriApiState {
  isLoading: boolean;
  isLoaded: boolean;
}

export const initialState: EsriApiState = {
  isLoaded: false,
  isLoading: false
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
      };
    case EsriApiActionTypes.InitializeApiSuccess:
      return {
        isLoading: false,
        isLoaded: true,
      };
    default:
      return state;
  }
}
