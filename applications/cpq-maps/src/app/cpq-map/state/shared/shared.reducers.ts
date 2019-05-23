import { PopupActions, PopupActionTypes } from '../popup/popup.actions';
import { DeleteRfpUiEditDetail, DeleteRfpUiEditDetails, RfpUiEditDetailActionTypes, UpdateRfpUiEditDetail, UpdateRfpUiEditDetails, UpsertRfpUiEditDetail, UpsertRfpUiEditDetails } from '../rfpUiEditDetail/rfp-ui-edit-detail.actions';
import { UpdateRfpUiEditWraps } from '../rfpUiEditWrap/rfp-ui-edit-wrap.actions';
import { SharedActions, SharedActionTypes, SetLegendHTML } from './shared.actions';

export enum shadingType {
  SITE,
  ZIP,
  WRAP_ZONE,
  ATZ_DESIGNATOR,
  ATZ_INDICATOR,
  VARIABLE
}
export interface SharedState {
   groupId: number;
   activeMediaPlanId: number;
   radius: number;
   analysisLevel: string;
   threshold: string;
   promoDateFrom: Date;
   promoDateTo: Date;
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
   threshold: null,
   promoDateFrom: null,
   promoDateTo: null,
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

type ReducerActions = SharedActions | PopupActions |
  UpsertRfpUiEditDetail | UpsertRfpUiEditDetails |
  UpdateRfpUiEditDetail | UpdateRfpUiEditDetails |
  DeleteRfpUiEditDetail | DeleteRfpUiEditDetails;

function mergeAndDedupeIds(currentIds: number[], additionalIds: number | number[]) : number[] {
  const deduped = new Set(currentIds);
  if (Array.isArray(additionalIds)) {
    additionalIds.forEach(id => deduped.add(id));
  } else {
    deduped.add(additionalIds);
  }
  return Array.from(deduped);
}

export function sharedReducer(state = initialState, action: ReducerActions) : SharedState {
   const adds: number[] = [];
   const updates: number[] = [];
   switch (action.type) {
     case RfpUiEditDetailActionTypes.DeleteRfpUiEditDetail:
       const filteredDelete = state.newLineItemIds.filter(id => id !== Number(action.payload.id));
       return {
         ...state,
         newLineItemIds: filteredDelete
       };
     case RfpUiEditDetailActionTypes.DeleteRfpUiEditDetails:
       const deleteSet = new Set(action.payload.ids);
       const filteredDeletes = state.newLineItemIds.filter(id => deleteSet.has(id.toString()));
       return {
         ...state,
         newLineItemIds: filteredDeletes
       };
     case RfpUiEditDetailActionTypes.UpdateRfpUiEditDetail:
       return {
         ...state,
         editedLineItemIds: mergeAndDedupeIds(state.editedLineItemIds, action.payload.rfpUiEditDetail.id as number)
       };
     case RfpUiEditDetailActionTypes.UpdateRfpUiEditDetails:
       return {
         ...state,
         editedLineItemIds: mergeAndDedupeIds(state.editedLineItemIds, action.payload.rfpUiEditDetails.map(d => d.id as number))
       };
     case SharedActionTypes.SaveMediaPlan:
       return { ...state, isSaving: true };
     case SharedActionTypes.SaveSucceeded:
     case SharedActionTypes.SaveFailed:
       return { ...state, isSaving: initialState.isSaving };
     case RfpUiEditDetailActionTypes.UpsertRfpUiEditDetail:
       if (action.payload.rfpUiEditDetail.commonMbuId != null) {
         updates.push(action.payload.rfpUiEditDetail['@ref']);
       } else {
         adds.push(action.payload.rfpUiEditDetail['@ref']);
       }
       return {
         ...state,
         editedLineItemIds: mergeAndDedupeIds(state.editedLineItemIds, updates),
         newLineItemIds: mergeAndDedupeIds(state.newLineItemIds, adds)
       };
     case RfpUiEditDetailActionTypes.UpsertRfpUiEditDetails:
       action.payload.rfpUiEditDetails.forEach(d => {
         if (d.commonMbuId != null) {
           updates.push(d['@ref']);
         } else {
           adds.push(d['@ref']);
         }
       });
       return {
         ...state,
         editedLineItemIds: mergeAndDedupeIds(state.editedLineItemIds, updates),
         newLineItemIds: mergeAndDedupeIds(state.newLineItemIds, adds)
       };
     case SharedActionTypes.ApplicationStartup:
         return {
           ...state,
           groupId: action.payload.groupId,
           activeMediaPlanId: action.payload.mediaPlanId,
           radius: action.payload.radius,
           analysisLevel: action.payload.analysisLevel,
           threshold: action.payload.threshold,
           promoDateFrom: action.payload.promoDateFrom,
           promoDateTo: action.payload.promoDateTo,
          };

      case SharedActionTypes.SetIsDistrQtyEnabled:
         return { ...state, isDistrQtyEnabled: action.payload.isDistrQtyEnabled };
      case SharedActionTypes.SetIsWrap:
         return { ...state, isWrap: action.payload.isWrap };

      case SharedActionTypes.SetAppReady:
         return { ...state, appReady: action.payload };
      case PopupActionTypes.PopupGeoToggle:
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

