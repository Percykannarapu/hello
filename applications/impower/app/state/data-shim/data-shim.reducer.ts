import { DataShimActions, DataShimActionTypes } from './data-shim.actions';

export interface DataShimState {
  projectIsLoaded: boolean;
  projectIsLoading: boolean;
  projectIsSaving: boolean;
  layersAreReady: boolean;
  deleteCustomTa: boolean;
  deleteMustCover: boolean;
  deleteCustomData: boolean;
}

const initialState: DataShimState = {
  projectIsLoaded: false,
  projectIsLoading: false,
  projectIsSaving: false,
  layersAreReady: false,
  deleteCustomTa: false,
  deleteMustCover: false,
  deleteCustomData: false,
};

export function dataShimReducer(state = initialState, action: DataShimActions) : DataShimState {
  switch (action.type) {
    case DataShimActionTypes.LayerSetupComplete:
      return {
        ...state,
        layersAreReady: true,
      };
    case DataShimActionTypes.ProjectSaveAndLoad:
    case DataShimActionTypes.ProjectSaveAndNew:
      return {
        ...state,
        projectIsSaving: true,
        projectIsLoading: false,
        projectIsLoaded: false
      };
    case DataShimActionTypes.ProjectSaveFailure:
      return {
        ...state,
        projectIsSaving: false,
        projectIsLoading: false,
        projectIsLoaded: true
      };
    case DataShimActionTypes.ProjectSaveSuccess:
      return {
        ...state,
        projectIsSaving: false,
      };
    case DataShimActionTypes.ProjectCreateNew:
    case DataShimActionTypes.ProjectLoad:
      return {
        ...state,
        projectIsSaving: false,
        projectIsLoaded: false,
        projectIsLoading: true,
        layersAreReady: false,
      };
    case DataShimActionTypes.ProjectLoadFailure:
      return {
        ...state,
        projectIsLoaded: false,
        projectIsLoading: false,
      };
    case DataShimActionTypes.ProjectCreateNewComplete:
    //case DataShimActionTypes.ProjectLoadSuccess:
    case DataShimActionTypes.ProjectLoadFinish:
      return {
        ...state,
        projectIsLoaded: true,
        projectIsLoading: false,
      };
    case DataShimActionTypes.DeleteCustomTAGeos:
      return{
        ...state,
        deleteCustomTa: true,
      };
    case DataShimActionTypes.DeleteMustCoverGeos:
      return {
        ...state,
        deleteMustCover: true,
      };
    case DataShimActionTypes.DeleteCustomData:
      return {
        ...state,
        deleteCustomData: true,
      };      
    default:
      return state;
  }
}
