import { SharedActions, SharedActionTypes } from './shared.actions';

export interface SharedState {
   groupId: number;
   appReady: boolean;
   entitiesLoading: boolean;
   rfpUiReviewLoaded: boolean;
   rfpUiEditLoaded: boolean;
   rfpUiEditDetailLoaded: boolean;
   activeMediaPlanId: number;
}

const initialState: SharedState = {
   groupId: null,
   appReady: false,
   entitiesLoading: false,
   rfpUiReviewLoaded: false,
   rfpUiEditLoaded: false,
   rfpUiEditDetailLoaded: false,
   activeMediaPlanId: null
};

export function sharedReducer(state = initialState, action: SharedActions) : SharedState {
   switch (action.type) {
      case SharedActionTypes.SetActiveMediaPlanId:
         return { ...state, activeMediaPlanId: action.payload.mediaPlanId };
      case SharedActionTypes.RfpUiEditLoaded:
         return { ...state, rfpUiEditLoaded: action.payload.rfpUiEditLoaded };
      case SharedActionTypes.RfpUiEditDetailLoaded:
         return { ...state, rfpUiEditDetailLoaded: action.payload.rfpUiEditDetailLoaded };
      case SharedActionTypes.RfpUiReviewLoaded:
         return { ...state, rfpUiReviewLoaded: action.payload.rfpUiReviewLoaded };
      case SharedActionTypes.EntitiesLoading:
         return { ...state,  entitiesLoading: action.payload.entitiesLoading };
      case SharedActionTypes.SetGroupId:
         return { ...state, groupId: action.payload };
      case SharedActionTypes.SetAppReady:
         return { ...state, appReady: action.payload };
      default:
         return state;
   }
}