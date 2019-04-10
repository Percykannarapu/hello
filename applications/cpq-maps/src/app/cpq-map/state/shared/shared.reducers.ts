import { RfpUiEditDetailActionTypes, UpsertRfpUiEditDetail, UpsertRfpUiEditDetails } from '../rfpUiEditDetail/rfp-ui-edit-detail.actions';
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

   editedLineItemIds: number[];
   newLineItemIds: number[];
}

const initialState: SharedState = {
   groupId: null,
   activeMediaPlanId: null,
   radius: null,
   analysisLevel: null,

   appReady: false,

   isWrap: false,
   isDistrQtyEnabled: false,
   popupGeoToggle: 0,

   editedLineItemIds: [],
   newLineItemIds: [],
};

type ReducerActions = SharedActions | UpsertRfpUiEditDetail | UpsertRfpUiEditDetails;

export function sharedReducer(state = initialState, action: ReducerActions) : SharedState {
   switch (action.type) {
     case RfpUiEditDetailActionTypes.UpsertRfpUiEditDetail:
       const update = {
         editedLineItemIds: [...state.editedLineItemIds],
         newLineItemIds: [...state.newLineItemIds]
       };
       if (action.payload.rfpUiEditDetail.commonMbuId != null) {
         update.editedLineItemIds.push(action.payload.rfpUiEditDetail['@ref']);
       } else {
         update.newLineItemIds.push(action.payload.rfpUiEditDetail['@ref']);
       }
       return {
         ...state,
         ...update
       };
     case RfpUiEditDetailActionTypes.UpsertRfpUiEditDetails:
       const updates = {
         editedLineItemIds: [...state.editedLineItemIds],
         newLineItemIds: [...state.newLineItemIds]
       };
       const editedDetails = action.payload.rfpUiEditDetails.filter(d => d.commonMbuId != null);
       const newDetails = action.payload.rfpUiEditDetails.filter(d => d.commonMbuId == null);
       if (editedDetails.length > 0) {
         updates.editedLineItemIds.push(...editedDetails.map(d => d['@ref']));
       }
       if (newDetails.length > 0) {
         updates.newLineItemIds.push(...newDetails.map(d => d['@ref']));
       }
       return {
         ...state,
         ...updates
       };
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

