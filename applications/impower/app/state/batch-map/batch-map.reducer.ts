import { BatchMapActions, BatchMapActionTypes } from './batch-map.actions';

export interface BatchMapState {
  batchMode: boolean;
  nextSiteNum: string;
  isLastSite: boolean;
  mapReady: boolean;
  moving: boolean;
  displayBatchMapDialog: boolean;
  currentSiteNum: string;
  adminDialog: boolean;
  forceMapUpdate: boolean;
}

export const initialState: BatchMapState = {
  batchMode: false,
  nextSiteNum: null,
  isLastSite: false,
  mapReady: false,
  moving: true,
  displayBatchMapDialog: false,
  currentSiteNum: null,
  adminDialog: false,
  forceMapUpdate: false,

};

export function batchMapReducer(state = initialState, action: BatchMapActions) : BatchMapState {
  switch (action.type) {
    case BatchMapActionTypes.SetBatchMode:
      return {
        ...state,
        batchMode: true
      };
    case BatchMapActionTypes.SetMapReady:
      return {
        ...state,
        mapReady: action.payload.mapReady
      };
    case BatchMapActionTypes.SiteMoved:
      return {
        ...state,
        nextSiteNum: action.payload.siteNum,
        isLastSite: action.payload.isLastSite,
      };
    case BatchMapActionTypes.MoveToSite:
      return {
        ...state,
        nextSiteNum: null,
        moving: true,
      };
    case BatchMapActionTypes.OpenBatchMapDialog:
      return {
        ...state,
        displayBatchMapDialog: true
      };
    case BatchMapActionTypes.CloseBatchMapDialog:
      return {
        ...state,
        displayBatchMapDialog: false
      };
    case BatchMapActionTypes.SetCurrentSiteNum:
      return {
        ...state,
        currentSiteNum: action.payload.currentSiteNum
      };
    case BatchMapActionTypes.BatchMapAdminDialogOpen:
      return {
        ...state,
        adminDialog: true
      };
    case BatchMapActionTypes.BatchMapAdminDialogClose:
      return {
        ...state,
        adminDialog: false
      };
    case BatchMapActionTypes.ForceMapUpdate:
      return {
        ...state,
        forceMapUpdate: true
      };
    case BatchMapActionTypes.ResetForceMapUpdate:
      return {
        ...state,
        forceMapUpdate: false
      };
    case BatchMapActionTypes.MapViewUpdating:
      return {
        ...state,
        moving: action.payload.isUpdating
      };
    default:
      return state;
  }
}
