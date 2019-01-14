import { SharedActions, SharedActionTypes } from './shared.actions';

export interface SharedState {
   groupId: number;
   appReady: boolean;
}

const initialState: SharedState = {
   groupId: null,
   appReady: false
};

export function sharedReducer(state = initialState, action: SharedActions) : SharedState {
   switch (action.type) {
      case SharedActionTypes.SetGroupId:
         return { ...state, groupId: action.payload };
      case SharedActionTypes.SetAppReady:
         return { ...state, appReady: action.payload };
      default:
         return state;
   }
}