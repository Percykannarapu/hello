import { SharedActions, SharedActionTypes } from './shared.actions';

export interface SharedState {
   groupId: number;
   appReady: boolean;
   entitiesLoading: boolean;
   rfpUiReviewLoaded: boolean;
   rfpUiEditLoaded: boolean;
   rfpUiEditDetailLoaded: boolean;
   activeMediaPlanId: number;
   radius: number;
   analysisLevel: string;
   isWrap: boolean;
}

const initialState: SharedState = {
   groupId: null,
   appReady: false,
   entitiesLoading: false,
   rfpUiReviewLoaded: false,
   rfpUiEditLoaded: false,
   rfpUiEditDetailLoaded: false,
   activeMediaPlanId: null,
   radius: null,
   analysisLevel: null,
   isWrap: false
};

export function sharedReducer(state = initialState, action: SharedActions) : SharedState {
   switch (action.type) {
      case SharedActionTypes.SetIsWrap:
         return { ...state, isWrap: action.payload.isWrap };
      case SharedActionTypes.SetAnalysisLevel:
         return { ...state, analysisLevel: action.payload.analysisLevel };
      case SharedActionTypes.SetRadius:
         return { ...state, radius: action.payload.radius };
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