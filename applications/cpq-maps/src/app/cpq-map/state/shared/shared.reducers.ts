import { RfpUiEditDetailActionTypes, UpsertRfpUiEditDetail, UpsertRfpUiEditDetails } from '../rfpUiEditDetail/rfp-ui-edit-detail.actions';
import { SharedActions, SharedActionTypes, SetLegendHTML } from './shared.actions';

export enum shadingType {
  SITE,
  ZIP,
  WRAP_ZONE,
  ATZ_DESIGNATOR,
  VARIABLE
}
export interface SharedState {
   groupId: number;
   activeMediaPlanId: number;
   radius: number;
   analysisLevel: string;
   appReady: boolean;
   isSaving: boolean;
   isWrap: boolean;
   isDistrQtyEnabled: boolean;
   popupGeoToggle: number;
   editedLineItemIds: number[];
   newLineItemIds: number[];
   shadingType: shadingType;
   shadingData: Array<{key: string | Number, value: number[]}>;
   legendUpdateCounter: number;
}

const initialState: SharedState = {
   groupId: null,
   activeMediaPlanId: null,
   radius: null,
   analysisLevel: null,
   appReady: false,
   isSaving: false,
   isWrap: false,
   isDistrQtyEnabled: false,
   popupGeoToggle: 0,
   editedLineItemIds: [],
   newLineItemIds: [],
   shadingType: shadingType.SITE,
   shadingData: [],
   legendUpdateCounter: 0
};

type ReducerActions = SharedActions | UpsertRfpUiEditDetail | UpsertRfpUiEditDetails;

export function sharedReducer(state = initialState, action: ReducerActions) : SharedState {
   switch (action.type) {
     case SharedActionTypes.SaveMediaPlan:
       return { ...state, isSaving: true };
     case SharedActionTypes.SaveSucceeded:
     case SharedActionTypes.SaveFailed:
       return { ...state, isSaving: initialState.isSaving };
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
      case SharedActionTypes.SetShadingType:
         return { ...state, shadingType: action.payload.shadingType };
      case SharedActionTypes.SetShadingData:
         return { ...state, shadingData: action.payload.shadingData };
      case SharedActionTypes.SetLegendHTML:
         return { ...state, legendUpdateCounter: state.legendUpdateCounter + 1 };
      default:
         return state;
   }
}

