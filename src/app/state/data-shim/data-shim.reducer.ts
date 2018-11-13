import { DataShimActions, DataShimActionTypes } from './data-shim.actions';

export interface DataShimState {
  projectIsLoaded: boolean;
  projectIsLoading: boolean;
  projectIsSaving: boolean;
}

const initialState: DataShimState = {
  projectIsLoaded: true,
  projectIsLoading: false,
  projectIsSaving: false
};

export function dataShimReducer(state = initialState, action: DataShimActions) : DataShimState {
  switch (action.type) {
    case DataShimActionTypes.ProjectSaveAndLoad:
    case DataShimActionTypes.ProjectSaveAndNew:
    case DataShimActionTypes.ProjectSave:
      return {
        ...state,
        projectIsSaving: true
      };
    case DataShimActionTypes.ProjectSaveFailure:
      return {
        ...state,
        projectIsSaving: false,
      };
    case DataShimActionTypes.ProjectSaveSuccess:
      return {
        ...state,
        projectIsSaving: false
      };
    case DataShimActionTypes.ProjectCreateNew:
    case DataShimActionTypes.ProjectLoad:
      return {
        ...state,
        projectIsLoaded: false,
        projectIsLoading: true
      };
    case DataShimActionTypes.ProjectLoadFailure:
      return {
        ...state,
        projectIsLoaded: false,
        projectIsLoading: false,
      };
    case DataShimActionTypes.ProjectCreateNewComplete:
    case DataShimActionTypes.ProjectLoadSuccess:
      return {
        ...state,
        projectIsLoaded: true,
        projectIsLoading: false,
      };
    default:
      return state;
  }
}
