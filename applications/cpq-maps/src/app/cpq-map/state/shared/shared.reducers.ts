import { SharedActions, SharedActionTypes } from './shared.actions';

export interface SharedState {
   groupId: number;
   activeMediaPlanId: number;
   radius: number;
   analysisLevel: string;

   appReady: boolean;

   isWrap: boolean;
   isDistrQtyEnabled: boolean;
   popupGeoToggle: number;
}

const initialState: SharedState = {
   groupId: null,
   activeMediaPlanId: null,
   radius: null,
   analysisLevel: null,

   appReady: false,

   isWrap: false,
   isDistrQtyEnabled: false,
   popupGeoToggle: 0
};

export function sharedReducer(state = initialState, action: SharedActions) : SharedState {
   switch (action.type) {
      case SharedActionTypes.ApplicationStartup:
         return {
           ...state,
           groupId: action.payload.groupId,
           activeMediaPlanId: action.payload.mediaPlanId,
           radius: action.payload.radius,
           analysisLevel: action.payload.analysisLevel
         };

      case SharedActionTypes.SetIsDistrQtyEnabled:
         return { ...state, isDistrQtyEnabled: action.payload.isDistrQtyEnabled };
      case SharedActionTypes.SetIsWrap:
         return { ...state, isWrap: action.payload.isWrap };


      case SharedActionTypes.SetAppReady:
         return { ...state, appReady: action.payload };
      case SharedActionTypes.PopupGeoToggle:
         return { ...state, popupGeoToggle: state.popupGeoToggle + 1 };
      default:
         return state;
   }
}

