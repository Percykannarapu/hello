import { LegendData } from '../app.interfaces';
import { ApplicationStartup, InitActionTypes } from '../init/init.actions';
import { PopupActions, PopupActionTypes } from '../popup/popup.actions';
import { DeleteRfpUiEditDetail, DeleteRfpUiEditDetails, RfpUiEditDetailActionTypes, UpdateRfpUiEditDetail, UpdateRfpUiEditDetails, UpsertRfpUiEditDetail, UpsertRfpUiEditDetails } from '../rfpUiEditDetail/rfp-ui-edit-detail.actions';
import { SharedActions, SharedActionTypes } from './shared.actions';

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
   legendData: LegendData[];
   legendTitle: string;
   legendUpdateCounter: number;
   grisSize: 'small' | 'large' | 'none';
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
   legendData: [],
   legendTitle: '',
   legendUpdateCounter: 0,
   grisSize: null
};

type ReducerActions = SharedActions | PopupActions | ApplicationStartup |
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
     case InitActionTypes.ApplicationStartup:
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
      case SharedActionTypes.SetLegendData:
         return {
           ...state,
           legendData: action.payload.legendData,
           legendTitle: action.payload.legendTitle
         };
      case SharedActionTypes.SetLegendHTML:
         return { ...state, legendUpdateCounter: state.legendUpdateCounter + 1 };
      case SharedActionTypes.SetGridSize:
         return {
           ...state,
           grisSize: action.payload.gridSize
         };   
      default:
         return state;
   }
}

