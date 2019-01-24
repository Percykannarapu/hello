import { ConfirmationActions, ConfirmationActionTypes } from './confirmation.actions';
import { Action } from '@ngrx/store';

export interface ConfirmationState {
  isVisible: boolean;
  title: string;
  message: string;
  explicitlyClosable: boolean;
  acceptLabel: string;
  rejectLabel: string;
  acceptResult: Action | Action[];
  rejectResult: Action | Action[];
}

const initialState: ConfirmationState = {
  isVisible: false,
  title: '',
  message: '',
  explicitlyClosable: false,
  acceptLabel: 'Yes',
  rejectLabel: 'No',
  acceptResult: null,
  rejectResult: null
};

export function confirmationReducer(state = initialState, action: ConfirmationActions) : ConfirmationState {
  switch (action.type) {
    case ConfirmationActionTypes.HideConfirmation:
      return {
        ...state,
        isVisible: false,
        acceptResult: null,
        rejectResult: null
      };
    case ConfirmationActionTypes.ShowConfirmation:
      return {
        ...state,
        isVisible: true,
        title: action.payload.title,
        message: action.payload.message,
        explicitlyClosable: action.payload.canBeClosed,
        acceptLabel: action.payload.accept.label ? action.payload.accept.label : initialState.acceptLabel,
        acceptResult: action.payload.accept.result,
        rejectLabel: action.payload.reject.label ? action.payload.reject.label : initialState.rejectLabel,
        rejectResult: action.payload.reject.result
      };
    default:
      return state;
  }
}
