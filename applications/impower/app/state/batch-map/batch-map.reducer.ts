import { BatchMapActions, BatchMapActionTypes } from './batch-map.actions';

export interface BatchMapState {
  batchMode: boolean;
  nextSiteNum: string;
  isLastSite: boolean;
  mapReady: boolean;
  moving: boolean;
}

export const initialState: BatchMapState = {
  batchMode: false,
  nextSiteNum: null,
  isLastSite: false,
  mapReady: false,
  moving: true
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
        moving: false
      };
    case BatchMapActionTypes.MoveToSite:
      return {
        ...state,
        nextSiteNum: null,
        moving: true,
      };
    default:
      return state;
  }
}
